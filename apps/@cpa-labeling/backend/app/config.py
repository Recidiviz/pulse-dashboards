"""Configuration settings for the labeling backend."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="LABELING_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Reentry Database (read-only) - for intake, plan, etc.
    reentry_postgres_user: str = "postgres"
    reentry_postgres_password: str = ""
    reentry_postgres_server: str = "localhost"
    reentry_postgres_port: int = 5432
    reentry_postgres_db: str = "recidiviz"
    reentry_gcp_db_instance_name: str | None = None

    # Labeling Database (read-write) - for labeling_feedback
    labeling_postgres_user: str = "postgres"
    labeling_postgres_password: str = ""
    labeling_postgres_server: str = "localhost"
    labeling_postgres_port: int = 5432
    labeling_postgres_db: str = "labeling"
    labeling_gcp_db_instance_name: str | None = None

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"

    # Auth0
    auth0_domain: str = "login.recidiviz.org"
    auth0_audience: str = "https://api.recidiviz.org"
    skip_auth: bool = False

    # Slack webhook for severe issue alerts
    slack_webhook_url: str | None = None

    @property
    def reentry_database_url(self) -> str:
        """Build the reentry (read-only) database URL."""
        if self.reentry_gcp_db_instance_name:
            # Cloud SQL Unix socket connection
            return f"postgresql+asyncpg://{self.reentry_postgres_user}:{self.reentry_postgres_password}@/{self.reentry_postgres_db}?host={self.reentry_gcp_db_instance_name}"
        else:
            # Standard TCP connection
            return f"postgresql+asyncpg://{self.reentry_postgres_user}:{self.reentry_postgres_password}@{self.reentry_postgres_server}:{self.reentry_postgres_port}/{self.reentry_postgres_db}"

    @property
    def labeling_database_url(self) -> str:
        """Build the labeling (read-write) database URL."""
        if self.labeling_gcp_db_instance_name:
            # Cloud SQL Unix socket connection
            return f"postgresql+asyncpg://{self.labeling_postgres_user}:{self.labeling_postgres_password}@/{self.labeling_postgres_db}?host={self.labeling_gcp_db_instance_name}"
        else:
            # Standard TCP connection
            return f"postgresql+asyncpg://{self.labeling_postgres_user}:{self.labeling_postgres_password}@{self.labeling_postgres_server}:{self.labeling_postgres_port}/{self.labeling_postgres_db}"

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global instance for convenience
settings = get_settings()
