"""
JWT Authentication & Role-Based Access Control (RBAC) Service — Phase 10: System Hardening
"""

import base64
import hashlib
import hmac
import json
import logging
import time
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("janvaani.auth")

SECRET_KEY = "JANVAANI_SIH_2026_PRODUCTION_HARDENED_JWT_SECRET_KEY_X902"
ALGORITHM = "HS256"

# ── Pre-seeded Demo Accounts for RBAC ──────────────────────────────────────────
DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "admin@janvaani.gov.in": {
        "user_id": "USR-ADM-001",
        "email": "admin@janvaani.gov.in",
        "name": "Dr. Rajesh Verma",
        "role": "admin",
        "department": "Central Municipal Intelligence Directorate",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        "permissions": ["all", "system_config", "user_management", "override_priority"],
    },
    "supervisor.north@janvaani.gov.in": {
        "user_id": "USR-SUP-002",
        "email": "supervisor.north@janvaani.gov.in",
        "name": "Ananya Sharma",
        "role": "supervisor",
        "department": "North Zone Sanitation & Drainage",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
        "permissions": ["dispatch_worker", "escalate_incident", "approve_resolution"],
    },
    "worker.ramesh@janvaani.gov.in": {
        "user_id": "USR-WRK-003",
        "email": "worker.ramesh@janvaani.gov.in",
        "name": "Ramesh Kumar (Field Lead)",
        "role": "field_worker",
        "department": "Ward 3 Rapid Action Fleet",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        "permissions": ["accept_task", "submit_evidence", "update_worker_status"],
    },
    "citizen.deepak@gmail.com": {
        "user_id": "USR-CIT-004",
        "email": "citizen.deepak@gmail.com",
        "name": "Deepak Malhotra",
        "role": "citizen",
        "department": "Public Citizen",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        "permissions": ["report_complaint", "support_incident", "comment"],
    },
}

security = HTTPBearer(auto_error=False)


class AuthService:
    def __init__(self):
        self.secret = SECRET_KEY.encode('utf-8')

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

    def _base64url_decode(self, data: str) -> bytes:
        padding = '=' * (4 - len(data) % 4)
        return base64.urlsafe_b64decode(data + padding)

    def create_access_token(self, payload: Dict[str, Any], expires_in_seconds: int = 86400) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        claims = dict(payload)
        claims["exp"] = int(time.time()) + expires_in_seconds
        claims["iat"] = int(time.time())
        claims["iss"] = "janvaani-auth-server"

        header_b64 = self._base64url_encode(json.dumps(header).encode('utf-8'))
        claims_b64 = self._base64url_encode(json.dumps(claims).encode('utf-8'))

        to_sign = f"{header_b64}.{claims_b64}".encode('utf-8')
        signature = hmac.new(self.secret, to_sign, hashlib.sha256).digest()
        sig_b64 = self._base64url_encode(signature)

        return f"{header_b64}.{claims_b64}.{sig_b64}"

    def decode_token(self, token: str) -> Dict[str, Any]:
        try:
            parts = token.split(".")
            if len(parts) != 3:
                raise ValueError("Invalid JWT format")

            header_b64, claims_b64, sig_b64 = parts
            to_sign = f"{header_b64}.{claims_b64}".encode('utf-8')

            expected_sig = hmac.new(self.secret, to_sign, hashlib.sha256).digest()
            actual_sig = self._base64url_decode(sig_b64)

            if not hmac.compare_digest(expected_sig, actual_sig):
                raise ValueError("JWT signature verification failed")

            claims = json.loads(self._base64url_decode(claims_b64).decode('utf-8'))
            if claims.get("exp", 0) < time.time():
                raise ValueError("Token has expired")

            return claims
        except Exception as e:
            logger.warning(f"JWT decode error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def authenticate_user(self, email: str, role: str = "admin") -> Dict[str, Any]:
        email = email.strip().lower()
        if email in DEMO_USERS:
            user = DEMO_USERS[email]
        else:
            user = {
                "user_id": f"USR-CUSTOM-{int(time.time())}",
                "email": email,
                "name": email.split("@")[0].capitalize(),
                "role": role if role in ["admin", "supervisor", "field_worker", "citizen"] else "citizen",
                "department": "Municipal Operations",
                "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                "permissions": ["standard_access"],
            }

        token = self.create_access_token({
            "sub": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "permissions": user["permissions"],
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,
            "user": user
        }


auth_service = AuthService()


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        # Fallback to anonymous public citizen if unauthenticated
        return {
            "user_id": "USR-ANON-CITIZEN",
            "email": "anonymous@citizen.public",
            "name": "Anonymous Citizen",
            "role": "citizen",
            "permissions": ["report_complaint", "support_incident"],
        }
    return auth_service.decode_token(credentials.credentials)


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role", "citizen")
        if user_role not in allowed_roles and "admin" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not authorized to perform this operation. Allowed: {allowed_roles}"
            )
        return current_user
    return role_checker
