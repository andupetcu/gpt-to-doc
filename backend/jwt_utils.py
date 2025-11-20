"""JWT validation utilities for Clerk integration."""
import os
import jwt
import logging
from functools import wraps
from typing import Optional, Dict, Any
from flask import request, jsonify

logger = logging.getLogger(__name__)

# Clerk JWKS caching
CLERK_JWKS = None
CLERK_JWKS_UPDATED = 0
JWKS_CACHE_DURATION = 3600  # 1 hour


def get_clerk_jwks():
    """Fetch Clerk JWKS with caching."""
    global CLERK_JWKS, CLERK_JWKS_UPDATED
    import time
    import requests

    current_time = time.time()
    if (
        CLERK_JWKS is None
        or (current_time - CLERK_JWKS_UPDATED) > JWKS_CACHE_DURATION
    ):
        try:
            clerk_endpoint = os.getenv("CLERK_ENDPOINT", "").rstrip("/")
            if not clerk_endpoint:
                logger.warning("CLERK_ENDPOINT not configured")
                return None

            jwks_url = f"{clerk_endpoint}/.well-known/jwks.json"
            response = requests.get(jwks_url, timeout=5)
            response.raise_for_status()
            CLERK_JWKS = response.json()
            CLERK_JWKS_UPDATED = current_time
            logger.info("Updated Clerk JWKS")
        except Exception as e:
            logger.error(f"Failed to fetch Clerk JWKS: {e}")
            return None

    return CLERK_JWKS


def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a Clerk JWT token."""
    try:
        # Decode without verification first to get kid
        unverified = jwt.decode(token, options={"verify_signature": False})
        kid = jwt.get_unverified_header(token).get("kid")

        jwks = get_clerk_jwks()
        if not jwks:
            logger.warning("JWKS not available for token verification")
            return None

        # Find the key with matching kid
        key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key = k
                break

        if not key:
            logger.warning(f"Key with kid {kid} not found in JWKS")
            return None

        # Convert JWK to PEM format
        from cryptography.hazmat.primitives.serialization import load_pem_public_key
        from cryptography.hazmat.backends import default_backend
        from jwcrypto import jwk

        public_key = jwk.JWK.from_json(str(key).encode("utf-8"))
        pem = public_key.serialize(private_key=False, format="pem")

        # Verify token
        decoded = jwt.decode(
            token,
            pem,
            algorithms=["RS256"],
            audience=os.getenv("CLERK_AUDIENCE", None),
        )
        return decoded
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None


def require_auth(f):
    """Decorator to require valid Clerk JWT token.

    Makes JWT verification optional - if CLERK_ENDPOINT is not set,
    all requests are allowed (for backwards compatibility).
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        clerk_endpoint = os.getenv("CLERK_ENDPOINT", "").rstrip("/")

        # If Clerk is not configured, allow all requests
        if not clerk_endpoint:
            return f(*args, **kwargs)

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        # Verify token
        payload = verify_clerk_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Store user info in request context
        request.clerk_user = payload
        return f(*args, **kwargs)

    return decorated_function
