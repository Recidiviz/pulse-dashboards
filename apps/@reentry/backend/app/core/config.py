from typing import Optional

from langchain.callbacks.tracers import LangChainTracer
from langsmith import Client
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
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
    OPENAI_API_KEY: Optional[str] = "lalalal"
    DATABASE_URL_TESTS: str = (
        "postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test"
    )
    LANGCHAIN_API_KEY: str | None = None
    LANGCHAIN_TRACING_V2: bool = True
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGCHAIN_PROJECT: str = "dev-recidiviz"
    ANTHROPIC_API_KEY: str | None = None
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    DT_MODEL_PROVIDER: str = "openai"
    DT_MODEL_NAME: str = "o4-mini"
    DT_MODEL_VERSION: str = "2025-04-16"

    GEN_MODEL_PROVIDER: str = "openai"
    GEN_MODEL_NAME: str = "o4-mini"
    GEN_MODEL_VERSION: str = "2025-04-16"

    EVAL_MODEL_PROVIDER: str = "openai"
    EVAL_MODEL_NAME: str = "gpt-4o"
    EVAL_MODEL_VERSION: str = "2024-11-20"
    # https://platform.openai.com/docs/models
    # https://docs.anthropic.com/en/docs/about-claude/models

    REDIS_URL: str = "redis://localhost:6379"

    FABRK_API_URL: str = "https://api.fabrk.ai"
    FABRK_BEARER_TOKEN: str
    # External resources API configuration
    USE_EXTERNAL_RESOURCES_API: bool = False
    EXTERNAL_RESOURCES_API_URL: Optional[str] = None
    RESOURCES_API_KEY: Optional[str] = None

    ALLOW_EXPERIMENTS: bool = False
    VCR_CLIENT_INTAKE: bool = False

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

    # ASSESSMENT SETTINGS
    DEFAULT_ASSESSMENT_TYPE: str = "oras_rt"

    # reCAPTCHA settings
    RECAPTCHA_SECRET_KEY: str = "your_recaptcha_secret_key"

    # Sentry settings
    SENTRY_DSN: str = ""

    # Google Cloud Storage settings
    GCS_BUCKET_NAME: str

    # Deepgram api key
    DEEPGRAM_API_KEY: str

    # Transcription service provider, deepgram or gcp
    DIARIZATION_SERVICE: str = "deepgram"

    # Google Cloud Service account email.
    # In demo-staging-prod this value is populated as an env variable.
    # See the Cloudbuild.yaml files.
    # For local dev, it is set to empty here; the value will be provided
    # by the backend/.secrets/gcp-service-account.json.
    GCS_SERVICE_ACCOUNT_EMAIL: str = ""

    @property
    def DATABASE_URL(self):
        if self.DEPLOY_ENV == "gcp":
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@/{self.POSTGRES_DB}?host=/cloudsql/{self.GCP_DB_INSTANCE_NAME}"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()

if settings.LANGCHAIN_API_KEY is None:
    langsmith_client = tracer = None
else:
    langsmith_client = Client(
        api_key=settings.LANGCHAIN_API_KEY,
        api_url=settings.LANGCHAIN_ENDPOINT,
    )
    tracer = LangChainTracer(client=langsmith_client, project_name="dev-recidiviz")


if settings.OPENAI_API_KEY is None and (
    settings.DT_MODEL_PROVIDER == "openai" or settings.GEN_MODEL_PROVIDER == "openai"
):
    raise ValueError("OPENAI_API_KEY must be set in order to use OpenAI models")
if settings.ANTHROPIC_API_KEY is None and (
    settings.DT_MODEL_PROVIDER == "anthropic"
    or settings.GEN_MODEL_PROVIDER == "anthropic"
):
    raise ValueError("ANTHROPIC_API_KEY must be set in order to use Anthropic models")

if settings.DT_MODEL_PROVIDER == "openai":
    from langchain_openai import ChatOpenAI

    model_name = settings.DT_MODEL_NAME
    if settings.DT_MODEL_VERSION:
        model_name += f"-{settings.DT_MODEL_VERSION}"
    dt_model = ChatOpenAI(openai_api_key=settings.OPENAI_API_KEY, model=model_name)
elif settings.DT_MODEL_PROVIDER == "anthropic":
    from langchain_anthropic import ChatAnthropic

    model_name = settings.DT_MODEL_NAME
    if settings.DT_MODEL_VERSION:
        model_name += f"-{settings.DT_MODEL_VERSION}"
    dt_model = ChatAnthropic(
        anthropic_api_key=settings.ANTHROPIC_API_KEY, model_name=model_name
    )
else:
    raise ValueError(f"Unknown model provider: {settings.DT_MODEL_PROVIDER}")

if settings.GEN_MODEL_PROVIDER == "openai":
    from langchain_openai import ChatOpenAI

    model_name = settings.GEN_MODEL_NAME
    if settings.GEN_MODEL_VERSION:
        model_name += f"-{settings.GEN_MODEL_VERSION}"
    gen_model = ChatOpenAI(
        openai_api_key=settings.OPENAI_API_KEY, model_name=model_name
    )
elif settings.GEN_MODEL_PROVIDER == "anthropic":
    from langchain_anthropic import ChatAnthropic

    model_name = settings.GEN_MODEL_NAME
    if settings.GEN_MODEL_VERSION:
        model_name += f"-{settings.GEN_MODEL_VERSION}"
    gen_model = ChatAnthropic(
        anthropic_api_key=settings.ANTHROPIC_API_KEY, model_name=model_name
    )
