from pathlib import Path
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.tracers.langchain import LangChainTracer
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langsmith import Client
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_prefix="RECIDIVIZ_",
        extra="ignore",
    )
    ENV_NAME: str = "dev"  # "dev", "demo", "staging", or "prod"
    # to deploy on GCP, set DEPLOY_ENV to "gcp"
    DEPLOY_ENV: str = "local"  # "local" or "gcp"
    GCP_DB_INSTANCE_NAME: str = ""  # <PROJECT_ID>:<REGION>:<INSTANCE_NAME>

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "recidiviz"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = "https://us.api.openai.com/v1"
    DATABASE_URL_TESTS: str = (
        "postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test"
    )
    LANGCHAIN_API_KEY: str | None = None
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_ENDPOINT: str | None = "https://api.smith.langchain.com"
    LANGCHAIN_PROJECT: str | None = "dev-recidiviz"
    ANTHROPIC_API_KEY: str | None = None
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:4200"

    EVAL_MODEL_PROVIDER: str = "openai"
    EVAL_MODEL_NAME: str = "o4-mini"
    EVAL_MODEL_VERSION: str = ""
    # https://platform.openai.com/docs/models
    # https://docs.anthropic.com/en/docs/about-claude/models
    GOOGLE_GENAI_API_KEY: str | None = None

    REDIS_URL: str = "redis://localhost:6379"

    # External resources API configuration
    EXTERNAL_RESOURCES_API_URL: str
    RESOURCES_API_KEY: str

    #### Authentication Middleware Configuration ####
    ENABLE_AUTH_MIDDLEWARE: bool = True
    AUTH0_AUDIENCE: str
    AUTH0_CLIENT_ID: str
    AUTH0_DOMAIN: str

    JWT_ALGORITHM: str
    JWT_SECRET_KEY: str
    INTAKE_VERIFICATION_MAX_ATTEMPTS: int = 3
    INTAKE_VERIFICATION_COOLOFF_TIME: int = 10

    # BigQuery settings
    BQ_PROJECT_ID: str = "recidiviz-rnd-planner"
    BQ_DATASET: str = "reentry"
    BQ_CASE_MANAGER_TABLE: str = "case_manager_dev"
    BQ_SUPERVISION_OFFICER_TABLE: str = "supervision_officer_dev"
    BQ_CLIENT_TABLE: str = "client_dev"

    # Sentry settings
    SENTRY_DSN: str = ""

    # Google Cloud Storage settings
    GCS_BUCKET_NAME: str

    # Deepgram API key (secret) - used for API requests
    DEEPGRAM_API_KEY: str

    # Deepgram API Key ID (identifier shown in console)
    # Used to verify webhook requests in the dg-token header
    DEEPGRAM_API_KEY_ID: str = ""

    # Deepgram callback configuration - set to True to use callback URLs for async transcription
    DEEPGRAM_CALLBACK: bool = False

    # Transcription service provider, deepgram or gcp
    DIARIZATION_SERVICE: str = "deepgram"

    # Base URL for the application (used for webhook callbacks)
    BASE_URL: str = "http://localhost:8000"

    # Google Cloud Service account email.
    # In demo-staging-prod this value is populated as an env variable.
    # See the Cloudbuild.yaml files.
    # For local dev, it is set to empty here; the value will be provided
    # by the backend/.secrets/gcp-service-account.json.
    GCS_SERVICE_ACCOUNT_EMAIL: str = ""

    # Firebase Admin Project ID
    # Used for client authentication for clients logging in from the Edovo platform
    FIREBASE_ADMIN_PROJECT_ID: str = "recidiviz-dashboard-staging"

    # Config Management password protection
    # In demo/staging/prod, this should be set via Secret Manager.
    # When set, users must enter this password to access config management.
    # When empty/unset, password gate is disabled (e.g. local/dev).
    CONFIG_MANAGEMENT_PASSWORD: str = ""
    # Token expiry in minutes for config management access
    CONFIG_ACCESS_TOKEN_EXPIRY_MINUTES: int = 30
    # Token expiry for backend-issued client intake sessions, set in seconds (default: 8 hours)
    BACKEND_ISSUED_INTAKE_TOKEN_EXPIRY_SECONDS: int = 28800

    # Impersonation - Recidiviz Data API for fetching target user metadata
    DATA_API_URL: str = ""
    GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE: str = ""

    # Slack webhook URLs for intake completion notifications (JSON: {"US_NE": "url", "default": "url"})
    SLACK_INTAKE_WEBHOOK_URLS: str | None = None

    @property
    def DATABASE_URL(self):
        if self.DEPLOY_ENV == "gcp":
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@/{self.POSTGRES_DB}?host=/cloudsql/{self.GCP_DB_INSTANCE_NAME}"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()


def create_model_from_config(provider: str, name: str, version: str | None):
    """
    Create a LangChain model instance from configuration parameters.

    Args:
        provider: Model provider ('openai', 'anthropic', or 'google')
        name: Model name (e.g., 'gpt-4', 'claude-3-5-sonnet', 'gemini-2.0-flash')
        version: Model version (e.g., '2024-11-20', '20241022', 'exp-0205')

    Returns:
        ChatOpenAI, ChatAnthropic, or ChatGoogleGenerativeAI instance
    """
    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY must be set to use OpenAI models")
        model_name = f"{name}-{version}" if version else name
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=model_name,
            base_url=settings.OPENAI_BASE_URL,
        )
    elif provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY must be set to use Anthropic models")
        model_name = f"{name}-{version}" if version else name
        return ChatAnthropic(
            anthropic_api_key=settings.ANTHROPIC_API_KEY, model_name=model_name
        )
    elif provider == "google":
        if not settings.GOOGLE_GENAI_API_KEY:
            raise ValueError(
                "GOOGLE_GENAI_API_KEY must be set to use Google Gemini models"
            )
        model_name = f"{name}-{version}" if version else name
        return ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_GENAI_API_KEY, model=model_name
        )
    else:
        raise ValueError(f"Unknown model provider: {provider}")


if (
    settings.LANGCHAIN_API_KEY is None
    or settings.LANGCHAIN_ENDPOINT is None
    or settings.LANGCHAIN_PROJECT is None
    or not settings.LANGCHAIN_TRACING_V2
):
    langsmith_client = tracer = None
else:
    langsmith_client = Client(
        api_key=settings.LANGCHAIN_API_KEY,
        api_url=settings.LANGCHAIN_ENDPOINT,
    )
    tracer = LangChainTracer(
        client=langsmith_client, project_name=settings.LANGCHAIN_PROJECT
    )


if settings.DIARIZATION_SERVICE == "deepgram" and settings.DEEPGRAM_API_KEY is None:
    raise ValueError("missing deepgram api key")
elif (
    settings.DIARIZATION_SERVICE != "gcp" and settings.DIARIZATION_SERVICE != "deepgram"
):
    raise ValueError("unknown diarization service")
