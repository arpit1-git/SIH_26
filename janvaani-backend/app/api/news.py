"""
Civic News & Social Updates API for JANVAANI (Phase 6).
Provides public access to AI-generated civic bulletins, emergency alerts,
trending community surges, and verified resolution spotlights.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import app.store as store
from app.services.news_service import generate_civic_news_bulletins

router = APIRouter(prefix="/api/news", tags=["News & Civic Social Updates"])


@router.get("", summary="Get AI Civic News & Social Bulletins")
async def get_news(
    bulletin_type: Optional[str] = Query(None, description="Filter by type: alert, trending, hotspot, resolved"),
    limit: int = Query(25, le=50),
    offset: int = Query(0, ge=0),
):
    """
    Returns AI-generated civic news bulletins and public awareness updates.
    No login required.
    """
    all_bulletins = generate_civic_news_bulletins()

    # Apply reactions override from store if modified
    for b in all_bulletins:
        b_id = b["id"]
        if b_id in store.news_likes:
            b["likes_count"] = store.news_likes[b_id]
        if b_id in store.news_shares:
            b["shares_count"] = store.news_shares[b_id]

    if bulletin_type and bulletin_type != "all":
        all_bulletins = [b for b in all_bulletins if b.get("type") == bulletin_type]

    total = len(all_bulletins)
    page = all_bulletins[offset : offset + limit]

    # Metrics summary for the news feed header
    summary = {
        "total_bulletins": total,
        "critical_alerts": sum(1 for b in all_bulletins if b.get("type") == "alert"),
        "trending_surges": sum(1 for b in all_bulletins if b.get("type") == "trending"),
        "resolved_spotlights": sum(1 for b in all_bulletins if b.get("type") == "resolved"),
        "chronic_hotspots": sum(1 for b in all_bulletins if b.get("type") == "hotspot"),
    }

    return {
        "summary": summary,
        "total": total,
        "limit": limit,
        "offset": offset,
        "bulletins": page,
    }


@router.post("/{bulletin_id}/like", summary="Like an AI news bulletin")
async def like_news_bulletin(bulletin_id: str):
    """Like a civic news card or bulletin."""
    current = store.news_likes.get(bulletin_id, 12)
    new_count = current + 1
    store.news_likes[bulletin_id] = new_count
    return {"bulletin_id": bulletin_id, "likes_count": new_count}


@router.post("/{bulletin_id}/share", summary="Increment share count for a bulletin")
async def share_news_bulletin(bulletin_id: str):
    """Register citizen share of a bulletin."""
    current = store.news_shares.get(bulletin_id, 3)
    new_count = current + 1
    store.news_shares[bulletin_id] = new_count
    return {"bulletin_id": bulletin_id, "shares_count": new_count}
