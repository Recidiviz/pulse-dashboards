from anthropic import RateLimitError as AnthropicRateLimitError
from openai import (
    PermissionDeniedError as OpenAIPermissionDeniedError,
)
from openai import (
    RateLimitError as OpenAIRateLimitError,
)

ERRORS_TO_RETRY_ON = (
    AnthropicRateLimitError,
    OpenAIPermissionDeniedError,
    OpenAIRateLimitError,
)

DEFAULT_MAX_RETRIES = 5
