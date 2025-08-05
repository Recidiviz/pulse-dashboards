import asyncio
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import dt_model as model
from app.utils.intakeAssessment.constants import PERSONAS
from app.utils.intakeAssessment.conversation_graph import IntakeConversationGraph

PROMPT_TEMPLATE = """
You are roleplaying someone responding via text chat during an intake assessment.

Response style:
- Type like you're chatting online (brief, casual)
- Use 1-2 short sentences max
- Keep it natural, like real chat messages
- It's ok to use simple punctuation
- No need for perfect grammar, but stay clear

Background: {persona}

Question to answer: {question}
"""


class UserSimulator:
    def __init__(self, persona_text, force_unclear=False):
        self.persona = persona_text
        self.model = model
        self.force_unclear = force_unclear

    def generate_response(self, question):
        """Generate a response using the LLM with the persona context."""
        import random

        if self.force_unclear:
            unclear_responses = [
                "I don't want to talk about that.",
                "Why are you asking me this?",
                "This doesn't make sense.",
                "I'm confused.",
                "Can we talk about something else?",
            ]
            return random.choice(unclear_responses)

        persona_prompt = f"""
        You are roleplaying someone responding via text chat during an intake assessment.

        Response style:
        - Type like you're chatting online (brief, casual)
        - Use 1-2 short sentences max
        - Keep it natural, like real chat messages
        - It's ok to use simple punctuation
        - No need for perfect grammar, but stay clear

        Background: {self.persona}

        Question to answer: {question}
        """
        try:
            raw_response = self.model.invoke(
                [SystemMessage(content=persona_prompt), HumanMessage(content=question)]
            )
            response_text = (
                str(raw_response.content)
                if hasattr(raw_response, "content")
                else str(raw_response)
            )
            # print(f"DEBUG - Response: {response_text[:50]}...")
            return response_text
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"I'm not sure how to answer that. ({e})"


class SimulatedConversationHandler:
    def __init__(self, persona: dict):
        self.persona = persona
        self.intake_manager = None
        self.session_id = persona.get("client_id")

    @classmethod
    async def create(cls, persona: dict):
        """Async constructor method."""
        instance = cls(persona)
        # instance.intake_manager = RedisManager(redis_url=)
        await instance.intake_manager.initialize()
        await instance.intake_manager.register_conversation({"user": persona})
        return instance

    async def run_simulator(self, simulator: UserSimulator):
        """Run conversation with simulated responses."""
        try:
            assessment = IntakeConversationGraph(self.persona, self.intake_manager)

            async def handle_responses():
                while True:
                    state = self.intake_manager.active_conversations.get(
                        self.session_id
                    )

                    if state and state.waiting_for_response:
                        try:
                            prompt_obj = state.current_prompt
                            prompt_content = (
                                prompt_obj.content
                                if hasattr(prompt_obj, "content")
                                else str(prompt_obj)
                            )
                            raw_response = simulator.generate_response(prompt_content)

                            if hasattr(raw_response, "content") and isinstance(
                                raw_response.content, str
                            ):
                                response_text = raw_response.content
                            elif (
                                isinstance(raw_response, dict)
                                and "content" in raw_response
                            ):
                                response_text = raw_response["content"]
                            elif isinstance(raw_response, str):
                                response_text = raw_response
                            else:
                                response_text = str(raw_response)

                            print("\n\033[1;32m>> Client:\033[0m")
                            print(response_text)
                            await self.intake_manager.add_response(
                                self.session_id, response_text
                            )
                        except Exception as e:
                            print(f"Error in handle_responses: {e}")
                            await self.intake_manager.add_response(
                                self.session_id, "I'm having trouble understanding."
                            )
                    await asyncio.sleep(0.1)

            response_task = asyncio.create_task(handle_responses())
            try:
                result = await assessment.run_assessment()
                # Ensure result is serializable.
                if isinstance(result, dict):
                    for key, value in result.items():
                        if hasattr(value, "content"):
                            result[key] = value.content
                        elif not isinstance(
                            value, (str, int, float, bool, list, dict, type(None))
                        ):
                            result[key] = str(value)
            except Exception as e:
                traceback.print_exc()
                print(f"Error in assessment: {e}")
                result = {"status": "error", "error": str(e)}
            response_task.cancel()
            return result

        except Exception as e:
            print(f"Error in simulator: {e}")

    async def run_human(self):
        """Run conversation with human input."""
        try:
            assessment = IntakeConversationGraph(self.persona, self.intake_manager)

            async def handle_input():
                while True:
                    state = self.intake_manager.active_conversations.get(
                        self.persona.get("client_id")
                    )
                    if state and state.waiting_for_response:
                        print("\n\033[1;34m>> Case Worker:\033[0m")
                        print(state.current_prompt)
                        print("\n\033[1;32m>>")
                        response = await asyncio.get_event_loop().run_in_executor(
                            None, input, ""
                        )
                        if response.lower() in ["end chat", "exit", "quit", "bye"]:
                            print("See you next time!")
                            return
                        await self.intake_manager.add_response(
                            self.persona.get("client_id"), response
                        )
                    await asyncio.sleep(0.1)

            input_task = asyncio.create_task(handle_input())
            result = await assessment.run_assessment()
            input_task.cancel()
            return result

        except Exception as e:
            traceback.print_exc()
            print(f"Error in human mode: {e}")


def select_persona() -> dict:
    """Select a persona with a default fallback."""
    print("\nAvailable client personas 👤:")
    for client_name in PERSONAS:
        print(f"► {client_name.capitalize()}")
    persona_name = input("\nEnter persona client_name: ").strip().lower()
    if persona_name not in PERSONAS:
        print(f"Invalid persona '{persona_name}'. Defaulting to 'taylor'.")
        persona_name = "taylor"

    return PERSONAS[persona_name]


def select_mode() -> str:
    """Select interaction mode with a default fallback."""
    print("\nSelect mode:")
    print("1. Simulator 🤖")
    print("2. Human 👤")
    choice = input("Enter choice (1 or 2): ").strip().lower()
    if choice in ["1", "simulator"]:
        return "simulator"
    elif choice in ["2", "human"]:
        return "human"
    print("Invalid choice! Defaulting to simulator mode.")
    return "simulator"


async def run_conversation(persona: dict, mode: str) -> None:
    """Run the conversation in simulator or human mode."""
    handler = await SimulatedConversationHandler.create(persona)
    try:
        if mode == "simulator":
            simulator = UserSimulator(persona, force_unclear=False)
            await handler.run_simulator(simulator)
        else:
            await handler.run_human()
    except Exception as e:
        traceback.print_exc()
        print(f"Error running conversation: {e}")


if __name__ == "__main__":
    persona = select_persona()
    mode = select_mode()
    asyncio.run(run_conversation(persona, mode))
