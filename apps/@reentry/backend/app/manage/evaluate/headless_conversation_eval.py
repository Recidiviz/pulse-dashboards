"""
Headless conversation evaluation that runs multiple clients simultaneously using LLM-generated responses.
This allows testing the conversation flow without manual input by simulating client responses with an AI model.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.models.intake import IntakeMessage, IntakeMessageRole, IntakeSection
from app.utils.intake.constants import SECTIONS_LSIR, SECTIONS_ORAS_RT
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.schemas import ClientContext, ServerEvent

from ..base import cli

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger(__name__)


class ConversationEvaluator:
    """Evaluates conversation quality using a more powerful AI model."""

    def __init__(self, sections):
        # Use GPT-4 for evaluation (more powerful than the conversation model)
        self.evaluation_llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="gpt-o3-mini",
            temperature=0.1,  # Lower temperature for more consistent evaluation
            max_tokens=1000,
        )
        self.sections = sections

    async def evaluate_conversation(
        self, conversation_history: List[Dict[str, str]], completed_sections: List[str]
    ) -> Dict[str, Any]:
        """Evaluate the AI caseworker's performance in the conversation."""

        # Build conversation text
        conversation_text = ""
        ai_questions = []
        for exchange in conversation_history:
            conversation_text += f"AI Caseworker: {exchange['ai']}\n"
            conversation_text += f"Client: {exchange['client']}\n\n"
            ai_questions.append(exchange["ai"])

        # Get section requirements for completed sections
        completed_section_requirements = []
        for section_data in self.sections:
            if section_data["title"] in completed_sections:
                completed_section_requirements.append(
                    {
                        "title": section_data["title"],
                        "requirements": section_data["description"],
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
You are an expert evaluator assessing the performance of an AI caseworker conducting intake assessments.

CONVERSATION TO EVALUATE:
{conversation_text}

{sections_status}

SECTION REQUIREMENTS FOR COMPLETED SECTIONS:
{requirements_text}

Please evaluate the AI caseworker's performance on the following criteria:

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

Provide your evaluation in JSON format with the following structure:
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
                    evaluation_data = json.loads(json_text)
                else:
                    raise ValueError("No JSON found in response")
            except (json.JSONDecodeError, ValueError):
                # Fallback if JSON parsing fails
                evaluation_data = {
                    "tone_score": 5,
                    "tone_feedback": "Unable to parse evaluation",
                    "repetition_score": 5,
                    "repetition_feedback": "Unable to parse evaluation",
                    "repetition_examples": [],
                    "section_coverage": {},
                    "politeness_score": 5,
                    "politeness_feedback": "Unable to parse evaluation",
                    "flow_score": 5,
                    "flow_feedback": "Unable to parse evaluation",
                    "overall_score": 5,
                    "overall_feedback": "Evaluation parsing failed",
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

    def __init__(self, client_id: str, client_name: str, persona: Dict[str, Any]):
        self.client_id = client_id
        self.client_name = client_name
        self.persona = persona
        self.conversation_history: List[Dict[str, str]] = []
        self.completed_sections: List[str] = []

        # Initialize LLM for generating responses using app settings
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=200,
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
                conversation_context += f"Caseworker: {exchange['ai']}\n"
                conversation_context += f"You: {exchange['client']}\n"

        prompt = f'{persona_context}{conversation_context}\n\nCaseworker just said: "{ai_message}"\n\nRespond as {self.client_name}:'

        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            client_response = response.content.strip()

            # Store this exchange
            self.conversation_history.append(
                {
                    "ai": ai_message,
                    "client": client_response,
                    "section": current_section,
                }
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

    def __init__(self, client_id: str, sections):
        self.client_id = client_id
        self.current_section_index = 0
        self.sections = [section["title"] for section in sections]
        self.messages: List[IntakeMessage] = []

    async def store_message(
        self, client_id: str, content: str, from_role: str
    ) -> IntakeMessage:
        """Store message in memory."""
        message = IntakeMessage(
            id=str(uuid.uuid4()),
            content=content,
            from_role=IntakeMessageRole(from_role),
            client_id=client_id,
            intake_id=str(uuid.uuid4()),
        )
        self.messages.append(message)
        logger.debug(f"[{client_id}] Stored {from_role} message: {content[:50]}...")
        return message

    async def get_latest_message(self, client_id: str) -> IntakeMessage:
        """Get the latest message."""
        if self.messages:
            return self.messages[-1]
        return IntakeMessage(
            id=str(uuid.uuid4()),
            content="No messages yet",
            from_role=IntakeMessageRole.CASEWORKER,
            client_id=client_id,
            intake_id=str(uuid.uuid4()),
        )

    async def complete_section(self, client_id: str) -> str:
        """Complete current section and move to next."""
        self.current_section_index += 1

        if self.current_section_index >= len(self.sections):
            logger.info(f"[{client_id}] All sections completed")
            return "Completion"

        next_section = self.sections[self.current_section_index]
        logger.info(f"[{client_id}] Moving to section: {next_section}")
        return next_section

    async def update_intake_status(self, client_id: str, status: str) -> None:
        """Update intake status."""
        logger.info(f"[{client_id}] Status updated to: {status}")

    async def all_messages_by_time(self, client_id: str) -> List[IntakeMessage]:
        """Get all messages."""
        return self.messages


class HeadlessIntake:
    """Mock intake object for headless evaluation."""

    def __init__(self, sections):
        self.current_section = sections[0]["title"]


async def run_client_conversation(
    client: HeadlessIntakeClient, sections
) -> Dict[str, Any]:
    """Run a complete conversation for a single client."""
    logger.info(f"Starting conversation for {client.client_name} ({client.client_id})")

    # Create components
    mock_db_manager = HeadlessDatabaseManager(client.client_id, sections)
    mock_intake = HeadlessIntake(sections)

    async def headless_wait_for_user_response(
        client_id: str, message: IntakeMessage
    ) -> str:
        """Generate response using the client's LLM."""
        ai_content = message.content

        # Generate client response
        response = await client.generate_response(
            ai_content, mock_intake.current_section
        )

        return response

    async def headless_send_message(client_id: str, event: ServerEvent) -> str:
        """Handle server events."""
        if event.type == "sectionChange":
            mock_intake.current_section = event.content.section
            client.completed_sections.append(event.content.section)

        return "sent"

    # Create sections
    modelled_sections = [
        IntakeSection(
            title=section["title"],
            description=section["description"],
            required_information=section["required_information"],
        )
        for section in sections
    ]

    # Initialize conversation graph
    client_context = ClientContext(
        client_id=client.client_id, client_name=client.client_name
    )
    conversation_graph = IntakeConversationGraph(
        session=client_context,
        db_manager=mock_db_manager,
        wait_for_user_response=headless_wait_for_user_response,
        send_message=headless_send_message,
    )

    try:
        # Initialize and run the assessment
        await conversation_graph.initialize(mock_intake, modelled_sections)
        final_state = await conversation_graph.run_assessment()

        # Compile results
        result = {
            "client_id": client.client_id,
            "client_name": client.client_name,
            "persona": client.persona,
            "completed_sections": client.completed_sections,
            "total_exchanges": len(client.conversation_history),
            "conversation_history": client.conversation_history,
            "final_section": final_state.get("current_section", "Unknown"),
            "total_messages": len(final_state.get("messages", [])),
            "status": "completed",
        }

        logger.info(
            f"Completed conversation for {client.client_name}: {len(client.conversation_history)} exchanges"
        )
        return result

    except Exception as e:
        logger.error(f"Error in conversation for {client.client_name}: {e}")
        return {
            "client_id": client.client_id,
            "client_name": client.client_name,
            "persona": client.persona,
            "error": str(e),
            "status": "failed",
            "completed_sections": client.completed_sections,
            "total_exchanges": len(client.conversation_history),
            "conversation_history": client.conversation_history,
        }


# Sample personas for testing
SAMPLE_PERSONAS = [
    {
        "name": "Jordan Smith",
        "age": 35,
        "background": "About to be released from a 2-year sentence for theft. Struggles with substance abuse issues. Has children but limited custody. Completed treatment program once before.",
        "challenges": "Staying sober, rebuilding relationship with children, finding housing, managing mental health",
        "communication_style": "Open about struggles but sometimes defensive. Uses humor to deflect. Shows some motivation for change, but is not interested in everything. Makes short answers with low literacy",
    },
]


@cli.command()
async def headless_conversation_eval(type: str):
    """
    Run headless conversation evaluation with multiple simulated clients.
    """
    logger.info("Starting headless conversation evaluation...")

    if type != "lsir" and type != "oras":
        print(
            '!! the supported intake types are "oras" and "lsir", defaulting to "lsir"!!'
        )

    sections = SECTIONS_LSIR if type == "lsir" else SECTIONS_ORAS_RT

    # Create clients with personas
    clients = []
    for i, persona in enumerate(SAMPLE_PERSONAS):
        client_id = f"eval-client-{i+1}-{uuid.uuid4().hex[:8]}"
        client = HeadlessIntakeClient(
            client_id=client_id, client_name=persona["name"], persona=persona
        )
        clients.append(client)

    logger.info(f"Created {len(clients)} simulated clients")

    # Run conversations concurrently
    start_time = datetime.now()
    tasks = [run_client_conversation(client, sections) for client in clients]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    end_time = datetime.now()

    # Process results
    successful_results = []
    failed_results = []

    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Task failed with exception: {result}")
            failed_results.append({"error": str(result), "status": "exception"})
        elif result.get("status") == "completed":
            successful_results.append(result)
        else:
            failed_results.append(result)

    # Evaluate conversations using GPT-4
    logger.info("Starting conversation evaluations...")
    evaluator = ConversationEvaluator(sections)

    # Evaluate both successful and failed conversations
    all_results = successful_results + failed_results

    for result in all_results:
        client_name = result.get("client_name", "Unknown")
        conversation_history = result.get("conversation_history", [])
        completed_sections = result.get("completed_sections", [])

        # Debug the evaluation conditions
        logger.info(
            f"Evaluating {client_name}: conversation_history length={len(conversation_history)}, completed_sections={completed_sections}"
        )

        # Run evaluation if there's any conversation data (even if incomplete)
        if conversation_history and len(conversation_history) > 0:
            logger.info(f"Evaluating conversation for {client_name}...")
            try:
                evaluation = await evaluator.evaluate_conversation(
                    conversation_history,
                    completed_sections if completed_sections else [],
                )
                result["ai_evaluation"] = evaluation
                logger.info(
                    f"Evaluation complete for {client_name} - Overall: {evaluation.get('overall_score', 'N/A')}/10"
                )
            except Exception as e:
                logger.error(f"Failed to evaluate conversation for {client_name}: {e}")
                result["ai_evaluation"] = {"error": f"Evaluation failed: {str(e)}"}
        else:
            logger.warning(f"No conversation data to evaluate for {client_name}")
            result["ai_evaluation"] = {
                "error": "No conversation data for evaluation",
                "debug_info": {
                    "conversation_history_present": bool(conversation_history),
                    "conversation_history_length": len(conversation_history)
                    if conversation_history
                    else 0,
                    "completed_sections_present": bool(completed_sections),
                    "completed_sections": completed_sections
                    if completed_sections
                    else [],
                },
            }

    # Create evaluation summary
    evaluation_summary = {
        "evaluation_id": str(uuid.uuid4()),
        "timestamp": start_time.isoformat(),
        "duration_seconds": (end_time - start_time).total_seconds(),
        "total_clients": len(clients),
        "successful_completions": len(successful_results),
        "failed_conversations": len(failed_results),
        "results": successful_results,
        "failures": failed_results,
    }

    # Save results
    results_dir = (
        Path(__file__).parent.parent.parent.parent
        / "experiments"
        / "headless_evaluations"
    )
    results_dir.mkdir(parents=True, exist_ok=True)

    timestamp_str = start_time.strftime("%Y%m%d_%H%M%S")
    results_file = results_dir / f"headless_eval_{timestamp_str}.json"

    with open(results_file, "w") as f:
        json.dump(evaluation_summary, f, indent=2)

    # Print summary
    print("\n" + "=" * 60)
    print("🔬 HEADLESS CONVERSATION EVALUATION COMPLETE")
    print("=" * 60)
    print(f"📊 Total clients: {evaluation_summary['total_clients']}")
    print(f"✅ Successful completions: {evaluation_summary['successful_completions']}")
    print(f"❌ Failed conversations: {evaluation_summary['failed_conversations']}")
    print(f"⏱️  Total duration: {evaluation_summary['duration_seconds']:.1f} seconds")

    if successful_results:
        print("\n📈 SUCCESS DETAILS:")
        for result in successful_results:
            eval_scores = result.get("ai_evaluation", {})
            overall_score = eval_scores.get("overall_score", "N/A")
            tone_score = eval_scores.get("tone_score", "N/A")
            repetition_score = eval_scores.get("repetition_score", "N/A")

            print(
                f"  • {result['client_name']}: {result['total_exchanges']} exchanges, "
                f"{len(result['completed_sections'])} sections completed"
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

    if failed_results:
        print("\n🚨 FAILURE DETAILS:")
        for failure in failed_results:
            client_name = failure.get("client_name", "Unknown client")
            error = failure.get("error", "Unknown error")

            print(f"  • {client_name}: {error}")

            # Show evaluation if available for failed conversations
            eval_scores = failure.get("ai_evaluation", {})
            if eval_scores and "error" not in eval_scores:
                overall_score = eval_scores.get("overall_score", "N/A")
                tone_score = eval_scores.get("tone_score", "N/A")
                repetition_score = eval_scores.get("repetition_score", "N/A")
                print(
                    f"    AI Evaluation: Overall {overall_score}/10, Tone {tone_score}/10, No-Repetition {repetition_score}/10"
                )
            elif eval_scores:
                print(f"    AI Evaluation: {eval_scores.get('error', 'Failed')}")

    print(f"\n💾 Results saved to: {results_file}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(headless_conversation_eval("oras"))
