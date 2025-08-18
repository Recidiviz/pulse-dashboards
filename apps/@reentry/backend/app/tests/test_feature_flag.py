import os

import structlog

from app.utils.feature_flags import is_feature_enabled

logger = structlog.get_logger(__name__)


def test_is_feature_enabled():
    os.environ["RECIDIVIZ_ENVIRONMENT_TEST_FEATURE"] = "dev,staging"

    result = is_feature_enabled("TEST_FEATURE", "dev")
    assert result, f"Expected True, got {result}"

    result = is_feature_enabled("TEST_FEATURE", "prod")
    assert not result, f"Expected False, got {result}"
