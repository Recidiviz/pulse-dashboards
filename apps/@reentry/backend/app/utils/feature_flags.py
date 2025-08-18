import os

from app.core.config import settings


def is_feature_enabled(
    feature_name: str, current_env: str = settings.ENV_NAME.lower()
) -> bool:
    env_var_name = f"RECIDIVIZ_ENVIRONMENT_{feature_name}"
    enabled_environments = os.getenv(env_var_name, "")

    if not enabled_environments:
        return False

    # split by comma
    env_list = [env.strip().lower() for env in enabled_environments.split(",")]

    return current_env in env_list
