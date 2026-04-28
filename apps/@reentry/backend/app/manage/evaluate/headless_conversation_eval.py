"""
Headless conversation evaluation that runs a conversation through LLM-as-judge scoring.
Supports evaluating sample conversations, synthetically generated conversations, or
real intake conversations fetched from the database.
"""

import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

import structlog
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
from ..extract_intake_conversation import (
    fetch_conversation,
    fetch_conversation_by_intake_id,
    to_environment,
)
from ..types import (
    ConversationEvaluation,
    ConversationExchange,
    IntakeConversationData,
)
from ._html_utils import write_html_report

logger = structlog.get_logger(__name__)


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
            base_url=settings.OPENAI_BASE_URL,
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
            base_url=settings.OPENAI_BASE_URL,
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
- Age: {self.persona.get("age", "unknown")}
- Background: {self.persona.get("background", "No specific background provided")}
- Challenges: {self.persona.get("challenges", "General life challenges")}

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
- Age: {self.persona.get("age", "unknown")}
- Background: {self.persona.get("background", "No specific background provided")}
- Challenges: {self.persona.get("challenges", "General life challenges")}

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
- Age: {self.persona.get("age", "unknown")}
- Background: {self.persona.get("background", "No specific background provided")}
- Challenges: {self.persona.get("challenges", "General life challenges")}
- Communication style: {self.persona.get("communication_style", "Direct and honest")}

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

    def __init__(self, intake_id: str, sections, assessment_config):
        self.intake_id = intake_id
        self.current_section_index = 0
        self.sections = [section.title for section in sections]
        self.messages: List[IntakeMessage] = []
        self.assessment_config = assessment_config

    async def get_conversation_config(self, config_id: str):
        return self.assessment_config.intake

    async def store_message(
        self, intake_id: str, content: str, from_role: str
    ) -> IntakeMessage:
        """Store message in memory."""
        message = IntakeMessage(
            id=str(uuid.uuid4()),
            content=content,
            from_role=IntakeMessageRole(from_role),
            intake_id=intake_id,
        )
        self.messages.append(message)
        logger.debug(f"[{intake_id}] Stored {from_role} message: {content[:50]}...")
        return message

    async def get_latest_message(self, intake_id: str) -> IntakeMessage:
        """Get the latest message."""
        if self.messages:
            return self.messages[-1]
        return IntakeMessage(
            id=str(uuid.uuid4()),
            content="No messages yet",
            from_role=IntakeMessageRole.CASEWORKER,
            intake_id=intake_id,
        )

    async def complete_section(self, intake_id: str) -> str:
        """Complete current section and move to next."""
        self.current_section_index += 1

        if self.current_section_index >= len(self.sections):
            logger.info(f"[{intake_id}] All sections completed")
            return "Completion"

        next_section = self.sections[self.current_section_index]
        logger.info(f"[{intake_id}] Moving to section: {next_section}")
        return next_section

    async def update_intake_status(self, intake_id: str, status: str) -> None:
        """Update intake status."""
        logger.info(f"[{intake_id}] Status updated to: {status}")

    async def all_messages_by_time(self, intake_id: str) -> List[IntakeMessage]:
        """Get all messages."""
        return self.messages

    async def get_section_titles(self, client_pseudo_id: str) -> List[str]:
        return self.sections


class HeadlessIntake:
    """Mock intake object for headless evaluation."""

    def __init__(self, sections, assessment_config, intake_id):
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


@dataclass
class ConversationEvalItem:
    """Holds a single conversation and its context for evaluation."""

    conversation_history: List[ConversationExchange]
    completed_sections: List[str]
    sections: List[IntakeSectionConfig]
    meta: Dict[str, Any]  # {intake_id, client_pseudo_id, intake_type, source}


async def get_conversation(
    mode: str,
    client_pseudo_id: Optional[str],
    environment: str,
    sections: List[IntakeSectionConfig],
    assessment_config: AssessmentConfigFile,
    config_file_name: str,
    intake_id: Optional[str] = None,
) -> ConversationEvalItem:
    """Load a conversation from the appropriate source based on mode."""
    if mode in ("sample", "sample-failed"):
        filename = (
            "sample_failed_conversation.json"
            if mode == "sample-failed"
            else "sample_generated_conversation.json"
        )
        logger.info(f"Loading sample conversation from file: {filename}")
        sample_path = Path(__file__).parent.parent.parent / "tests" / "data" / filename
        with open(sample_path, "r") as f:
            conversation = IntakeConversationData(**json.load(f))
        meta: Dict[str, Any] = {
            "intake_id": None,
            "client_pseudo_id": conversation.client_pseudo_id,
            "intake_type": config_file_name,
            "source": "sample",
        }
        if conversation.error:
            meta["conversation_error"] = conversation.error
        return ConversationEvalItem(
            conversation_history=conversation.conversation_history or [],
            completed_sections=conversation.completed_sections or [],
            sections=sections,
            meta=meta,
        )

    if mode == "generate":
        persona = SAMPLE_PERSONAS[0]
        logger.info(f"Generating conversation for simulated client: {persona['name']}")
        conversation = await generate_client_conversation(
            client_pseudo_id=f"eval-client-{uuid.uuid4().hex[:8]}",
            client_name=persona["name"],
            persona=persona,
            sections=sections,
            assessment_config=assessment_config,
        )
        return ConversationEvalItem(
            conversation_history=conversation.conversation_history or [],
            completed_sections=conversation.completed_sections or [],
            sections=sections,
            meta={
                "intake_id": None,
                "client_pseudo_id": conversation.client_pseudo_id,
                "intake_type": config_file_name,
                "source": "generate",
            },
        )

    # db mode
    env = to_environment(environment)
    if intake_id:
        logger.info(f"Fetching intake by ID: {intake_id} (env: {environment})")
        intake_data = await fetch_conversation_by_intake_id(UUID(intake_id), env)
    else:
        logger.info(
            f"Fetching intake by client_pseudo_id: {client_pseudo_id} (env: {environment})"
        )
        intake_data = await fetch_conversation(client_pseudo_id, env)

    if intake_data.error:
        raise ValueError(f"Error fetching intake: {intake_data.error}")

    return ConversationEvalItem(
        conversation_history=intake_data.conversation_history or [],
        completed_sections=intake_data.completed_sections or [],
        sections=sections,
        meta={
            "intake_id": None,
            "client_pseudo_id": intake_data.client_pseudo_id,
            "intake_type": config_file_name,
            "source": "db",
        },
    )


async def evaluate_single_conversation(item: ConversationEvalItem) -> Dict[str, Any]:
    """Run LLM-as-judge evaluation on a single ConversationEvalItem."""
    client_identifier = item.meta.get("client_pseudo_id", "unknown")
    conversation_history = item.conversation_history
    completed_sections = item.completed_sections
    start_time = datetime.now()
    has_error = bool(item.meta.get("conversation_error"))

    evaluation_result = ConversationEvaluation()
    evaluation_result.conversation_data = IntakeConversationData(
        client_pseudo_id=client_identifier,
        conversation_history=conversation_history,
        completed_sections=completed_sections,
    )

    logger.info(
        f"Evaluating {client_identifier}: conversation_history length={len(conversation_history)}, completed_sections={completed_sections}"
    )

    if conversation_history and len(conversation_history) > 0:
        logger.info(f"Evaluating conversation for {client_identifier}...")
        try:
            evaluation = await evaluate_conversation(
                conversation_history=conversation_history,
                completed_sections=completed_sections if completed_sections else [],
                sections=item.sections,
            )
            evaluation_result.ai_evaluation = evaluation

            logger.info(
                f"Evaluation complete for {client_identifier} - Overall: {evaluation.get('overall_score', 'N/A')}/10"
            )

            evaluation_end_time = datetime.now()
            return {
                "evaluation_id": str(uuid.uuid4()),
                "timestamp": start_time.isoformat(),
                "duration_seconds": (evaluation_end_time - start_time).total_seconds(),
                "status": "partial_success" if has_error else "success",
                "result": evaluation_result.model_dump(),
                **item.meta,
            }
        except Exception as e:
            logger.error(
                f"Failed to evaluate conversation for {client_identifier}: {e}"
            )
            evaluation_result.error = str(e)

            evaluation_end_time = datetime.now()
            return {
                "evaluation_id": str(uuid.uuid4()),
                "timestamp": start_time.isoformat(),
                "duration_seconds": (evaluation_end_time - start_time).total_seconds(),
                "status": "failed",
                "error": str(e),
                "result": evaluation_result.model_dump(),
                **item.meta,
            }
    else:
        logger.warning(f"No conversation data to evaluate for {client_identifier}")
        evaluation_result.error = "No conversation data for evaluation"

        evaluation_end_time = datetime.now()
        return {
            "evaluation_id": str(uuid.uuid4()),
            "timestamp": start_time.isoformat(),
            "duration_seconds": (evaluation_end_time - start_time).total_seconds(),
            "status": "failed",
            "error": "No conversation data for evaluation",
            "result": evaluation_result.model_dump(),
            **item.meta,
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


async def _run_pipeline(
    items: List[ConversationEvalItem],
    output_format: str,
    report_file: Optional[Path],
    pipeline_start_time: datetime,
) -> None:
    """Evaluate each item then hand off to output."""
    results = []
    for item in items:
        result = await evaluate_single_conversation(item)
        results.append(result)
    _output_results(results, output_format, report_file, pipeline_start_time)


def _output_results(
    results: List[Dict],
    output_format: str,
    report_file: Optional[Path],
    pipeline_start_time: datetime,
) -> None:
    """Print and/or save evaluation results."""
    if output_format == "html":
        path = (
            str(report_file)
            if report_file
            else f"headless_eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        )
        _write_html_report_headless(results, path)
        print(f"\nHTML report written to: {path}")
        return

    if output_format == "json":
        output_path = report_file
        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w") as f:
                json.dump(results, f, indent=2)
            logger.info(f"Results saved to: {output_path}")
            print(f"\nResults saved to: {output_path}")
        else:
            print(json.dumps(results, indent=2))
        return

    # Console format (default)
    total_duration = (datetime.now() - pipeline_start_time).total_seconds()
    print("\n" + "=" * 60)
    print(" HEADLESS CONVERSATION EVALUATION COMPLETE")
    print("=" * 60)
    print(f" Total duration: {total_duration:.1f} seconds")
    print(f" Evaluated {len(results)} conversation(s)")

    for result in results:
        print("\n" + "-" * 60)
        source = result.get("source", "unknown")
        client_id = result.get("client_pseudo_id", "unknown")
        status = result.get("status", "unknown")

        print(f" Source: {source} | Client: {client_id} | Status: {status}")

        if status == "failed":
            print(f" Error: {result.get('error', 'Unknown error')}")
            continue

        if status == "partial_success":
            print(
                f" Conversation Error: {result.get('conversation_error', 'Unknown error')}"
            )

        evaluation = ConversationEvaluation(**result["result"])
        eval_scores = evaluation.ai_evaluation

        if not eval_scores or "error" in eval_scores:
            err = eval_scores.get("error", "Unknown") if eval_scores else "No scores"
            print(f" Evaluation failed: {err}")
            continue

        overall = eval_scores.get("overall_score", "N/A")
        tone = eval_scores.get("tone_score", "N/A")
        repetition = eval_scores.get("repetition_score", "N/A")
        politeness = eval_scores.get("politeness_score", "N/A")
        flow = eval_scores.get("flow_score", "N/A")

        conv_data = evaluation.conversation_data
        total_exchanges = conv_data.total_exchanges if conv_data else 0
        completed_sections = conv_data.completed_sections if conv_data else []

        print(
            f"\n  {total_exchanges} exchanges, {len(completed_sections)} sections completed"
        )
        print("\n  Scores:")
        print(f"    Overall:     {overall}/10")
        print(f"    Tone:        {tone}/10")
        print(f"    Repetition:  {repetition}/10")
        print(f"    Politeness:  {politeness}/10")
        print(f"    Flow:        {flow}/10")

        section_coverage = eval_scores.get("section_coverage", {})
        if section_coverage:
            print("\n  Section Coverage:")
            for section, coverage in section_coverage.items():
                pct = coverage.get("coverage_percentage", 0)
                print(f"    - {section}: {pct}%")

        overall_feedback = eval_scores.get("overall_feedback", "")
        if overall_feedback:
            print(f"\n  Overall feedback: {overall_feedback}")

        recommendations = eval_scores.get("recommendations", [])
        if recommendations:
            print("\n  Recommendations:")
            for rec in recommendations:
                print(f"    • {rec}")

    print("\n" + "=" * 60)

    if report_file and output_format != "json":
        report_file.parent.mkdir(parents=True, exist_ok=True)
        with open(report_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f" Results saved to: {report_file}")
        print("=" * 60)


# ---------------------------------------------------------------------------
# CLI command
# ---------------------------------------------------------------------------


@cli.command()
async def headless_conversation_eval(
    config_file_name: str = Option(
        "UT-CCCI-v0.yaml",
        "--config-file-name",
        help="Name of the YAML config file such as UT-CCCI-v0.yaml",
    ),
    mode: str = Option(
        ...,
        "--mode",
        help="Conversation source: sample | generate | db",
    ),
    intake_id: Optional[str] = Option(
        None,
        "--intake-id",
        help="UUID of the intake to evaluate (db mode)",
    ),
    client_pseudo_id: Optional[str] = Option(
        None,
        "--client-pseudo-id",
        help="Client pseudo ID to look up intake (db mode, alternative to --intake-id)",
    ),
    environment: str = Option(
        "prod",
        "--environment",
        help="Database environment for db mode: local, dev, demo, staging, prod",
    ),
    output: str = Option(
        "console",
        "--output",
        help="Output format: console (default) | json | html",
    ),
    report_file: Optional[str] = Option(
        None,
        "--report-file",
        help="Output file path (auto-named if omitted for json/html)",
    ),
):
    """
    Run headless conversation evaluation for a single conversation.

    This evaluation assesses the tone and quality of the questions that the AI case
    manager asks during an intake conversation, using an LLM as judge.

    SAMPLE MODE (pre-generated test data):
        uv run python -m app.manage headless-conversation-eval \\
            --config-file-name ID-FACR-v0.yaml --mode sample

    SAMPLE-FAILED MODE (pre-generated sample with a mid-conversation error):
        uv run python -m app.manage headless-conversation-eval \\
            --config-file-name ID-FACR-v0.yaml --mode sample-failed

    GENERATE MODE (synthesize a new conversation with a simulated client):
        uv run python -m app.manage headless-conversation-eval \\
            --config-file-name UT-CCCI-v0.yaml --mode generate

    DB MODE (evaluate a real intake from the database):
        uv run python -m app.manage headless-conversation-eval \\
            --config-file-name UT-CCCI-v0.yaml --mode db \\
            --intake-id <uuid> --environment prod

        uv run python -m app.manage headless-conversation-eval \\
            --config-file-name UT-CCCI-v0.yaml --mode db \\
            --client-pseudo-id <id> --environment staging

    JSON output:
        uv run python -m app.manage headless-conversation-eval \\
            --config-file-name UT-CCCI-v0.yaml --mode db \\
            --intake-id <uuid> --environment prod \\
            --output json --report-file my_eval.json
    """
    valid_modes = {"sample", "sample-failed", "generate", "db"}
    if mode not in valid_modes:
        print(f"Error: --mode must be one of: {', '.join(sorted(valid_modes))}")
        return

    if mode == "db" and not intake_id and not client_pseudo_id:
        print("Error: db mode requires --intake-id or --client-pseudo-id")
        return

    if output not in ("console", "json", "html"):
        print("Error: --output must be 'console', 'json', or 'html'")
        return

    logger.info(f"Starting headless conversation evaluation (mode={mode})")

    assessment_config, sections = get_assessment_config(config_file_name)

    pipeline_start_time = datetime.now()

    # Determine report file path
    resolved_report_file: Optional[Path] = None
    if report_file:
        resolved_report_file = Path(report_file)
    elif output in ("json", "html"):
        results_dir = (
            Path(__file__).parent.parent.parent.parent
            / "experiments"
            / "headless_evaluations"
        )
        timestamp_str = pipeline_start_time.strftime("%Y%m%d_%H%M%S")
        slug = intake_id or client_pseudo_id or mode.replace("-", "_")
        ext = "html" if output == "html" else "json"
        resolved_report_file = (
            results_dir
            / f"headless_eval_{slug}_{config_file_name}_{timestamp_str}.{ext}"
        )

    # Collect the conversation
    try:
        item = await get_conversation(
            mode=mode,
            client_pseudo_id=client_pseudo_id,
            environment=environment,
            sections=sections,
            assessment_config=assessment_config,
            config_file_name=config_file_name,
            intake_id=intake_id,
        )
    except Exception as e:
        logger.exception("Error collecting conversation")
        print(f"Error getting conversation: {e}")
        return

    await _run_pipeline(
        items=[item],
        output_format=output,
        report_file=resolved_report_file,
        pipeline_start_time=pipeline_start_time,
    )


def _write_html_report_headless(results: List[Dict], report_file: str) -> None:
    entries = []
    for result in results:
        eval_scores: Dict = {}
        if result.get("result"):
            ev = ConversationEvaluation(**result["result"])
            eval_scores = ev.ai_evaluation or {}

        conv_data = None
        if result.get("result"):
            ev = ConversationEvaluation(**result["result"])
            conv_data = ev.conversation_data

        entries.append(
            {
                "client_pseudo_id": result.get("client_pseudo_id", "unknown"),
                "status": result.get("status", "unknown"),
                "duration_seconds": result.get("duration_seconds", 0),
                "conversation": [
                    {"question": e.question, "answer": e.answer, "section": e.section}
                    for e in (conv_data.conversation_history if conv_data else [])
                ],
                "scores": {
                    "overall": {
                        "score": eval_scores.get("overall_score", 0),
                        "feedback": eval_scores.get("overall_feedback", ""),
                    },
                    "tone": {
                        "score": eval_scores.get("tone_score", 0),
                        "feedback": eval_scores.get("tone_feedback", ""),
                    },
                    "repetition": {
                        "score": eval_scores.get("repetition_score", 0),
                        "feedback": eval_scores.get("repetition_feedback", ""),
                        "examples": eval_scores.get("repetition_examples", []),
                    },
                    "politeness": {
                        "score": eval_scores.get("politeness_score", 0),
                        "feedback": eval_scores.get("politeness_feedback", ""),
                    },
                    "flow": {
                        "score": eval_scores.get("flow_score", 0),
                        "feedback": eval_scores.get("flow_feedback", ""),
                    },
                },
                "section_coverage": eval_scores.get("section_coverage", {}),
                "recommendations": eval_scores.get("recommendations", []),
                "conversation_failure_reason": eval_scores.get(
                    "conversation_failure_reason", ""
                ),
            }
        )

    write_html_report(_HTML_TEMPLATE_HEADLESS, entries, report_file)


_HTML_TEMPLATE_HEADLESS = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conversation Eval</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    header { background: #1a1a2e; color: #fff; padding: 14px 24px; display: flex; align-items: center; gap: 16px; }
    header h1 { font-size: 16px; font-weight: 600; flex: 1; }
    .badge { display: inline-block; padding: 2px 9px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-partial_success { background: #fff3cd; color: #856404; }
    .badge-failed { background: #f8d7da; color: #721c24; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; height: calc(100vh - 48px); }
    .pane { overflow-y: auto; padding: 20px; }
    .pane + .pane { border-left: 1px solid #ddd; }
    .pane-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #999; margin-bottom: 14px; }
    .exchange { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
    .ex-section { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #aaa; margin-bottom: 6px; }
    .ex-q { font-size: 13px; color: #555; padding-left: 8px; border-left: 2px solid #bbb; margin-bottom: 6px; }
    .ex-a { font-size: 13px; color: #222; padding-left: 8px; border-left: 2px solid #1a1a2e; }
    .score-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 13px; margin-bottom: 10px; }
    .sc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .sc-name { font-size: 13px; font-weight: 600; text-transform: capitalize; flex: 1; }
    .sc-pill { padding: 2px 9px; border-radius: 10px; font-size: 13px; font-weight: 700; }
    .score-hi { background: #d4edda; color: #155724; }
    .score-mid { background: #fff3cd; color: #856404; }
    .score-lo { background: #f8d7da; color: #721c24; }
    .sc-bar { height: 4px; background: #eee; border-radius: 2px; margin-bottom: 8px; }
    .sc-bar-fill { height: 100%; border-radius: 2px; }
    .sc-feedback { font-size: 12px; color: #555; line-height: 1.5; }
    .sc-examples { margin-top: 5px; font-size: 11px; color: #888; font-style: italic; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #999; margin: 18px 0 10px; }
    .cov-item { margin-bottom: 10px; }
    .cov-label { font-size: 12px; font-weight: 600; margin-bottom: 3px; }
    .cov-bar { height: 7px; background: #eee; border-radius: 3px; margin-bottom: 3px; }
    .recs { list-style: disc; padding-left: 18px; }
    .recs li { font-size: 13px; margin-bottom: 5px; color: #444; }
  </style>
</head>
<body>
<div id="root"></div>
<script>
const DATA = __DATA__;
const d = DATA[0] || {};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function scoreClass(n) { return n >= 8 ? 'score-hi' : n >= 5 ? 'score-mid' : 'score-lo'; }
function barColor(n) { return n >= 8 ? '#28a745' : n >= 5 ? '#ffc107' : '#dc3545'; }

const status = d.status || 'unknown';
document.getElementById('root').innerHTML = `
<header>
  <h1>Conversation Eval \u2014 ${esc(d.client_pseudo_id)}</h1>
  <span class="badge badge-${esc(status)}">${esc(status)}</span>
  <span style="font-size:12px;opacity:.7">${(d.duration_seconds||0).toFixed(1)}s \u00b7 ${(d.conversation||[]).length} exchanges</span>
</header>
<div class="layout">
  <div class="pane" id="left"></div>
  <div class="pane" id="right"></div>
</div>`;

let left = '<div class="pane-title">Conversation</div>';
(d.conversation || []).forEach(ex => {
  left += `<div class="exchange">
    <div class="ex-section">${esc(ex.section)}</div>
    ${ex.question ? `<div class="ex-q">${esc(ex.question)}</div>` : ''}
    ${ex.answer ? `<div class="ex-a">${esc(ex.answer)}</div>` : ''}
  </div>`;
});
document.getElementById('left').innerHTML = left;

const scoreKeys = ['overall','tone','repetition','politeness','flow'];
let right = '<div class="pane-title">Evaluation</div>';
scoreKeys.forEach(key => {
  const s = (d.scores || {})[key] || {};
  const n = s.score || 0;
  right += `<div class="score-card">
    <div class="sc-header">
      <span class="sc-name">${key}</span>
      <span class="sc-pill ${scoreClass(n)}">${n}/10</span>
    </div>
    <div class="sc-bar"><div class="sc-bar-fill" style="width:${n*10}%;background:${barColor(n)}"></div></div>
    <div class="sc-feedback">${esc(s.feedback)}</div>
    ${(s.examples||[]).length ? `<div class="sc-examples">Examples: ${s.examples.map(esc).join('; ')}</div>` : ''}
  </div>`;
});

const cov = d.section_coverage || {};
if (Object.keys(cov).length) {
  right += '<div class="section-title">Section Coverage</div>';
  Object.entries(cov).forEach(([sec, c]) => {
    const pct = c.coverage_percentage || 0;
    const col = pct >= 80 ? '#28a745' : pct >= 50 ? '#ffc107' : '#dc3545';
    right += `<div class="cov-item">
      <div class="cov-label">${esc(sec)} \u2014 ${pct}%</div>
      <div class="cov-bar"><div style="width:${pct}%;height:100%;border-radius:3px;background:${col}"></div></div>
    </div>`;
  });
}

const recs = d.recommendations || [];
if (recs.length) {
  right += '<div class="section-title">Recommendations</div>';
  right += '<ul class="recs">' + recs.map(r => `<li>${esc(r)}</li>`).join('') + '</ul>';
}

if (d.conversation_failure_reason) {
  right += `<div class="section-title">Failure Reason</div><p style="font-size:13px;color:#555;margin-top:6px">${esc(d.conversation_failure_reason)}</p>`;
}

document.getElementById('right').innerHTML = right;
</script>
</body>
</html>"""
