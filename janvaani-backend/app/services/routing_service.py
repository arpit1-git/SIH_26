"""
Routing & Verification Service — Phase 8: OSRM & OR-Tools Route Optimization Engine

Features:
- OSRM street-network routing integration (distance, duration, GeoJSON polylines, turn-by-turn instructions).
- Google OR-Tools Multi-Stop TSP Solver for field worker dispatch optimization.
- Robust fallbacks: Haversine distance matrix + 2-Opt TSP refinement algorithm.
"""

import math
import logging
import httpx
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("janvaani.routing")

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"

# Try importing Google OR-Tools
try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False
    logger.warning("Google OR-Tools not installed. Using 2-Opt heuristic solver for route optimization.")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


async def fetch_osrm_route(coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Call OSRM API for driving route through a list of (lat, lon) waypoints.
    `coordinates` format: [(lat1, lon1), (lat2, lon2), ...]
    OSRM URL requires format: lon1,lat1;lon2,lat2;...
    """
    if len(coordinates) < 2:
        return {"error": "At least 2 coordinates required for routing."}

    coord_str = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in coordinates)
    url = f"{OSRM_BASE_URL}/{coord_str}?overview=full&geometries=geojson&steps=true"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    steps = []
                    for leg in route.get("legs", []):
                        for step in leg.get("steps", []):
                            name = step.get("name") or "Road"
                            maneuver = step.get("maneuver", {}).get("type", "turn")
                            dist = round(step.get("distance", 0) / 1000.0, 2)
                            dur = round(step.get("duration", 0) / 60.0, 1)
                            steps.append({
                                "instruction": f"{maneuver.replace('_', ' ').title()} onto {name}",
                                "distance_km": dist,
                                "duration_min": dur,
                                "location": [step["maneuver"]["location"][1], step["maneuver"]["location"][0]]
                            })

                    return {
                        "success": True,
                        "provider": "OSRM Street Network",
                        "distance_km": round(route["distance"] / 1000.0, 2),
                        "duration_min": round(route["duration"] / 60.0, 1),
                        "geometry": route["geometry"],  # GeoJSON LineString
                        "steps": steps,
                    }
    except Exception as e:
        logger.warning(f"OSRM service call failed: {e}. Using fallback geometry.")

    # Fallback geometry if OSRM is offline
    total_dist = 0.0
    for i in range(len(coordinates) - 1):
        total_dist += haversine_distance(
            coordinates[i][0], coordinates[i][1],
            coordinates[i+1][0], coordinates[i+1][1]
        )

    # Average city driving speed ~25 km/h
    est_duration_min = round((total_dist / 25.0) * 60.0, 1)
    geojson_geometry = {
        "type": "LineString",
        "coordinates": [[lon, lat] for lat, lon in coordinates]
    }

    fallback_steps = []
    for idx, (lat, lon) in enumerate(coordinates):
        fallback_steps.append({
            "instruction": f"Waypoint {idx + 1}: Navigate to site location",
            "distance_km": round(total_dist / max(1, len(coordinates) - 1), 2),
            "duration_min": round(est_duration_min / max(1, len(coordinates) - 1), 1),
            "location": [lat, lon]
        })

    return {
        "success": True,
        "provider": "Haversine Fallback Engine",
        "distance_km": round(total_dist, 2),
        "duration_min": est_duration_min,
        "geometry": geojson_geometry,
        "steps": fallback_steps,
    }


def _solve_tsp_ortools(distance_matrix: List[List[int]]) -> List[int]:
    """Solve Travelling Salesperson Problem using Google OR-Tools."""
    num_locations = len(distance_matrix)
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)
    if not solution:
        return list(range(num_locations))

    index = routing.Start(0)
    route = []
    while not routing.IsEnd(index):
        route.append(manager.IndexToNode(index))
        index = solution.Value(routing.NextVar(index))
    return route


def _solve_tsp_2opt(points: List[Tuple[float, float]]) -> List[int]:
    """Greedy Nearest Neighbor + 2-Opt refinement fallback TSP solver."""
    n = len(points)
    unvisited = set(range(1, n))
    route = [0]
    curr = 0

    while unvisited:
        nxt = min(
            unvisited,
            key=lambda i: haversine_distance(points[curr][0], points[curr][1], points[i][0], points[i][1])
        )
        route.append(nxt)
        unvisited.remove(nxt)
        curr = nxt

    # 2-Opt optimization pass
    improved = True
    while improved:
        improved = False
        for i in range(1, n - 1):
            for j in range(i + 1, n):
                d1 = haversine_distance(points[route[i-1]][0], points[route[i-1]][1], points[route[i]][0], points[route[i]][1]) + \
                     haversine_distance(points[route[j]][0], points[route[j]][1], points[route[(j+1)%n]][0], points[route[(j+1)%n]][1])
                d2 = haversine_distance(points[route[i-1]][0], points[route[i-1]][1], points[route[j]][0], points[route[j]][1]) + \
                     haversine_distance(points[route[i]][0], points[route[i]][1], points[route[(j+1)%n]][0], points[route[(j+1)%n]][1])
                if d2 < d1:
                    route[i:j+1] = reversed(route[i:j+1])
                    improved = True

    return route


async def optimize_field_route(
    worker_lat: float,
    worker_lng: float,
    incidents: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calculate optimal multi-stop route for a field worker starting from worker_lat/worker_lng
    and visiting all assigned incidents in optimal order.
    """
    if not incidents:
        return {
            "worker_location": [worker_lat, worker_lng],
            "total_stops": 0,
            "optimized_order": [],
            "route": None,
        }

    # Points: index 0 is worker position, 1..N are incident positions
    all_points = [(worker_lat, worker_lng)] + [
        (inc["latitude"], inc["longitude"]) for inc in incidents
    ]

    solver_used = "2-Opt Heuristic"
    if HAS_ORTOOLS and len(all_points) > 2:
        try:
            # Build integer distance matrix in meters
            dist_matrix = []
            for p1 in all_points:
                row = []
                for p2 in all_points:
                    dist_m = int(haversine_distance(p1[0], p1[1], p2[0], p2[1]) * 1000)
                    row.append(dist_m)
                dist_matrix.append(row)

            order_indices = _solve_tsp_ortools(dist_matrix)
            solver_used = "Google OR-Tools VRP"
        except Exception as e:
            logger.warning(f"OR-Tools solver error: {e}. Falling back to 2-Opt.")
            order_indices = _solve_tsp_2opt(all_points)
    else:
        order_indices = _solve_tsp_2opt(all_points)

    # Reorder coordinates for route fetching
    ordered_points = [all_points[i] for i in order_indices]
    
    # Map back to ordered incidents
    ordered_incidents = []
    for idx in order_indices:
        if idx == 0:
            continue
        inc = incidents[idx - 1]
        ordered_incidents.append(inc)

    # Fetch OSRM route for ordered points
    route_details = await fetch_osrm_route(ordered_points)

    return {
        "success": True,
        "solver": solver_used,
        "worker_location": [worker_lat, worker_lng],
        "total_stops": len(incidents),
        "ordered_incidents": ordered_incidents,
        "route_summary": {
            "total_distance_km": route_details.get("distance_km"),
            "total_duration_min": route_details.get("duration_min"),
            "provider": route_details.get("provider"),
        },
        "geometry": route_details.get("geometry"),
        "navigation_steps": route_details.get("steps"),
    }
