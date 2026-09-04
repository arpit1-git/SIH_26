"""
Authentication & RBAC API Endpoints — Phase 10: System Hardening
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Body, HTTPException, status
from app.services.auth_service import auth_service, get_current_user, require_roles, DEMO_USERS

router = APIRouter(prefix="/api/auth", tags=["Authentication & Security"])


@router.post("/login", summary="User authentication & JWT token generation")
async def login(body: dict = Body(...)):
    """
    Exchanges email/password credentials or demo role selection for a signed JWT Bearer Token.
    Returns access token, expiration, user profile, and RBAC permissions.
    """
    email = body.get("email", "").strip()
    role = body.get("role", "admin")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required for authentication."
        )

    return auth_service.authenticate_user(email, role=role)


@router.get("/me", summary="Verify JWT token & return active user identity")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Verifies the Bearer JWT token in authorization header and returns current user identity.
    """
    return {
        "status": "authenticated",
        "user": current_user
    }


@router.get("/demo-tokens", summary="Get pre-seeded JWT tokens for testing all 5 RBAC roles")
async def get_demo_tokens():
    """
    Generates pre-signed JWT tokens for testing Admin, Supervisor, Field Worker, and Citizen roles.
    Useful for interactive dashboard security sandbox testing.
    """
    tokens = {}
    for email, profile in DEMO_USERS.items():
        role = profile["role"]
        tokens[role] = {
            "profile": profile,
            "auth_response": auth_service.authenticate_user(email, role=role)
        }
    return {
        "message": "Pre-signed RBAC testing tokens generated successfully.",
        "roles": tokens
    }


@router.get("/admin-only", summary="RBAC Protected Route — Requires Admin Role")
async def admin_only_test(user: Dict[str, Any] = Depends(require_roles(["admin"]))):
    """
    Protected endpoint verifying that current user has Admin privileges.
    """
    return {
        "status": "success",
        "message": f"Access granted to Admin user '{user.get('name')}'",
        "granted_role": user.get("role"),
    }


@router.get("/worker-only", summary="RBAC Protected Route — Requires Field Worker or Supervisor Role")
async def worker_only_test(user: Dict[str, Any] = Depends(require_roles(["field_worker", "supervisor", "admin"]))):
    """
    Protected endpoint verifying Field Worker / Operations Supervisor authorization.
    """
    return {
        "status": "success",
        "message": f"Access granted to Municipal Operator '{user.get('name')}'",
        "granted_role": user.get("role"),
    }
