from taskiq import InMemoryBroker
from taskiq_redis import ListQueueBroker, RedisAsyncResultBackend

from app.core.config import settings

if settings.ENV_NAME == "pytest":
    broker = InMemoryBroker()
else:
    redis_async_result = RedisAsyncResultBackend(
        redis_url=settings.REDIS_URL, result_ex_time=864000
    )
    broker = ListQueueBroker(url=settings.REDIS_URL).with_result_backend(
        redis_async_result
    )
