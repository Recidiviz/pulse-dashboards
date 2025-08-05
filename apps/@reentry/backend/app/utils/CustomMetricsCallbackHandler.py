from typing import Any, Dict, List

import redis
from langchain.callbacks.base import BaseCallbackHandler

from app.core.config import settings


class CustomMetricsCallbackHandler(BaseCallbackHandler):
    """custom callback handler for metrics in Redis from LangChain.
    Consult the events in https://python.langchain.com/api_reference/core/callbacks/langchain_core.callbacks.base.BaseCallbackHandler.html#langchain-core-callbacks-base-basecallbackhandler
    """

    def __init__(self, redis_client=None, prefix="llm_regenerations") -> None:
        """Initialize callback handler with Redis connection."""
        super().__init__()
        self.redis_client = redis_client or redis.from_url(settings.REDIS_URL)
        self.prefix = prefix

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        """calls to the LLM."""
        # todo: relate the model name used with the call counter
        # model_name = serialized.get("name", "unknown")
        self.increment_redis_counter("total_call_counter", 1)

    def on_llm_end(self, response, **kwargs) -> None:
        """When the LLM call ends."""
        # todo: relate the model name with the token usage
        # model_name = getattr(response, "model_name", "unknown")

        # add to the total success call counter
        self.increment_redis_counter("total_success_calls_counter", 1)

        if hasattr(response, "llm_output"):
            llm_output = response.llm_output
            if "token_usage" in llm_output:
                token_usage = llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    self.increment_redis_counter(
                        "total_tokens_counter", token_usage["total_tokens"]
                    )
                # calculate the cost
                if (
                    "prompt_tokens" in token_usage
                    and "completion_tokens" in token_usage
                ):
                    cost = self.calculate_cost(token_usage, llm_output["model_name"])
                    self.increment_redis_counter("total_cost_counter", cost)

    def on_llm_error(self, error, **kwargs):
        """Handle errors from LLM calls."""
        # todo: identify and categorize the error type to attach with the total error counter
        # error_type = self.categorize_error(error)
        self.increment_redis_counter("total_error_counter", 1)

    def on_retry(self, error, **kwargs):
        """When a retry is made."""
        self.increment_redis_counter("total_retry_counter", 1)

    def increment_redis_counter(self, key: str, value: float):
        self.redis_client.incrbyfloat(f"{self.prefix}_{key}", value)

    def categorize_error(self, error: Exception) -> str:
        error_message = str(error).lower()
        if "rate limit" in error_message:
            return "rate_limit"
        elif "timeout" in error_message:
            return "timeout"
        elif "context length" in error_message:
            return "context_length"
        elif "invalid token" in error_message:
            return "invalid_token"
        else:
            return "other"

    def calculate_cost(self, token_usage: dict, model_name: str) -> float:
        # Defining cost per million tokens
        pricing = {
            "gpt-4o": {"input": 2.50 / 1000000, "output": 10.00 / 1000000},
            "gpt-4o-mini": {"input": 0.15 / 1000000, "output": 0.60 / 1000000},
        }
        prompt_tokens = token_usage["prompt_tokens"]
        completion_tokens = token_usage["completion_tokens"]
        # todo: implement a way to get the model prices from the model name and try to get the actual price from the API
        model_price = pricing.get(model_name, pricing["gpt-4o"])
        print(
            f"Call to model: {model_name} and calculate prices with {model_price} by default."
        )
        input_cost = prompt_tokens * model_price.get("input", 0.0)
        output_cost = completion_tokens * model_price.get("output", 0.0)
        total_cost = input_cost + output_cost
        return round(total_cost, 6)
