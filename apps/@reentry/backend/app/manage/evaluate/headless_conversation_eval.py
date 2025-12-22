"""
Headless conversation evaluation that runs multiple clients simultaneously using LLM-generated responses.
This allows testing the conversation flow without manual input by simulating client responses with an AI model.
"""

import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ValidationError
from typer import Option

from app.core.config import create_model_from_config, settings
from app.core.data_config.assessment_configs.assessment_config import (
    AssessmentConfigFile,
    IntakeSectionConfig,
)
from app.core.data_config.assessment_configs.loader import AssessmentFileLoader
from app.models.intake import IntakeMessage, IntakeMessageRole
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.schemas import ClientContext, ServerEvent

from ..base import cli
from ..types import (
    ConversationEvaluation,
    ConversationExchange,
    IntakeConversationData,
)

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger(__name__)


class SectionCoverageDetail(BaseModel):
    coverage_percentage: int
    gathered_items: List[str]
    missing_items: List[str]


class EvaluationResponse(BaseModel):
    tone_score: int
    tone_feedback: str
    repetition_score: int
    repetition_feedback: str
    repetition_examples: List[str]
    section_coverage: Dict[str, SectionCoverageDetail]
    conversation_failure_reason: str
    politeness_score: int
    politeness_feedback: str
    flow_score: int
    flow_feedback: str
    overall_score: int
    overall_feedback: str
    recommendations: List[str]


class ConversationEvaluator:
    """Evaluates conversation quality using a more powerful AI model."""

    def __init__(self, sections):
        self.evaluation_llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="o4-mini",
            reasoning_effort="high",
        )
        self.sections = sections

    async def evaluate_conversation(
        self,
        conversation_history: List[ConversationExchange],
        completed_sections: List[str],
    ) -> Dict[str, Any]:
        """Evaluate the AI caseworker's performance in the conversation."""

        # Build conversation text
        conversation_text = ""
        ai_questions = []
        for exchange in conversation_history:
            conversation_text += f"AI Case manager: {exchange.question}\n"
            conversation_text += f"Client: {exchange.answer}\n\n"
            ai_questions.append(exchange.question)

        # Get section requirements for completed sections
        completed_section_requirements = []
        for section_data in self.sections:
            if section_data.title in completed_sections:
                completed_section_requirements.append(
                    {
                        "title": section_data.title,
                        "requirements": section_data.description,
                    }
                )

        # Handle case where no sections were completed
        sections_status = f"SECTIONS COMPLETED: {', '.join(completed_sections) if completed_sections else 'None (conversation incomplete/failed)'}"
        requirements_text = (
            json.dumps(completed_section_requirements, indent=2)
            if completed_section_requirements
            else "No sections completed to evaluate against requirements."
        )

        evaluation_prompt = f"""
You are an expert evaluator assessing the performance of an AI case manager conducting intake assessments.

CONVERSATION TO EVALUATE:
{conversation_text}

{sections_status}

SECTION REQUIREMENTS FOR COMPLETED SECTIONS:
{requirements_text}

Please evaluate the AI case manager's performance on the following criteria:

1. TONE ASSESSMENT (1-10 scale):
   - Was the tone warm, professional, and trauma-informed?
   - Was the language at an appropriate reading level?
   - Did the AI show empathy and understanding?

2. QUESTION REPETITION (1-10 scale):
   - Were there any duplicate or nearly duplicate questions?
   - Did the AI avoid asking the same thing multiple ways?
   - Were questions logically progressive?

3. SECTION COVERAGE (percentage):
   - For each completed section, what percentage of the required information was actually gathered?
   - If no sections were completed, assess why the conversation failed to progress
   - List specific missing information items if any

4. POLITENESS (1-10 scale):
   - Was the AI respectful and courteous throughout?
   - Did it handle difficult responses appropriately?

5. CONVERSATION FLOW (1-10 scale):
   - Did questions follow logically from client responses?
   - Were transitions between topics smooth?

6. OVERALL EFFECTIVENESS (1-10 scale):
   - How effective was the AI at gathering the required information?
   - Would this conversation be useful for assessment purposes?

Provide your evaluation in JSON format with the following structure: Make sure your final answer is a valid json
{{
    "tone_score": <1-10>,
    "tone_feedback": "<specific feedback>",
    "repetition_score": <1-10>,
    "repetition_feedback": "<specific feedback>",
    "repetition_examples": ["<example if any>"],
    "section_coverage": {{
        "<section_name>": {{
            "coverage_percentage": <0-100>,
            "missing_items": ["<missing item>"],
            "gathered_items": ["<gathered item>"]
        }}
    }},
    "conversation_failure_reason": "<if no sections completed, explain why the conversation failed to progress>",
    "politeness_score": <1-10>,
    "politeness_feedback": "<specific feedback>",
    "flow_score": <1-10>,
    "flow_feedback": "<specific feedback>",
    "overall_score": <1-10>,
    "overall_feedback": "<comprehensive feedback>",
    "recommendations": ["<improvement suggestion>"]
}}
"""

        try:
            response = await self.evaluation_llm.ainvoke(
                [HumanMessage(content=evaluation_prompt)]
            )
            evaluation_text = response.content.strip()

            # Try to parse JSON from the response
            try:
                # Find JSON in the response (in case there's extra text)
                start_idx = evaluation_text.find("{")
                end_idx = evaluation_text.rfind("}") + 1
                if start_idx != -1 and end_idx != -1:
                    json_text = evaluation_text[start_idx:end_idx]
                    json_data = json.loads(json_text)

                    # Validate with Pydantic model
                    evaluation_model = EvaluationResponse(**json_data)
                    # Convert back to dict for compatibility with existing code
                    evaluation_data = evaluation_model.model_dump()
                else:
                    raise ValueError("No JSON found in response")
            except (json.JSONDecodeError, ValidationError, ValueError) as e:
                logger.error(f"Failed to parse/validate evaluation response: {e}")
                logger.debug(f"Raw response: {evaluation_text}")
                # Fallback if parsing/validation fails
                evaluation_data = {
                    "tone_score": 5,
                    "tone_feedback": "Unable to parse evaluation",
                    "repetition_score": 5,
                    "repetition_feedback": "Unable to parse evaluation",
                    "repetition_examples": [],
                    "section_coverage": {},
                    "conversation_failure_reason": "",
                    "politeness_score": 5,
                    "politeness_feedback": "Unable to parse evaluation",
                    "flow_score": 5,
                    "flow_feedback": "Unable to parse evaluation",
                    "overall_score": 5,
                    "overall_feedback": f"Evaluation parsing/validation failed: {type(e).__name__}",
                    "recommendations": [],
                    "raw_response": evaluation_text,
                }

            logger.info(
                f"Conversation evaluation completed - Overall score: {evaluation_data.get('overall_score', 'N/A')}"
            )
            return evaluation_data

        except Exception as e:
            logger.error(f"Error during conversation evaluation: {e}")
            return {
                "error": str(e),
                "tone_score": 0,
                "repetition_score": 0,
                "section_coverage": {},
                "politeness_score": 0,
                "flow_score": 0,
                "overall_score": 0,
                "overall_feedback": f"Evaluation failed: {e}",
            }


class HeadlessIntakeClient:
    """Simulates a client responding to intake questions using an LLM."""

    def __init__(
        self, client_pseudo_id: str, client_name: str, persona: Dict[str, Any]
    ):
        self.client_pseudo_id = client_pseudo_id
        self.client_name = client_name
        self.persona = persona
        self.conversation_history: List[ConversationExchange] = []
        self.completed_sections: List[str] = []

        # Initialize LLM for generating responses using app settings
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="o4-mini",
            max_tokens=500,
            reasoning_effort="low",
        )

    async def generate_response(self, ai_message: str, current_section: str) -> str:
        """Generate a realistic client response using LLM."""

        # Check for special communication styles
        comm_style = self.persona.get("communication_style", "")

        if "MINIMALIST" in comm_style:
            # Handle minimalist persona - very short answers
            persona_context = f"""
You are roleplaying as {self.client_name}, a reluctant person going through an intake assessment.

Your background:
- Age: {self.persona.get('age', 'unknown')}
- Background: {self.persona.get('background', 'No specific background provided')}
- Challenges: {self.persona.get('challenges', 'General life challenges')}

CRITICAL INSTRUCTIONS:
- You don't want to be here and show it through extremely brief responses
- Answer with 1-5 words maximum, often just 1-2 words
- Use responses like: "no", "yeah", "fine", "nothing", "idk", "whatever", "maybe"
- Never elaborate or provide details unless forced
- Show reluctance and disinterest through brevity
- Occasionally give slightly longer answers (3-5 words) but rarely
"""
        elif "GIBBERISH" in comm_style:
            # Handle gibberish persona - incoherent responses
            persona_context = f"""
You are roleplaying as {self.client_name}, a person with severe communication difficulties going through an intake assessment.

Your background:
- Age: {self.persona.get('age', 'unknown')}
- Background: {self.persona.get('background', 'No specific background provided')}
- Challenges: {self.persona.get('challenges', 'General life challenges')}

CRITICAL INSTRUCTIONS:
- Respond with nonsensical, incoherent, or completely random answers
- Mix unrelated words, make up phrases, go off on tangents
- Include random numbers, made-up words, or stream of consciousness
- Your responses should NOT make logical sense in relation to the questions
- Be unpredictable and erratic in your communication
- Examples: "purple seven banana Tuesday", "the walls know about chicken mathematics", "seventeen job maybe clouds idk fountain"
"""
        else:
            # Standard persona context
            persona_context = f"""
You are roleplaying as {self.client_name}, a person going through an intake assessment.

Your background:
- Age: {self.persona.get('age', 'unknown')}
- Background: {self.persona.get('background', 'No specific background provided')}
- Challenges: {self.persona.get('challenges', 'General life challenges')}
- Communication style: {self.persona.get('communication_style', 'Direct and honest')}

Current section being discussed: {current_section}

Instructions:
- Respond naturally as this person would
- Be realistic and authentic to the persona
- Keep responses really short, the person is typing on a tablet, not speaking
- If asked about sensitive topics, respond appropriately for someone in this situation
- Don't volunteer information not directly asked about
- Sometimes show some hesitation or emotion when discussing difficult topics
"""

        # Add recent conversation history for context
        conversation_context = ""
        if self.conversation_history:
            conversation_context = "\n\nRecent conversation:\n"
            for exchange in self.conversation_history[-3:]:  # Last 3 exchanges
                conversation_context += f"case manager: {exchange.question}\n"
                conversation_context += f"You: {exchange.answer}\n"

        prompt = f'{persona_context}{conversation_context}\n\nCase manager just said: "{ai_message}"\n\nRespond as {self.client_name}:'

        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            client_response = response.content.strip()

            # Store this exchange
            self.conversation_history.append(
                ConversationExchange(
                    question=ai_message,
                    answer=client_response,
                    section=current_section,
                )
            )

            logger.info(
                f"[{self.client_name}] Generated response: {client_response[:100]}..."
            )
            return client_response

        except Exception as e:
            logger.error(f"[{self.client_name}] Error generating response: {e}")
            # Fallback response
            return "I'm not sure how to answer that right now."


class HeadlessDatabaseManager:
    """Mock database manager for headless evaluation."""

    def __init__(self, client_pseudo_id: str, sections, assessment_config):
        self.client_pseudo_id = client_pseudo_id
        self.current_section_index = 0
        self.sections = [section.title for section in sections]
        self.messages: List[IntakeMessage] = []
        self.assessment_config = assessment_config

    async def get_conversation_config(self, config_id: str):
        return self.assessment_config.intake

    async def store_message(
        self, client_pseudo_id: str, content: str, from_role: str
    ) -> IntakeMessage:
        """Store message in memory."""
        message = IntakeMessage(
            id=str(uuid.uuid4()),
            content=content,
            from_role=IntakeMessageRole(from_role),
            client_pseudo_id=client_pseudo_id,
            intake_id=str(uuid.uuid4()),
        )
        self.messages.append(message)
        logger.debug(
            f"[{client_pseudo_id}] Stored {from_role} message: {content[:50]}..."
        )
        return message

    async def get_latest_message(self, client_pseudo_id: str) -> IntakeMessage:
        """Get the latest message."""
        if self.messages:
            return self.messages[-1]
        return IntakeMessage(
            id=str(uuid.uuid4()),
            content="No messages yet",
            from_role=IntakeMessageRole.CASEWORKER,
            client_pseudo_id=client_pseudo_id,
            intake_id=str(uuid.uuid4()),
        )

    async def complete_section(self, client_pseudo_id: str) -> str:
        """Complete current section and move to next."""
        self.current_section_index += 1

        if self.current_section_index >= len(self.sections):
            logger.info(f"[{client_pseudo_id}] All sections completed")
            return "Completion"

        next_section = self.sections[self.current_section_index]
        logger.info(f"[{client_pseudo_id}] Moving to section: {next_section}")
        return next_section

    async def update_intake_status(self, client_pseudo_id: str, status: str) -> None:
        """Update intake status."""
        logger.info(f"[{client_pseudo_id}] Status updated to: {status}")

    async def all_messages_by_time(self, client_pseudo_id: str) -> List[IntakeMessage]:
        """Get all messages."""
        return self.messages

    async def get_section_titles(self, client_pseudo_id: str) -> List[str]:
        return self.sections


class HeadlessIntake:
    """Mock intake object for headless evaluation."""

    def __init__(self, sections, assessment_config):
        self.current_section = sections[0].title
        self.assessment_config_id = "mock-config-id"
        self.assessment_config = assessment_config
        self.client_intake_sections = None


class HeadlessClientIntakeSection:
    def __init__(self, title, description, required_information):
        self.title = title
        self.description = description
        self.required_information = required_information

    def get_effective_section_data(self):
        return {
            "title": self.title,
            "description": self.description,
            "required_information": self.required_information,
            "source": "eval",
        }


async def generate_client_conversation(
    client_pseudo_id: str,
    client_name: str,
    persona: Dict[str, Any],
    sections: list[IntakeSectionConfig],
    assessment_config: AssessmentConfigFile,
) -> IntakeConversationData:
    client = HeadlessIntakeClient(
        client_pseudo_id=client_pseudo_id,
        client_name=client_name,
        persona=persona,
    )

    # Create components
    mock_db_manager = HeadlessDatabaseManager(
        client.client_pseudo_id, sections, assessment_config
    )
    mock_intake = HeadlessIntake(sections, assessment_config)

    async def headless_wait_for_user_response(
        client_pseudo_id: str, message: IntakeMessage
    ) -> str:
        """Generate response using the client's LLM."""
        ai_content = message.content

        # Generate client response
        response = await client.generate_response(
            ai_content, mock_intake.current_section
        )

        return response

    async def headless_send_message(client_pseudo_id: str, event: ServerEvent) -> str:
        """Handle server events."""
        if event.type == "sectionChange":
            mock_intake.current_section = event.content.section
            client.completed_sections.append(event.content.section)

        return "sent"

    # Initialize conversation graph
    client_context = ClientContext(
        client_pseudo_id=client.client_pseudo_id, client_name=client.client_name
    )

    model = create_model_from_config(
        assessment_config.intake.chat_model.provider,
        assessment_config.intake.chat_model.name,
        assessment_config.intake.chat_model.version,
    )

    conversation_graph = IntakeConversationGraph(
        session=client_context,
        db_manager=mock_db_manager,
        wait_for_user_response=headless_wait_for_user_response,
        send_message=headless_send_message,
        model=model,
    )

    try:
        # Initialize and run the assessment
        await conversation_graph.initialize(mock_intake)
        final_state = await conversation_graph.run_assessment()

        # Compile results
        logger.info(
            f"Completed conversation for {client.client_name}: {len(client.conversation_history)} exchanges"
        )
        return IntakeConversationData(
            client_pseudo_id=client.client_pseudo_id,
            client_name=client.client_name,
            completed_sections=client.completed_sections,
            conversation_history=client.conversation_history,
            final_section=final_state.get("current_section", "Unknown"),
            status="completed",
        )

    except Exception as e:
        logger.error(
            f"Error in conversation for {client.client_name}: {e}", exc_info=True
        )
        return IntakeConversationData(
            client_pseudo_id=client.client_pseudo_id,
            client_name=client.client_name,
            error=str(e),
            status="failed",
            completed_sections=client.completed_sections,
            conversation_history=client.conversation_history,
        )


async def evaluate_conversation(
    conversation_history: List[ConversationExchange],
    completed_sections: List[str],
    sections: list[IntakeSectionConfig],
) -> Dict[str, Any]:
    """Evaluate a conversation using AI.

    Args:
        conversation_history: List of ConversationExchange objects
        completed_sections: List of section names that were completed
        sections: List of intake section definitions

    Returns:
        Dict with evaluation scores including:
            - tone_score: 1-10
            - repetition_score: 1-10
            - section_coverage: Dict[str, Dict] with coverage percentages
            - politeness_score: 1-10
            - flow_score: 1-10
            - overall_score: 1-10
            - feedback and recommendations
    """
    evaluator = ConversationEvaluator(sections)
    return await evaluator.evaluate_conversation(
        conversation_history, completed_sections
    )


# Sample personas for testing
SAMPLE_PERSONAS = [
    {
        "name": "Jordan Smith",
        "age": 35,
        "background": "About to be released from a 2-year sentence for theft. Struggles with substance abuse issues. Has children but limited custody. Completed treatment program once before.",
        "challenges": "Staying sober, rebuilding relationship with children, finding housing, managing mental health",
        "communication_style": "Open about struggles but sometimes defensive. Uses humor to deflect. Shows some motivation for change, but is not interested in everything. IMPORTANT: Makes very short answers with low literacy",
    },
]


async def get_conversation(
    use_sample_conversation: bool,
    use_sample_failed_conversation: bool,
    generate_conversation: bool,
    client_pseudo_id: Optional[str],
    environment: str,
    sections: list[IntakeSectionConfig],
    assessment_config: AssessmentConfigFile,
) -> IntakeConversationData:
    """
    Get a conversation from different sources: sample, generated, or real intake from database.

    Args:
        use_sample_conversation: Load from sample JSON file
        use_sample_failed_conversation: Load from sample failed conversation JSON file
        generate_conversation: Generate new conversation with first LLM persona
        client_pseudo_id: Fetch real intake from database
        environment: Environment for database fetch (dev, demo, staging, prod)
        sections: Intake sections configuration

    Returns:
        IntakeConversationData object
    """
    from ..extract_intake_conversation import fetch_conversation, to_environment

    # Handle real intake conversation from database
    if client_pseudo_id:
        logger.info(f"Fetching real intake conversation for client: {client_pseudo_id}")
        env = to_environment(environment)
        intake_data = await fetch_conversation(client_pseudo_id, env)

        if intake_data.error:
            raise ValueError(f"Error fetching intake: {intake_data.error}")

        return intake_data

    # Handle generated conversation (use first persona)
    elif generate_conversation:
        persona = SAMPLE_PERSONAS[0]
        logger.info(f"Generating conversation for simulated client: {persona['name']}")
        conversation = await generate_client_conversation(
            client_pseudo_id=f"eval-client-{uuid.uuid4().hex[:8]}",
            client_name=persona["name"],
            persona=persona,
            sections=sections,
            assessment_config=assessment_config,
        )
        return conversation

    # Handle sample conversation
    elif use_sample_conversation:
        logger.info("Loading sample conversation from file")
        sample_conversation_path = (
            Path(__file__).parent.parent.parent
            / "tests"
            / "data"
            / "sample_generated_conversation.json"
        )
        with open(sample_conversation_path, "r") as file:
            json_data = json.load(file)
            conversation = IntakeConversationData(**json_data)
            return conversation

    elif use_sample_failed_conversation:
        logger.info("Loading sample failed conversation from file")
        sample_failed_conversation_path = (
            Path(__file__).parent.parent.parent
            / "tests"
            / "data"
            / "sample_failed_conversation.json"
        )
        with open(sample_failed_conversation_path, "r") as file:
            json_data = json.load(file)
            conversation = IntakeConversationData(**json_data)
            return conversation

    raise ValueError("No conversation source specified")


async def evaluate_single_conversation(
    conversation: IntakeConversationData,
    sections: list[IntakeSectionConfig],
    start_time: datetime,
) -> Dict[str, Any]:
    """
    Evaluate a single conversation and return results summary.

    Args:
        conversation: IntakeConversationData object
        sections: Intake sections configuration
        start_time: Start time of the evaluation

    Returns:
        Dictionary with evaluation summary including result or error
    """
    logger.info("Starting conversation evaluation...")

    # Extract fields
    client_identifier = conversation.client_pseudo_id
    conversation_history = conversation.conversation_history
    completed_sections = conversation.completed_sections
    has_error = conversation.error is not None

    evaluation_result = ConversationEvaluation()

    # Check for errors (log but continue to evaluate available conversation data)
    if has_error:
        error_msg = conversation.error
        logger.warning(
            f"Conversation has error: {error_msg}. Will attempt to evaluate available conversation data."
        )
        evaluation_result.error = error_msg

    # Debug the evaluation conditions
    logger.info(
        f"Evaluating {client_identifier}: conversation_history length={len(conversation_history)}, completed_sections={completed_sections}"
    )

    # Run evaluation if there's any conversation data
    if conversation_history and len(conversation_history) > 0:
        logger.info(f"Evaluating conversation for {client_identifier}...")
        try:
            evaluation = await evaluate_conversation(
                conversation_history=conversation_history,
                completed_sections=completed_sections if completed_sections else [],
                sections=sections,
            )
            evaluation_result.ai_evaluation = evaluation

            # Store the conversation data
            evaluation_result.conversation_data = conversation

            logger.info(
                f"Evaluation complete for {client_identifier} - Overall: {evaluation.get('overall_score', 'N/A')}/10"
            )

            evaluation_end_time = datetime.now()
            result = {
                "evaluation_id": str(uuid.uuid4()),
                "timestamp": start_time.isoformat(),
                "duration_seconds": (evaluation_end_time - start_time).total_seconds(),
                "status": "partial_success" if has_error else "success",
                "result": evaluation_result.model_dump(),
            }
            if has_error:
                result["error"] = evaluation_result.error
            return result
        except Exception as e:
            logger.error(
                f"Failed to evaluate conversation for {client_identifier}: {e}"
            )
            evaluation_result.error = str(e)
            evaluation_result.conversation_data = conversation

            evaluation_end_time = datetime.now()
            return {
                "evaluation_id": str(uuid.uuid4()),
                "timestamp": start_time.isoformat(),
                "duration_seconds": (evaluation_end_time - start_time).total_seconds(),
                "status": "failed",
                "error": str(e),
                "result": evaluation_result.model_dump(),
            }
    else:
        logger.warning(f"No conversation data to evaluate for {client_identifier}")
        evaluation_result.error = "No conversation data for evaluation"
        evaluation_result.conversation_data = conversation

        evaluation_end_time = datetime.now()
        return {
            "evaluation_id": str(uuid.uuid4()),
            "timestamp": start_time.isoformat(),
            "duration_seconds": (evaluation_end_time - start_time).total_seconds(),
            "status": "failed",
            "error": "No conversation data for evaluation",
            "result": evaluation_result.model_dump(),
        }


def get_assessment_config(
    file_name: str,
) -> tuple[AssessmentConfigFile, list[IntakeSectionConfig]]:
    try:
        # Load assessment config using the loader
        yaml_content = AssessmentFileLoader.read_file_content(file_name)
        assessment_config = AssessmentFileLoader.validate_yaml_content(yaml_content)
        if assessment_config.intake.intake_type != "conversation":
            raise ValueError("this config needs to be for intake conversation")

        # Use sections directly from the config
        if not assessment_config.intake.sections:
            logger.error(f"No sections found in config file: {file_name}")
            print(f"Error: No sections found in config file: {file_name}")
            raise ValueError(f"No sections found in config file: {file_name}")

        sections = assessment_config.intake.sections
        logger.info(f"Loaded {len(sections)} sections from {file_name}")
        return (assessment_config, sections)

    except FileNotFoundError as e:
        logger.error(f"Config file not found: {e}")
        print(f"Error: Config file not found: {file_name}")
        config_dir = (
            Path(__file__).parent.parent.parent
            / "core"
            / "data_config"
            / "assessment_configs"
        )
        print(f"Check available files in: {config_dir}")
        raise
    except Exception as e:
        logger.error(f"Error loading config file: {e}")
        print(f"Error loading config file: {e}")
        raise


@cli.command()
async def headless_conversation_eval(
    config_file_name: str = Option(
        "UT-CCCI-v0.yaml",
        "--config_file_name",
        help="Name of the YAML config file such as UT-CCCI-v0.yaml",
    ),
    use_sample_conversation: bool = Option(
        False,
        "--use-sample-conversation",
        help="Use a pre-generated sample conversation",
    ),
    use_sample_failed_conversation: bool = Option(
        False,
        "--use-sample-failed-conversation",
        help="Use a pre-generated sample conversation with error",
    ),
    generate_conversation: bool = Option(
        False,
        "--generate-conversation",
        help="Generate new conversation with LLM persona",
    ),
    client_pseudo_id: str = Option(
        None, help="Client pseudo ID to evaluate real intake from database"
    ),
    environment: str = Option(
        "local", help="Environment for real intake (local, dev, demo, staging, prod)"
    ),
):
    """
    Run headless conversation evaluation for a single conversation.

    This evaluation assesses the tone and quality of the questions that AI asks a client.

    Sample Usage:

    uv run python -m app.manage headless-conversation-eval --config_file_name ID-FACR-v0.yaml --use-sample-conversation

    uv run python -m app.manage headless-conversation-eval --config_file_name ID-FACR-v0.yaml --use-sample-failed-conversation

    uv run python -m app.manage headless-conversation-eval --config_file_name UT-CCCI-v0.yaml --client-pseudo-id 1234 --environment demo

    uv run python -m app.manage headless-conversation-eval --config_file_name UT-CCCI-v0.yaml --client-pseudo-id 1234 --environment prod

    Provide ONE of the following conversation sources:
    - --use-sample-conversation: Load pre-generated sample
    - --use-sample-failed-conversation: Load pre-generated sample with error
    - --generate-conversation: Generate new simulated conversation
    - --client-pseudo-id: Evaluate real intake from database
    """
    logger.info("Starting headless conversation evaluation...")

    # Validate mutually exclusive arguments
    options_provided = sum(
        [
            use_sample_conversation,
            use_sample_failed_conversation,
            generate_conversation,
            client_pseudo_id is not None,
        ]
    )

    if options_provided == 0:
        print("Error: Must provide one of:")
        print("  --use-sample-conversation")
        print("  --use-sample-failed-conversation")
        print("  --generate-conversation")
        print("  --client-pseudo-id <id>")
        return

    if options_provided > 1:
        print("Error: Options are mutually exclusive. Provide only one of:")
        print("  --use-sample-conversation")
        print("  --use-sample-failed-conversation")
        print("  --generate-conversation")
        print("  --client-pseudo-id <id>")
        return

    assessment_config, sections = get_assessment_config(config_file_name)

    if not client_pseudo_id:
        environment = None

    start_time = datetime.now()

    # Get conversation from the appropriate source
    try:
        conversation = await get_conversation(
            use_sample_conversation=use_sample_conversation,
            use_sample_failed_conversation=use_sample_failed_conversation,
            generate_conversation=generate_conversation,
            client_pseudo_id=client_pseudo_id,
            environment=environment,
            sections=sections,
            assessment_config=assessment_config,
        )
    except Exception as e:
        logger.exception("Error getting conversation")
        print(f"Error getting conversation: {e}")
        return

    # Evaluate the conversation
    evaluation_summary = await evaluate_single_conversation(
        conversation=conversation,
        sections=sections,
        start_time=start_time,
    )

    # Save results
    results_dir = (
        Path(__file__).parent.parent.parent.parent
        / "experiments"
        / "headless_evaluations"
    )
    results_dir.mkdir(parents=True, exist_ok=True)

    timestamp_str = start_time.strftime("%Y%m%d_%H%M%S")

    # Generate filename based on conversation source
    if client_pseudo_id:
        results_file = (
            results_dir
            / f"headless_eval_client_pseudo_id_{client_pseudo_id}_assessment_config_{config_file_name}_{timestamp_str}.json"
        )
    elif use_sample_conversation:
        results_file = (
            results_dir
            / f"headless_eval_sample_conversation__assessment_config__{config_file_name}_{timestamp_str}.json"
        )
    else:  # generate_conversation
        results_file = (
            results_dir
            / f"headless_eval_generated_conversation_assessment_config__{config_file_name}_{timestamp_str}.json"
        )

    with open(results_file, "w") as f:
        json.dump(evaluation_summary, f, indent=2)

    # Print summary
    print("\n" + "=" * 60)
    print(" HEADLESS CONVERSATION EVALUATION COMPLETE")
    print("=" * 60)
    print(f" Status: {evaluation_summary['status']}")
    print(f" Total duration: {evaluation_summary['duration_seconds']:.1f} seconds")

    # Extract evaluation result
    evaluation = ConversationEvaluation(**evaluation_summary["result"])

    if evaluation_summary["status"] in ["success", "partial_success"]:
        if evaluation_summary["status"] == "partial_success":
            print("\n PARTIAL SUCCESS DETAILS:")
            print(
                f"  Conversation Error: {evaluation_summary.get('error', 'Unknown error')}"
            )
        else:
            print("\n SUCCESS DETAILS:")

        eval_scores = evaluation.ai_evaluation

        # Get conversation data
        conv_data = evaluation.conversation_data
        client_identifier = conv_data.client_pseudo_id
        total_exchanges = conv_data.total_exchanges
        completed_sections = conv_data.completed_sections

        overall_score = eval_scores.get("overall_score", "N/A")
        tone_score = eval_scores.get("tone_score", "N/A")
        repetition_score = eval_scores.get("repetition_score", "N/A")

        print(
            f"  • {client_identifier}: {total_exchanges} exchanges, "
            f"{len(completed_sections)} sections completed"
        )

        if eval_scores and "error" not in eval_scores:
            print(
                f"    AI Evaluation: Overall {overall_score}/10, Tone {tone_score}/10, No-Repetition {repetition_score}/10"
            )

            # Show section coverage
            section_coverage = eval_scores.get("section_coverage", {})
            if section_coverage:
                print("    Section Coverage:")
                for section, coverage in section_coverage.items():
                    percentage = coverage.get("coverage_percentage", 0)
                    print(f"      - {section}: {percentage}%")
        else:
            print(f"    AI Evaluation: {eval_scores.get('error', 'Failed')}")
    else:
        print("\n FAILURE DETAILS:")
        print(f"  • Error: {evaluation_summary.get('error', 'Unknown error')}")

    print(f"\n💾 Results saved to: {results_file}")
    print("=" * 60)
