import uuid
from typing import Tuple

from app.core.data_config.output_configs.output_config import (
    IntakeSummaryConfigFile,
)
from app.utils.llm_agent_qa import LLMAgentQA


async def generate_summary(
    formatted_messages: str,
    output_config: IntakeSummaryConfigFile,
    client_pseudo_id: str | None = None,
) -> Tuple[str, str]:
    """
    Generate a summary from intake messages.

    Args:
        formatted_messages: A string containing formatted intake messages
        output_config: Output configuration (required)
        client_pseudo_id: Optional client pseudo ID for LangSmith trace legibility

    Returns:
        A formatted summary string
    """

    # Require config
    if not output_config:
        raise ValueError(
            "output_config is required - cannot generate summary without configuration"
        )

    INTAKE_SUMMARY_SYSTEM_PROMPT = output_config.prompts.system

    SUMMARY_PROMPT = output_config.prompts.template

    system_prompt = INTAKE_SUMMARY_SYSTEM_PROMPT.format(
        Conversation=formatted_messages,
    )

    # Create semantic thread_id for LangSmith legibility
    unique_id = uuid.uuid4().hex[:8]
    client_id_suffix = f"-{client_pseudo_id[:8]}" if client_pseudo_id else ""
    semantic_thread_id = f"intake-summary-{unique_id}{client_id_suffix}"

    agent = LLMAgentQA(
        system_prompt=system_prompt,
        thread_id=semantic_thread_id,
        model_config=output_config.model,
        run_name="Intake-Summary-Generation",
        workflow_type="intake_summary",
        client_pseudo_id=client_pseudo_id,
    )

    summary_prompt = SUMMARY_PROMPT.format(
        Conversation=formatted_messages,
        # assessment=assessment
    )
    summary = await agent.call(summary_prompt)

    # Return as tuple consistently
    return summary
