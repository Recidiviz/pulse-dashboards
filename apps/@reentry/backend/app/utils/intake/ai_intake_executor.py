# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================
"""Production AI Intake Executor for automated testing with personas."""

from typing import Any, Dict
from uuid import UUID

import structlog
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.core.config import create_model_from_config, settings
from app.core.db import AsyncSession
from app.crud.intake import get_intake_by_id, get_intake_by_id_with_assessment_config
from app.models.intake import IntakeMessage, IntakeMessageRole
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.db_manager import DatabaseManager
from app.utils.intake.schemas import ClientContext, ServerEvent

logger = structlog.get_logger(__name__)


class AIIntakeClient:
    """Simulates a client responding to intake questions using an LLM with persona characteristics."""

    def __init__(
        self, client_pseudo_id: str, client_name: str, persona: Dict[str, Any]
    ):
        self.client_pseudo_id = client_pseudo_id
        self.client_name = client_name
        self.persona = persona
        self.completed_sections: list[str] = []
        self.message_count = 0

        # Initialize LLM for generating responses
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="o4-mini",
            max_tokens=500,
            reasoning_effort="low",
        )

    async def generate_response(self, ai_message: str, current_section: str) -> str:
        """Generate a realistic client response using LLM based on persona characteristics."""

        persona_context = f"""
You are roleplaying as {self.client_name}, a person going through an intake assessment.

Your background:
- Age: {self.persona.get('age', 'unknown')}
- Background: {self.persona.get('background', 'No specific background provided')}
- Challenges: {self.persona.get('challenges', 'General life challenges')}

How you communicate:
{self.persona.get('communication_style', 'Direct and honest. Responds in 1-3 sentences.')}

Current section being discussed: {current_section}

Instructions:
- Respond naturally and authentically, staying true to your communication style above.
- Keep responses short — you are typing on a tablet, not speaking.
- Do not volunteer information that wasn't directly asked about.
- Show hesitation or emotion when discussing difficult topics, if that fits your personality.
"""

        prompt = f'{persona_context}\n\nCase manager just said: "{ai_message}"\n\nRespond as {self.client_name}:'

        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            client_response = response.content.strip()

            self.message_count += 1

            logger.info(
                f"[{self.client_name}] Generated response: {client_response[:100]}...",
                persona_name=self.persona.get("name"),
                section=current_section,
            )
            return client_response

        except Exception as e:
            logger.error(
                f"[{self.client_name}] Error generating response: {e}",
                error=str(e),
                exc_info=True,
            )
            # Fallback response
            return "I'm not sure how to answer that right now."


async def run_ai_intake(
    intake_id: UUID, persona_dict: Dict[str, Any], session: AsyncSession
) -> Dict[str, Any]:
    """
    Execute an AI-powered intake conversation using a persona.

    Args:
        intake_id: The ID of the intake to complete
        persona_dict: Dictionary containing persona attributes (name, age, background, challenges, communication_style)
        session: Database session

    Returns:
        Dictionary with intake_id, status, and message_count
    """
    # Get intake from database with assessment_config eagerly loaded
    intake = await get_intake_by_id_with_assessment_config(session, intake_id)
    if not intake:
        raise ValueError(f"Intake {intake_id} not found")

    # Get client information
    client_pseudo_id = intake.client_pseudo_id
    client_name = persona_dict.get("name", "Client")

    logger.info(
        f"Starting AI intake for {client_name}",
        intake_id=str(intake_id),
        persona=persona_dict.get("name"),
    )

    # Create AI client
    ai_client = AIIntakeClient(
        client_pseudo_id=client_pseudo_id,
        client_name=client_name,
        persona=persona_dict,
    )

    # Create database manager
    db_manager = DatabaseManager(session=session)

    # Get assessment config from the eagerly loaded relationship
    assessment_config = await db_manager.get_conversation_config(
        intake.assessment_config_id
    )

    async def wait_for_user_response(
        client_pseudo_id: str, message: IntakeMessage
    ) -> str:
        """Generate response using the AI client's LLM."""
        ai_content = message.content

        # Get current section from intake
        current_intake = await get_intake_by_id(session, intake.id)
        current_section = current_intake.current_section or "intro"

        # Generate client response
        response = await ai_client.generate_response(ai_content, current_section)

        # Store the message in the database
        await db_manager.store_message(
            intake_id=intake.id,
            from_role=IntakeMessageRole.CLIENT,
            content=response,
        )

        return response

    async def send_message(client_pseudo_id: str, event: ServerEvent) -> str:
        """Handle server events like section changes."""
        if event.type == "sectionChange":
            ai_client.completed_sections.append(event.content.section)

        return "sent"

    # Initialize conversation graph
    client_context = ClientContext(
        client_pseudo_id=client_pseudo_id, client_name=client_name
    )

    model = create_model_from_config(
        assessment_config.chat_model.provider,
        assessment_config.chat_model.name,
        assessment_config.chat_model.version,
    )

    conversation_graph = IntakeConversationGraph(
        session=client_context,
        db_manager=db_manager,
        wait_for_user_response=wait_for_user_response,
        send_message=send_message,
        model=model,
    )

    try:
        # Initialize and run the assessment
        await conversation_graph.initialize(intake)
        final_state = await conversation_graph.run_assessment()

        logger.info(
            f"Completed AI intake for {client_name}",
            intake_id=str(intake_id),
            message_count=ai_client.message_count,
            completed_sections=ai_client.completed_sections,
        )

        return {
            "intake_id": str(intake_id),
            "status": "completed",
            "message_count": ai_client.message_count,
            "completed_sections": ai_client.completed_sections,
            "final_section": final_state.get("current_section", "Unknown"),
        }

    except Exception as e:
        logger.error(
            f"Error in AI intake for {client_name}: {e}",
            intake_id=str(intake_id),
            error=str(e),
            exc_info=True,
        )
        return {
            "intake_id": str(intake_id),
            "status": "failed",
            "error": str(e),
            "message_count": ai_client.message_count,
            "completed_sections": ai_client.completed_sections,
        }
