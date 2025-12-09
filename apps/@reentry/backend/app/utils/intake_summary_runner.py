import random
from typing import List, Tuple

from pydantic import BaseModel

from app.core.data_config.output_configs.output_config import (
    IntakeSummaryConfigFile,
)
from app.models.assessment import Assessment
from app.utils.llm_agent_qa import LLMAgentQA


class SummaryResponse(BaseModel):
    summary: str


def format_assessments_list(assessments: List[Assessment]) -> str:
    """
    Format a list of assessments into a readable string.

    Args:
        assessments: A list of Assessment objects

    Returns:
        A formatted string with assessment information
    """
    if not assessments:
        return "No assessments available."

    formatted_output = "Assessments Summary:\n"

    for i, assessment in enumerate(assessments):
        formatted_output += f"\nAssessment #{i+1} (ID: {assessment.id})\n"
        formatted_output += f"Client ID: {assessment.client_pseudo_id}\n"
        formatted_output += f"Status: {assessment.status}\n"

        assessment_str = assessment.to_str()
        if assessment_str:
            formatted_output += "Risk scores:" + assessment_str + "\n"
            formatted_output += "Steps"
        else:
            formatted_output += "No scores available yet.\n"

    return formatted_output


async def generate_summary(
    formatted_messages: str,
    assessments: List[Assessment],
    output_config: IntakeSummaryConfigFile,
) -> Tuple[str, str]:
    """
    Generate a summary from intake messages.

    Args:
        formatted_messages: A string containing formatted intake messages
        assessments: A list of Assessment objects
        output_config: Output configuration (required)

    Returns:
        A formatted summary string
    """

    # Require config
    if not output_config:
        raise ValueError(
            "output_config is required - cannot generate summary without configuration"
        )

    # Format assessments for inclusion in the prompt
    formatted_assessments = assessments if assessments else ""

    INTAKE_SUMMARY_SYSTEM_PROMPT = output_config.prompts.system

    ASSESSMENT_PROMPT = output_config.prompts.assessment_summarize_template

    SUMMARY_PROMPT = output_config.prompts.template

    system_prompt = INTAKE_SUMMARY_SYSTEM_PROMPT.format(
        Conversation=formatted_messages, Assessments=formatted_assessments
    )

    agent = LLMAgentQA(
        system_prompt=system_prompt,
        # random thread_id for now
        thread_id=random.randint(0, 100000),
        model_config=output_config.model,
    )

    assessment_prompt = ASSESSMENT_PROMPT.format(Assessments=formatted_assessments)

    assessment = await agent.call(assessment_prompt)
    summary_prompt = SUMMARY_PROMPT.format(
        Conversation=formatted_messages, assessment=assessment
    )
    summary = await agent.call(summary_prompt)

    # Return as tuple consistently
    return summary, assessment
