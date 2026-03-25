from anthropic import RateLimitError as AnthropicRateLimitError
from openai import (
    APITimeoutError as OpenAITimeoutError,
)
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

INTAKE_ERRORS_TO_RETRY_ON = (
    *ERRORS_TO_RETRY_ON,
    OpenAITimeoutError,
)

DEFAULT_MAX_RETRIES = 5
