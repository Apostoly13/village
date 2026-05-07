"""
Simple in-memory rate limiter — no external dependencies.
Tracks (IP, endpoint) → list[monotonic timestamps].
Safe for asyncio single-threaded event loop. Resets on server restart.
"""
import time
import asyncio
from collections import defaultdict
from fastapi import HTTPException, Request

_rate_buckets: dict = defaultdict(list)


def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """Raise HTTP 429 if key exceeded max_requests within window_seconds."""
    now = time.monotonic()
    cutoff = now - window_seconds
    _rate_buckets[key] = [t for t in _rate_buckets[key] if t > cutoff]
    if len(_rate_buckets[key]) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail="Too many requests — please wait a moment and try again.",
        )
    _rate_buckets[key].append(now)


def rate_limit(request: Request, max_requests: int = 20, window_seconds: int = 60, endpoint: str = "") -> None:
    """FastAPI dependency — rate-limit by client IP + optional endpoint label."""
    ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"{ip}:{endpoint}", max_requests, window_seconds)
