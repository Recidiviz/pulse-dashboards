import asyncio
from typing import Dict, Optional

import redis
from prometheus_client import Counter

from app.core.config import settings

# METRICS FOR REGENERATIONS
llm_regenerations_total_counter = Counter(
    "llm_regenerations_total_counter",
    "Total number of requests made to the endpoint to regenerate plans",
    # ['model', 'endpoint']  # Labels: model used, endpoint called
)

llm_regenerations_total_call_counter = Counter(
    "llm_regenerations_total_call_counter",
    "Total requests made to llm",
    # ['model']  # Labels: model used
)

llm_regenerations_total_tokens_counter = Counter(
    "llm_regenerations_total_tokens_counter",
    "Total tokens used in regenerations",
    # ['model']
)

llm_regenerations_total_success_calls_counter = Counter(
    "llm_regenerations_total_success_calls_counter",
    "Total successful calls to LLM",
    # ['model']
)

llm_regenerations_total_error_counter = Counter(
    "llm_regenerations_total_error_counter",
    "Total failed requests to LLM",
    # ['model', 'error_type']  # error_type: 'timeout', 'rate_limit', 'api_error', etc.
)

llm_regenerations_total_cost_counter = Counter(
    "llm_regenerations_total_cost_counter",
    "Total cumulative cost of calls to LLM (in USD)",
    # ['model']
)

llm_regenerations_total_retry_counter = Counter(
    "llm_regenerations_total_retry_counter",
    "Number of retries when calling LLM",
    # ['model', 'reason']  # reason: 'timeout', 'rate_limit', 'api_error', etc.
)

# END METRICS FOR REGENERATIONS

# METRICS FOR ACTION PLAN CREATION
llm_plan_creation_total_counter = Counter(
    "llm_plan_creation_total_counter",
    "Total number of requests made to the endpoint to regenerate plans",
    # ['model', 'endpoint']  # Labels: model used, endpoint called
)

llm_plan_creation_total_call_counter = Counter(
    "llm_plan_creation_total_call_counter",
    "Total requests made to llm",
    # ['model']  # Labels: model used
)

llm_plan_creation_total_tokens_counter = Counter(
    "llm_plan_creation_total_tokens_counter",
    "Total tokens used in regenerations",
    # ['model']
)

llm_plan_creation_total_success_calls_counter = Counter(
    "llm_plan_creation_total_success_calls_counter",
    "Total successful calls to LLM",
    # ['model']
)

llm_plan_creation_total_error_counter = Counter(
    "llm_plan_creation_total_error_counter",
    "Total failed requests to LLM",
    # ['model', 'error_type']  # error_type: 'timeout', 'rate_limit', 'api_error', etc.
)

llm_plan_creation_total_cost_counter = Counter(
    "llm_plan_creation_total_cost_counter",
    "Total cumulative cost of calls to LLM (in USD)",
    # ['model']
)

llm_plan_creation_total_retry_counter = Counter(
    "llm_plan_creation_total_retry_counter",
    "Number of retries when calling LLM",
    # ['model', 'reason']  # reason: 'timeout', 'rate_limit', 'api_error', etc.
)


class PrometheusBackgroundThreadManager:
    """Class to manage a background thread that polls Redis keys and updates Prometheus metrics."""

    def __init__(self, redis_client: redis.Redis, polling_interval: int = 5):
        self.redis_client = redis_client or redis.from_url(settings.REDIS_URL)
        self.polling_interval = polling_interval
        self.task: Optional[asyncio.Task] = (
            None  # threads is not async, so a task is used to get redis values
        )
        self.running = False
        # only counters set in redis
        self.redis_keys = [
            # Regenerations metrics
            "llm_regenerations_total_tokens_counter",
            "llm_regenerations_total_call_counter",
            "llm_regenerations_total_success_calls_counter",
            "llm_regenerations_total_cost_counter",
            "llm_regenerations_total_error_counter",
            "llm_regenerations_total_retry_counter",
            # Plan creation metrics
            "llm_plan_creation_total_tokens_counter",
            "llm_plan_creation_total_call_counter",
            "llm_plan_creation_total_success_calls_counter",
            "llm_plan_creation_total_cost_counter",
            "llm_plan_creation_total_error_counter",
            "llm_plan_creation_total_retry_counter",
        ]
        self.last_values: Dict[str, int] = {}

    async def start(self):
        """start the background thread"""
        if self.task and not self.task.done():
            return False  # Thread is already running
        self.running = True
        self.task = asyncio.create_task(self._background_task())
        return True

    async def stop(self):
        """Stop the background task"""
        if not self.task:
            return True

        self.running = False
        try:
            # Wait for the task to finish, with timeout
            await asyncio.wait_for(self.task, timeout=10)
            return True
        except asyncio.TimeoutError:
            # If it doesn't finish in the timeout, cancel the task
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            return True
        except Exception as e:
            print(f"Error stopping the task: {str(e)}")
            return False

    async def _get_redis_values(self) -> Dict[str, Optional[int]]:
        """Get multiple values from Redis efficiently"""
        results = {}
        # Create a pipeline to get multiple values in a single Redis call
        async with self.redis_client.pipeline(transaction=False) as pipe:
            # add all get operations to the pipeline
            for key in self.redis_keys:
                pipe.get(key)
            values = await pipe.execute()

            for key, value in zip(self.redis_keys, values):
                try:
                    # Decode bytes if necessary
                    value = value.decode("utf-8") if isinstance(value, bytes) else value
                    results[key] = float(value) if value is not None else 0
                except (ValueError, TypeError) as e:
                    print(f"Error converting value for {key}: {e}")
                    results[key] = 0
        return results

    async def _background_task(self):
        """Background task that polls Redis keys and updates Prometheus metrics."""
        while self.running:
            try:
                values = await self._get_redis_values()
                for key, value in values.items():
                    if value is not None:
                        counter = globals()[key]
                        # Calculate the difference from the last value
                        last_value = self.last_values.get(key, 0)
                        diff = value - last_value
                        if diff > 0:
                            counter.inc(diff)
                        # Update the last value
                        self.last_values[key] = value
            except redis.RedisError as e:
                print(f"Redis error in background task: {str(e)}")
            except Exception as e:
                print(f"Error in background task: {str(e)}")
            # Wait for the next iteration
            await asyncio.sleep(self.polling_interval)

    async def get_status(self) -> Dict:
        """Return the status of the background task"""
        return {
            "running": self.running and (self.task and not self.task.done()),
            "last_values": self.last_values,
            "monitored_keys": self.redis_keys,
        }
