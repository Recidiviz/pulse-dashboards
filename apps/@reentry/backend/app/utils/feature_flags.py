from app.core.config import settings
from app.utils.feature_flags_config import FEATURE_FLAGS


def is_feature_enabled(
    feature_name: str, current_env: str = settings.ENV_NAME.lower()
) -> bool:
    if not feature_name or feature_name not in FEATURE_FLAGS:
        return False

    enabled_environments = FEATURE_FLAGS[feature_name]

    if not enabled_environments:
        return False

    return current_env in [env.lower() for env in enabled_environments]
