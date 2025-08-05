from datetime import datetime, timedelta
from typing import Optional, Tuple
from venv import logger

import redis.asyncio as redis

from app.core.config import settings

# Rate limiting settings
MAX_ATTEMPTS = getattr(settings, "INTAKE_VERIFICATION_MAX_ATTEMPTS", 3)
COOLOFF_TIME = getattr(settings, "INTAKE_VERIFICATION_COOLOFF_TIME", 10)
REDIS_PREFIX = getattr(settings, "REDIS_PREFIX", "dob_verify:")


def get_token_key(token_id: str) -> str:
    """
    Get Redis key for a token's failed attempt tracking.
    """
    return f"{REDIS_PREFIX}token:{token_id}:failed_attempts"


async def record_failed_attempt(
    redis_client: redis.Redis, token_id: str, ip_address: Optional[str] = None
) -> None:
    """
    Record a failed verification attempt in Redis.
    Only failed attempts count toward rate limiting.
    """
    key = get_token_key(token_id)

    now = datetime.utcnow()
    timestamp = now.timestamp()

    member_value = f"{timestamp}:{ip_address or 'unknown'}"

    await redis_client.zadd(key, {member_value: timestamp})

    expiry_seconds = (COOLOFF_TIME * 60) + 600  # cooloff minutes
    await redis_client.expire(key, expiry_seconds)


async def count_recent_failed_attempts(
    redis_client: redis.Redis, token_id: str, minutes: int = COOLOFF_TIME
) -> int:
    """
    Count recent failed verification attempts within the specified time window.
    """
    key = get_token_key(token_id)

    # Calculate cutoff time
    cutoff_time = (datetime.utcnow() - timedelta(minutes=minutes)).timestamp()

    # Count elements with score >= cutoff_time
    return await redis_client.zcount(key, cutoff_time, "+inf")


async def get_last_failed_attempt_time(
    redis_client: redis.Redis, token_id: str
) -> Optional[datetime]:
    """
    Get the timestamp of the last failed verification attempt.
    """
    key = get_token_key(token_id)

    last_attempt = await redis_client.zrevrange(key, 0, 0, withscores=True)

    if not last_attempt:
        return None

    # Return timestamp as datetime
    _, timestamp = last_attempt[0]
    return datetime.fromtimestamp(timestamp)


async def check_cooloff_status(
    redis_client: redis.Redis,
    token_id: str,
) -> Tuple[bool, Optional[int], Optional[datetime]]:
    """
    Check if token is in cool-off period and calculate remaining time.

    Returns:
        Tuple of:
        - is_blocked: Whether the verification is currently blocked
        - remaining_minutes: Minutes until cooloff expires (None if not blocked)
        - next_attempt_time: Datetime when next attempt will be allowed (None if not blocked)
    """
    failed_attempts = await count_recent_failed_attempts(redis_client, token_id)

    if failed_attempts < MAX_ATTEMPTS:
        # Not blocked, allowed to try
        return False, None, None

    last_attempt = await get_last_failed_attempt_time(redis_client, token_id)

    if not last_attempt:
        return False, None, None

    cooloff_expires = last_attempt + timedelta(minutes=COOLOFF_TIME)
    now = datetime.utcnow()

    if now >= cooloff_expires:
        # Cool-off period has expired
        return False, None, None

    # Still in cool-off period
    remaining_seconds = (cooloff_expires - now).total_seconds()

    # Calculate minutes and seconds more precisely
    remaining_minutes = int(remaining_seconds // 60)
    remaining_seconds_fraction = remaining_seconds % 60

    # Round up if there are remaining seconds
    if remaining_seconds_fraction > 0:
        remaining_minutes += 1

    # Ensure it's at least 1 minute if there's any time left
    remaining_minutes = max(1, remaining_minutes)

    return True, remaining_minutes, cooloff_expires


async def get_attempts_remaining(redis_client: redis.Redis, token_id: str) -> int:
    # Count failed attempts
    failed_attempts = await count_recent_failed_attempts(redis_client, token_id)
    return max(0, MAX_ATTEMPTS - failed_attempts)


def format_next_attempt_time(next_attempt_time: datetime) -> str:
    """
    Format the next attempt time in a user-friendly way.
    Note: This returns the time in a standard format which the frontend
    can then convert to the user's local time.
    """
    # ISO format is standard and can be easily parsed by frontend
    logger.error(f"\n\nnext_attempt_time>>{next_attempt_time}\n\n")
    return next_attempt_time.isoformat()
