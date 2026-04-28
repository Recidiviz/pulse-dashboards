"""Unit tests for eval_config helpers."""

from unittest.mock import patch

from app.core.eval_config import (
    get_eval_action_plan_intake_ids,
    get_eval_summary_intake_ids,
)


def test_get_eval_summary_intake_ids_returns_uuids(tmp_path):
    yaml_content = """
eval_intake_ids:
  test_env:
    - "0e1ea73b-da80-4268-a870-fdb42d1eb54f"
eval_action_plan_intake_ids:
  test_env: []
"""
    config_file = tmp_path / "eval_config.yaml"
    config_file.write_text(yaml_content)

    with (
        patch("app.core.eval_config.settings") as mock_settings,
        patch("app.core.eval_config.Path") as mock_path,
    ):
        mock_settings.ENV_NAME = "test_env"
        mock_path.return_value.parent.__truediv__.return_value = config_file

        result = get_eval_summary_intake_ids()
        assert len(result) == 1
        assert str(result[0]) == "0e1ea73b-da80-4268-a870-fdb42d1eb54f"


def test_get_eval_action_plan_intake_ids_returns_uuids(tmp_path):
    yaml_content = """
eval_intake_ids:
  test_env: []
eval_action_plan_intake_ids:
  test_env:
    - "b3f86598-ded4-4c06-b5ff-bf5860503294"
"""
    config_file = tmp_path / "eval_config.yaml"
    config_file.write_text(yaml_content)

    with (
        patch("app.core.eval_config.settings") as mock_settings,
        patch("app.core.eval_config.Path") as mock_path,
    ):
        mock_settings.ENV_NAME = "test_env"
        mock_path.return_value.parent.__truediv__.return_value = config_file

        result = get_eval_action_plan_intake_ids()
        assert len(result) == 1
        assert str(result[0]) == "b3f86598-ded4-4c06-b5ff-bf5860503294"


def test_get_eval_action_plan_intake_ids_returns_empty_for_unknown_env(tmp_path):
    yaml_content = """
eval_intake_ids:
  dev: []
eval_action_plan_intake_ids:
  dev: []
"""
    config_file = tmp_path / "eval_config.yaml"
    config_file.write_text(yaml_content)

    with (
        patch("app.core.eval_config.settings") as mock_settings,
        patch("app.core.eval_config.Path") as mock_path,
    ):
        mock_settings.ENV_NAME = "unknown"
        mock_path.return_value.parent.__truediv__.return_value = config_file

        result = get_eval_action_plan_intake_ids()
        assert result == []
