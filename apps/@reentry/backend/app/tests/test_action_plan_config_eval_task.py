"""Unit tests for action_plan_config_eval_task."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

ACTION_PLAN_YAML = """
metadata:
  output_type: action_plan
  code: test_plan
  version: 1
  display_name: Test Action Plan Config

model:
  provider: openai
  name: gpt-4o
  version: "2024-11-20"

prompts:
  system: You are a helpful assistant.
"""


@pytest.fixture
def mock_intake_messages():
    msg1 = MagicMock()
    msg1.from_role = "client"
    msg1.content = "I need help finding housing."
    msg2 = MagicMock()
    msg2.from_role = "caseworker"
    msg2.content = "We can look into local shelters."
    return [msg1, msg2]


@pytest.fixture
def mock_gen_result():
    result = MagicMock()
    result.action_plan = "# Action Plan\n\n## Step 1\nContact housing authority."
    result.structured_action_plan = MagicMock()
    return result


@pytest.fixture
def mock_eval_scores():
    return {
        "addressed_to_client": {
            "key": "addressed_to_client",
            "score": 8,
            "explanation": "Good.",
        },
        "clarity": {"key": "clarity", "score": 7, "explanation": "Clear steps."},
        "actionable": {
            "key": "actionable",
            "score": 6,
            "explanation": "Mostly actionable.",
        },
        "structure": {
            "key": "structure",
            "score": 8,
            "explanation": "Well structured.",
        },
        "tone": {"key": "tone", "score": 9, "explanation": "Supportive tone."},
        "timeline": {"key": "timeline", "score": 7, "explanation": "Good timeline."},
        "no_judgments": {
            "key": "no_judgments",
            "score": 9,
            "explanation": "No judgments.",
        },
        "citations_source_is_transcript": {
            "key": "citations_source_is_transcript",
            "score": 1,
            "explanation": "Sources verified.",
        },
        "citations_text_verified": {
            "key": "citations_text_verified",
            "score": 1,
            "explanation": "Text verified.",
        },
    }


@pytest.mark.asyncio
async def test_task_processes_intake_and_stores_results(
    mock_intake_messages, mock_gen_result, mock_eval_scores
):
    """Happy path: messages found, plan generated, evaluated, results stored."""
    execution_id = uuid4()
    eval_result_id = uuid4()
    intake_id = str(uuid4())

    mock_eval_result = MagicMock()
    mock_eval_result.id = eval_result_id

    mock_intake_with_address = MagicMock()
    mock_intake_with_address.address = MagicMock()
    mock_intake_with_address.address.as_formatted_string.return_value = (
        "123 Main St, Springfield, IL"
    )

    with (
        patch("app.tasks.action_plan_config_eval_task.execution_context") as mock_ctx,
        patch(
            "app.tasks.action_plan_config_eval_task.OutputFileLoader.validate_yaml_content",
            return_value=MagicMock(),
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_output_config_eval_result_by_id",
            new_callable=AsyncMock,
            return_value=mock_eval_result,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_intake_messages",
            new_callable=AsyncMock,
            return_value=mock_intake_messages,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_intake_with_address_and_recording",
            new_callable=AsyncMock,
            return_value=mock_intake_with_address,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_plan_by_intake_id",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.LLMAgentGenerate"
        ) as mock_agent_cls,
        patch(
            "app.tasks.action_plan_config_eval_task._run_evaluations_gen",
            new_callable=AsyncMock,
            return_value=mock_eval_scores,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.update_output_config_eval_result",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_execution = AsyncMock()
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_execution)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_agent = AsyncMock()
        mock_agent.generate = AsyncMock(return_value=mock_gen_result)
        mock_agent_cls.return_value = mock_agent

        from app.tasks.action_plan_config_eval_task import action_plan_config_eval_task

        await action_plan_config_eval_task.original_func(
            execution_id=execution_id,
            eval_result_id=eval_result_id,
            output_config_yaml=ACTION_PLAN_YAML,
            intake_ids=[intake_id],
            session=AsyncMock(),
        )

        mock_update.assert_called_once()
        call_kwargs = mock_update.call_args.kwargs
        metrics = call_kwargs["metrics"]
        assert metrics["summary"]["n"] == 1
        assert metrics["summary"]["n_successful"] == 1
        assert metrics["summary"]["addressed_to_client_mean"] == 8
        assert len(metrics["intakes"]) == 1
        assert metrics["intakes"][0]["intake_id"] == intake_id


@pytest.mark.asyncio
async def test_task_records_error_when_no_messages():
    """When an intake has no messages, result should have error key."""
    execution_id = uuid4()
    eval_result_id = uuid4()
    intake_id = str(uuid4())

    mock_eval_result = MagicMock()
    mock_eval_result.id = eval_result_id

    with (
        patch("app.tasks.action_plan_config_eval_task.execution_context") as mock_ctx,
        patch(
            "app.tasks.action_plan_config_eval_task.OutputFileLoader.validate_yaml_content",
            return_value=MagicMock(),
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_output_config_eval_result_by_id",
            new_callable=AsyncMock,
            return_value=mock_eval_result,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_intake_messages",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.update_output_config_eval_result",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_execution = AsyncMock()
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_execution)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        from app.tasks.action_plan_config_eval_task import action_plan_config_eval_task

        await action_plan_config_eval_task.original_func(
            execution_id=execution_id,
            eval_result_id=eval_result_id,
            output_config_yaml=ACTION_PLAN_YAML,
            intake_ids=[intake_id],
            session=AsyncMock(),
        )

        call_kwargs = mock_update.call_args.kwargs
        metrics = call_kwargs["metrics"]
        assert metrics["summary"]["n_successful"] == 0
        assert metrics["intakes"][0]["error"] == "No messages found"


@pytest.mark.asyncio
async def test_task_records_error_when_generation_fails(mock_intake_messages):
    """When LLMAgentGenerate raises, result should have error key."""
    execution_id = uuid4()
    eval_result_id = uuid4()
    intake_id = str(uuid4())

    mock_eval_result = MagicMock()
    mock_eval_result.id = eval_result_id

    mock_intake_with_address = MagicMock()
    mock_intake_with_address.address = None

    with (
        patch("app.tasks.action_plan_config_eval_task.execution_context") as mock_ctx,
        patch(
            "app.tasks.action_plan_config_eval_task.OutputFileLoader.validate_yaml_content",
            return_value=MagicMock(),
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_output_config_eval_result_by_id",
            new_callable=AsyncMock,
            return_value=mock_eval_result,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_intake_messages",
            new_callable=AsyncMock,
            return_value=mock_intake_messages,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_intake_with_address_and_recording",
            new_callable=AsyncMock,
            return_value=mock_intake_with_address,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.get_plan_by_intake_id",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "app.tasks.action_plan_config_eval_task.LLMAgentGenerate"
        ) as mock_agent_cls,
        patch(
            "app.tasks.action_plan_config_eval_task.update_output_config_eval_result",
            new_callable=AsyncMock,
        ) as mock_update,
    ):
        mock_execution = AsyncMock()
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_execution)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_agent = AsyncMock()
        mock_agent.generate = AsyncMock(side_effect=RuntimeError("LLM timeout"))
        mock_agent_cls.return_value = mock_agent

        from app.tasks.action_plan_config_eval_task import action_plan_config_eval_task

        await action_plan_config_eval_task.original_func(
            execution_id=execution_id,
            eval_result_id=eval_result_id,
            output_config_yaml=ACTION_PLAN_YAML,
            intake_ids=[intake_id],
            session=AsyncMock(),
        )

        call_kwargs = mock_update.call_args.kwargs
        metrics = call_kwargs["metrics"]
        assert metrics["summary"]["n_successful"] == 0
        assert "error" in metrics["intakes"][0]
