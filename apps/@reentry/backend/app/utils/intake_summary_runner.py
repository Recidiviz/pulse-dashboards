import random
from typing import List, Tuple

from pydantic import BaseModel

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
    formatted_messages: str, assessments: List[Assessment]
) -> Tuple[str, str]:
    """
    Generate a summary from intake messages.

    Args:
        formatted_messages: A string containing formatted intake messages
        assessments: A list of Assessment objects

    Returns:
        A formatted summary string
    """

    # Format assessments for inclusion in the prompt
    formatted_assessments = assessments if assessments else ""

    INTAKE_SUMMARY_SYSTEM_PROMPT = "You are tasked with assisting a parole officer summarize the information they have about a client. Answer prompts to the best of you ability, remember the client will not see your assessment, only the parole officer. Be clear, precise and concise. Be professional but no need to be friendly."
    ASSESSMENT_PROMPT = (
        "Reformulate this assessment information :\n"
        "{Assessments}\n\n"
        "Format your response with the heading '# Assessment Details' followed by the reformulated information. Any other section should be a smaller title like '## Assessment section'"
    )
    SUMMARY_PROMPT = (
        "The following is a conversation between an assistant and a client. "
        "Conversation:\n{Conversation}\n\n"
        "----end of conversation----\n"
        "Here is the risk assessment for this client:\n{assessment}\n\n"
        "Generate a detailed summary of the client's background, needs, risks, and priorities. "
        "Do not mention the assessment or any scores.\n\n"
        "Use valid **Markdown formatting** so the result displays with headings, bold text, and bulleted lists.\n\n"
        "Format the summary in the following way:\n\n"
        "# Personal Background\n"
        "Write a short paragraph summarizing the client's background.\n\n"
        "# Needs and Risks Overview\n"
        "For each relevant category (e.g., Employment, Education, Financial, Housing, etc.), include one or two sentences using Markdown bullet points. "
        "Start each with a bolded label using `**Category:**` format, and include only the categories that apply.\n\n"
        "# Priority Needs\n"
        "Use a bulleted list of immediate needs.\n\n"
        "# Longer-term Needs\n"
        "Use a bulleted list of long-term needs.\n\n"
        "# Final Thoughts\n"
        "Write a short concluding paragraph summarizing the client’s situation, key supports, and outlook.\n"
    )

    system_prompt = INTAKE_SUMMARY_SYSTEM_PROMPT.format(
        Conversation=formatted_messages, Assessments=formatted_assessments
    )
    agent = LLMAgentQA(
        system_prompt=system_prompt,
        # random thread_id for now
        thread_id=random.randint(0, 100000),
    )

    assessment_prompt = ASSESSMENT_PROMPT.format(Assessments=formatted_assessments)

    assessment = await agent.call(assessment_prompt)
    summary_prompt = SUMMARY_PROMPT.format(
        Conversation=formatted_messages, assessment=assessment
    )
    summary = await agent.call(summary_prompt)

    # Return as tuple consistently
    return summary, assessment
