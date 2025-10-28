import structlog

from app.utils.feature_flags import is_feature_enabled

logger = structlog.get_logger(__name__)


def test_is_feature_enabled():
    result = is_feature_enabled("TEST_FEATURE", "dev")
    assert result, f"Expected True, got {result}"

    result = is_feature_enabled("TEST_FEATURE", "prod")
    assert not result, f"Expected False, got {result}"

    result = is_feature_enabled("NON_EXISTENT_FEATURE", "dev")
    assert not result, f"Expected False for non-existent feature, got {result}"
