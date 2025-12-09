from typing import List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.core.data_config.assessment_configs.assessment_config import (
    IntakeConfigConversation,
)
from app.utils.intake.schemas import ClientContext


def get_system_message_prompt(
    assessment_config: IntakeConfigConversation,
) -> SystemMessage:
    # Use system_message from assessment config if available
    return SystemMessage(assessment_config.prompts.system_message)


def generate_opening_remarks_prompt(
    client_data: ClientContext,
    sections: List[str],
    assessment_config: IntakeConfigConversation,
) -> HumanMessage:
    """Generate a structured AI-assisted prompt for the first message to the client, using their details and dynamic sections."""
    client_name = client_data.client_name if client_data else "User"

    role = assessment_config.prompts.role
    tone = assessment_config.prompts.tone

    opening_remarks = assessment_config.prompts.opening_remarks

    system_message = f"""
    {role}

    Client's name: {client_name}

    List of titles of the different sections that will covered, each on a new line:
    {"\n".join(sections)}

    {opening_remarks}

    {tone}
    """

    return HumanMessage(system_message)


class IsSectionComplete(BaseModel):
    information_gaps: str = Field(
        "",
        description="List EXACTLY which items from the section requirements are still missing",
    )
    already_asked_check: str = Field(
        "",
        description="Check if you have already asked about each missing item in any form",
    )
    section_complete_reasoning: str = Field(
        "",
        description="Explain why the section is complete or incomplete based on required information coverage",
    )
    section_complete: bool = Field(
        False, description="Whether this section has been completed"
    )
    section_next_question: Optional[str] = Field(
        None, description="The next question to ask, or None if section is complete"
    )


def generate_question_prompt(
    current_section_title: str,
    current_section_required_information: str,
    assessment_config: IntakeConfigConversation,
) -> SystemMessage:
    # Extract role and tone from assessment config if available
    role = assessment_config.prompts.role
    tone = assessment_config.prompts.tone

    initial_system_context = f"""
{role}

Section: {current_section_title}

Information you need to collect, in priority order:
{current_section_required_information}

Instructions:

1. Review what topics you have already covered in this section to avoid repetition.

2. If the client has ANSWERED all required information, complete the section. Do not complete the section just because you're about to repeat a question - only complete when you have client responses to all required items.

3. Otherwise, draft ONE question for the most important missing information. Keep it clear and relevant to what the client hasn't shared yet. Only ask optional questions if the client seems engaged in this topic

4. is the client engaged in this topic ? if they seem very disinterested and most items are already asked, complete the section

5. Check again - did the client already answer? If so, mark the section as complete

4. When relevant, briefly acknowledge their last response.

5. If the client asked for advice, politely redirect to information gathering.

6. Never reference real world people or places.

{tone}
"""

    return SystemMessage(initial_system_context)


def generate_closing_remarks_prompt() -> SystemMessage:
    """Generate a structured AI-assisted prompt for closing remarks, summarizing key issues raised."""

    system_message = """
    You are a social worker assisting the justice department. You have just completed an intake assessment with a client.

    **Your Task:**
    - Thank the client for their time and participation in this conversation.
    - Acknowledge the key concerns and issues they have raised.
    - Keep the tone **professional, supportive, and neutral**—do not offer advice or solutions.

    **Format of the Closing Statement:**
    - Start by thanking the client.
    - Mention the main topics they raised (e.g., education struggles, employment concerns, personal challenges).
    - Let them know their responses have been noted.
    - Close the conversation in a respectful and professional manner.
    """

    return SystemMessage(system_message)


class CheckIfClientNeedsHelp(BaseModel):
    needs_help: bool = False
    needs_help_reasoning: str = ""


def get_check_if_client_needs_help_prompt() -> SystemMessage:
    """
    Returns a prompt to check if the client needs help or wants to stop.
    """
    return SystemMessage("""Your Task:
1. Read the latest message from the client.
2. Set needsHelp to true ONLY if these severe conditions are met:
   - Client EXPLICITLY states they want to stop, end, leave, or quit the conversation
   - Client asks to talk to a human/case manager instead of continuing
   - Client's responses are INCOHERENT GIBBERISH that cannot be used for assessment:
     * Responses with no logical connection to the questions asked
     * Random unrelated words like "purple spaghetti jellybean dancing llama toaster"
     * Fantasy/impossible scenarios that make no practical sense ("professional cloud whisperer", "banana architect", "unicorns are my best pals")
     * Responses that sound like stream-of-consciousness rambling with no factual content
     * Cannot extract any useful assessment information from their answers
   - Client's responses indicate severe mental health distress or complete inability to communicate coherently

3. DO NOT set needsHelp to true for these normal situations:
   - Short answers like "no", "yes", "idk", "nothing", "fine" - these are valid responses
   - Brief but relevant answers like "unemployed", "high school", "maybe"
   - Client seems reluctant but is still answering questions appropriately
   - Client gives minimal information but their answers make sense in context
   - Client appears tired, sad, or uninterested but is still participating

4. IMPORTANT: Many clients are naturally brief, guarded, or reluctant during intake assessments. This is NORMAL behavior, not a reason to stop the conversation.

5. The client making any effort to provide FACTUAL, RELEVANT answers (even one-word answers) means they want to continue.

6. If you cannot extract ANY useful assessment information from their response due to complete incoherence, set needsHelp to true.

7. Only trigger needsHelp for truly problematic situations where the client cannot meaningfully participate.""")
