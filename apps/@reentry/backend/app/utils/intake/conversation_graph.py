import logging
import traceback
from datetime import datetime
from typing import Any, Callable, Coroutine, Dict, Literal, Optional

from langchain_core.messages import AIMessage, AnyMessage
from langchain_core.messages.human import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.types import Command

from app.core.config import dt_model as model
from app.core.config import tracer
from app.crud.intake import WELCOME_BACK_TEST_STRING
from app.models.intake import (
    COMPLETION_SECTION,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
)
from app.routes.shared_models import IntakeMessageResponse
from app.utils.CustomMetricsCallbackHandler import CustomMetricsCallbackHandler
from app.utils.intake import db_manager
from app.utils.intake.prompts import (
    CheckIfClientNeedsHelp,
    IsSectionComplete,
    generate_closing_remarks_prompt,
    generate_opening_remarks_prompt,
    generate_question_prompt,
    get_check_if_client_needs_help_prompt,
    get_system_message_prompt,
)
from app.utils.intake.schemas import (
    AIMessageEvent,
    ClientContext,
    ConfigSchema,
    ConversationState,
    ErrorInfo,
    ServerEvent,
)
from app.utils.intake.utils import (
    log_error,
)

logger = logging.getLogger(__name__)


class IntakeConversationGraph:
    """
    Graph-based conversation flow manager for intake assessments.
    """

    custom_metrics_callback = CustomMetricsCallbackHandler(prefix="llm_regenerations")

    def __init__(
        self,
        session: ClientContext,
        db_manager: db_manager.DatabaseManager,
        wait_for_user_response: Callable[
            [str, IntakeMessage], Coroutine[Any, Any, str]
        ],
        send_message: Callable[[str, ServerEvent], Coroutine[Any, Any, str]],
    ) -> None:
        self.memory = MemorySaver()
        self.model = model
        self.session = session
        self.db_manager = db_manager
        self.send_message = send_message
        self.log_error = log_error
        self.wait_for_user_response = wait_for_user_response
        self.config = {
            "configurable": {"thread_id": session.client_pseudo_id},
            "callbacks": [self.custom_metrics_callback],
        }
        if tracer:
            self.config["callbacks"].append(tracer)

        # These will be initialized in initialize()
        self.workflow = None
        self.graph = None

    async def initialize(self, intake: Intake, client_sections: list) -> None:
        """Initialize the conversation graph asynchronously."""
        self.initial_state: ConversationState = await self.compute_initial_state(intake)
        self.workflow = StateGraph(
            state_schema=ConversationState,
            config_schema=ConfigSchema,
        )
        self._build_graph()
        self.graph = self.workflow.compile(checkpointer=self.memory)
        # Convert client sections to effective section data for lookup
        self.section_data = {}
        for client_section in client_sections:
            section_data = client_section.get_effective_section_data()
            self.section_data[section_data["title"]] = section_data

    def _build_graph(self) -> None:
        if not self.workflow:
            raise RuntimeError("Intake State Graph is not initialized")
        """Constructs the conversation workflow with evaluation nodes."""
        # Define nodes for each conversation state
        self.workflow.add_node("chat_introduction", self._opening_remarks)
        self.workflow.add_node("ask_question", self._ask_section_question)
        self.workflow.add_node("section_complete", self._complete_section)
        self.workflow.add_node(
            "check_if_client_needs_help", self._check_if_client_needs_help
        )
        self.workflow.add_node("closing_chat", self._closing_remarks)
        self.workflow.add_node(
            "resume_conversation_user", self._resume_conversation_user
        )

        # Set conditional entry point based on conversation state
        self.workflow.set_conditional_entry_point(self._get_entry_point)
        # Set condition for internal intake
        self.workflow.add_edge("resume_conversation_user", "ask_question")

        # Define edges between nodes
        self.workflow.add_edge("chat_introduction", "ask_question")

        self.workflow.add_conditional_edges(
            "section_complete",
            lambda state: "closing_chat"
            if state["current_section"] == COMPLETION_SECTION
            or state["current_section"] is None
            else "ask_question",
        )
        self.workflow.add_edge("closing_chat", END)

    async def call_model(
        self, messages: list[AnyMessage], output_type: Optional[Any] = None
    ):
        logger.info(
            f"🔄 CALLING MODEL: {len(messages)} messages, output_type={output_type.__name__ if output_type else 'None'}"
        )
        start_time = datetime.now()

        try:
            if output_type is not None:
                response = await model.with_structured_output(output_type).ainvoke(
                    messages, self.config
                )
            else:
                response = await model.ainvoke(messages, self.config)

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"✅ MODEL RESPONSE RECEIVED in {duration:.2f}s")
            return response

        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.error(f"❌ MODEL CALL FAILED after {duration:.2f}s: {e}")
            raise

    async def _get_entry_point(
        self, state: ConversationState
    ) -> Literal[
        "resume_conversation_user",
        "chat_introduction",
        "check_if_client_needs_help",
    ]:
        """
        Determine the entry point for the conversation based on the current state.
        - If no messages, start with introduction
        - If the last message is from the AI, resume conversation to let user answer
        - If the last message is from the user, continue the assessment
        """
        num_messages = len(state["messages"])
        print(f"Determining entry point. Messages count: {num_messages}")

        # New conversation (just the system message)
        if num_messages <= 1:
            print("Starting with chat_introduction - new conversation")
            return "chat_introduction"

        # Check the last message to determine what to do next
        last_message = state["messages"][-1]

        # If the last message is from the AI, it's the user's turn to answer
        # In this case, we should resume to let them see the last AI message again
        if isinstance(last_message, AIMessage):
            print("Last message was from AI - resuming conversation for user to answer")
            return "resume_conversation_user"
        else:
            # If the last message was from the user, we need to generate a new question
            print(
                "Last message was from user - checking is section is finished and maybe ask a new question"
            )
            return "check_if_client_needs_help"

    async def _opening_remarks(self, state: ConversationState) -> ConversationState:
        logger.info("🔵 ENTERING NODE: _opening_remarks")
        if not self.db_manager:
            raise RuntimeError("database manager !")
        client_data = self.session
        sections_titles = await self.db_manager.get_section_titles(
            client_data.client_pseudo_id
        )
        opening_prompt = generate_opening_remarks_prompt(client_data, sections_titles)

        state["messages"].append(opening_prompt)
        try:
            client_pseudo_id = self.session.client_pseudo_id

            response = await self.call_model(state["messages"])
            ai_message_str = response if isinstance(response, str) else response.content
            state["messages"].append(AIMessage(ai_message_str))
            message = await self.db_manager.store_message(
                client_pseudo_id=client_pseudo_id,
                content=ai_message_str,
                from_role=IntakeMessageRole.CASEWORKER,
            )
            if not message:
                raise ValueError(
                    f"error saving message in opening remarks for client {client_pseudo_id}"
                )

            message_event = AIMessageEvent(
                content=IntakeMessageResponse(**message.model_dump())
            )
            await self.send_message(client_pseudo_id, message_event)

            return state

        except Exception as e:
            traceback.print_exc()
            error_info: ErrorInfo = {
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
                "location": "_opening_remarks",
            }
            self.log_error(error_info, e)
            raise e

    async def _ask_section_question(self, state: ConversationState) -> Command:
        logger.info("🟡 ENTERING NODE: _ask_section_question")
        current_section_title = state["current_section"]
        try:
            client_pseudo_id = self.session.client_pseudo_id
            if not current_section_title:
                raise ValueError("Empty current section")

            # Find the section data by title
            if current_section_title not in self.section_data:
                raise ValueError(f"Section not found: {current_section_title}")

            section_data = self.section_data[current_section_title]
            print(
                f"🤖 CONVERSATION: Using {section_data['source']} data for section: {section_data['title']}"
            )
            print(
                f"   Required info: {section_data.get('required_information', 'N/A')[:50]}..."
            )

            # Get required_information from the effective section data
            required_info = section_data.get(
                "required_information", "No specific requirements"
            )

            prompt_template = generate_question_prompt(
                section_data["title"],
                required_info,
            )

            response = await self.call_model(
                state["messages"] + [prompt_template], IsSectionComplete
            )

            print(f"DEBUG: Section complete: {response.section_complete}")
            print(f"DEBUG: Response: {response.section_next_question}")
            print(f"DEBUG: Reasoning: {response.section_complete_reasoning}")

            if response.section_complete or not response.section_next_question:
                return Command(goto="section_complete")

            state["messages"].append(AIMessage(response.section_next_question))
            message = await self.db_manager.store_message(
                client_pseudo_id=client_pseudo_id,
                content=response.section_next_question,
                from_role=IntakeMessageRole.CASEWORKER,
            )
            if not message:
                raise ValueError(
                    f"error saving message in ask question for client {client_pseudo_id}"
                )
            client_response = await self.wait_for_user_response(
                self.session.client_pseudo_id,
                message,
            )
            if not client_response:
                # Handled extrenally by deleting the graph and re-intantiating when we receive a message
                print("timeout human")
                return Command(goto=END)

            state["messages"].append(HumanMessage(client_response))

            return Command(update=state, goto="check_if_client_needs_help")

        except Exception as e:
            traceback.print_exc()
            print(f"ERROR in _ask_section_question: {e}")
            raise e  # Let the error bubble up instead of setting state["error"]

    async def _resume_conversation_user(self, state: ConversationState):
        logger.info("🟢 ENTERING NODE: _resume_conversation_user")
        """
        Handle conversation resumption when the user reconnects.
        This method is called when the last message was from AI and we're waiting for user input.
        It sends a brief welcome back note and then waits for the user response.
        """
        # Log resumption for debugging
        logger.info(
            f"Resuming conversation for client {self.session.client_pseudo_id} in section {state['current_section']}"
        )

        try:
            client_pseudo_id = self.session.client_pseudo_id
            is_internal = await self.db_manager.is_internal_intake(client_pseudo_id)
            welcome_message_text = f"Hi {self.session.client_name}, thanks for joining again! Let's continue our conversation."

            # Check if the last message from the database is already a welcome back message
            # SO we avoid adding multiple welcome messages during unstable connections
            latest_message = await self.db_manager.get_latest_message(client_pseudo_id)
            is_last_message_welcome_back = (
                latest_message
                and latest_message.content
                and WELCOME_BACK_TEST_STRING in latest_message.content.lower()
                and latest_message.from_role == IntakeMessageRole.CASEWORKER
            )

            if is_last_message_welcome_back and not is_internal:
                # When conversation is not internal, the user gets conversation history.
                # The question and welcome back message are already there, so we simply await the user response
                logger.info(
                    "Reusing existing welcome back message to prevent duplicates"
                )
                # Non-internal user: wait for the client's response
                client_response = await self.wait_for_user_response(
                    client_pseudo_id, latest_message
                )

                # Add the client's response to the conversation state
                state["messages"].append(HumanMessage(client_response))

                return state

            elif not is_last_message_welcome_back and not is_internal:
                # When conversation is not internal, the user gets conversation history.
                # There is no welcome back message, so send it.
                # store welcome back
                stored_message = await self.db_manager.store_message(
                    client_pseudo_id=client_pseudo_id,
                    content=welcome_message_text,
                    from_role=IntakeMessageRole.CASEWORKER,
                )
                if not stored_message:
                    raise ValueError(
                        f"Could not save welcome back message for client {client_pseudo_id}"
                    )
                # store in conversation state
                state["messages"].append(AIMessage(welcome_message_text))
                message_event = AIMessageEvent(
                    content=IntakeMessageResponse(**stored_message.model_dump())
                )
                # Non-internal user: wait for the client's response
                client_response = await self.send_message(
                    client_pseudo_id, message_event
                )

                # Add the client's response to the conversation state
                state["messages"].append(HumanMessage(client_response))

                return state

            elif is_internal:
                logger.info(
                    "Internal user: sending welcome back message and retrieving latest contentful AI message"
                )

                # Send the welcome back message directly to client
                await self.send_message(
                    client_pseudo_id,
                    AIMessageEvent(
                        content=IntakeMessageResponse(
                            **IntakeMessage(
                                intake_id=client_pseudo_id,
                                content=welcome_message_text,
                                from_role=IntakeMessageRole.CASEWORKER,
                            ).model_dump()
                        )
                    ),
                )
                if not is_last_message_welcome_back:
                    # if the welcome back message is not in store, store it
                    stored_message = await self.db_manager.store_message(
                        client_pseudo_id=client_pseudo_id,
                        content=welcome_message_text,
                        from_role=IntakeMessageRole.CASEWORKER,
                    )
                    logger.info(
                        "Reusing existing welcome back message to prevent duplicates"
                    )
                    # Non-internal user: wait for the client's response
                    client_response = await self.wait_for_user_response(
                        client_pseudo_id, latest_message
                    )

                    # Add the client's response to the conversation state
                    state["messages"].append(HumanMessage(client_response))
                    return state
                else:
                    # latest message is a welcome back, and user doesn't havce message history, find the latest contentful AI message and await an answer to that message.
                    latest_message = (
                        await self.db_manager.get_latest_non_welcome_ai_message(
                            client_pseudo_id
                        )
                    )
                    # Non-internal user: wait for the client's response
                    client_response = await self.wait_for_user_response(
                        client_pseudo_id, latest_message
                    )

                    if not client_response:
                        # Handled extrenally by deleting the graph and re-intantiating when we receive a message

                        return END
                    # Add the client's response to the conversation state
                    state["messages"].append(HumanMessage(client_response))
                    return state

            else:
                raise ValueError("invalid conversation state")

        except Exception as e:
            # Handle any errors during resumption
            logger.error(f"Error in _resume_conversation_user: {e}")

            # Return the state unchanged if there was an error
            return state

    async def _complete_section(self, state: ConversationState) -> ConversationState:
        logger.info("🟠 ENTERING NODE: _complete_section")
        """
        Complete the current section and prepare for the next one.
        Includes transition message similar to JavaScript version.

        Args:
            state: Current conversation state

        Returns:
            Updated state
        """
        print("DEBUG _complete_section: STARTING section completion")
        if not self.db_manager:
            raise RuntimeError("No db manager !")

        # Add transition message before completing section
        transition_message_text = "Thank you for sharing all of that information. I really appreciate it. Let's move on to the next section!"

        state["messages"].append(AIMessage(transition_message_text))
        message = await self.db_manager.store_message(
            client_pseudo_id=self.session.client_pseudo_id,
            content=transition_message_text,
            from_role=IntakeMessageRole.CASEWORKER,
        )
        if not message:
            raise ValueError(
                f"Could not save transition message for client {self.session.client_pseudo_id}"
            )

        # Complete section in database
        new_section_title = await self.db_manager.complete_section(
            client_pseudo_id=str(self.session.client_pseudo_id)
        )
        if new_section_title == "error":
            raise ValueError("Could not complete section")

        state["current_section"] = new_section_title

        # Notify client about section change with empty messages list for the new section
        from app.utils.intake.schemas import SectionChangeContent, SectionChangeEvent

        section_change_event = SectionChangeEvent(
            content=SectionChangeContent(section=new_section_title, messages=[])
        )
        await self.send_message(self.session.client_pseudo_id, section_change_event)

        return state

    async def _check_if_client_needs_help(self, state: ConversationState) -> Command:
        logger.info("🟣 ENTERING NODE: _check_if_client_needs_help")
        """
        Check if the client needs help or wants to stop the conversation.
        Based on JavaScript checkIfClientNeedsHelp function.

        Args:
            state: Current conversation state

        Returns:
            Updated state or Command to redirect flow
        """
        prompt = get_check_if_client_needs_help_prompt()

        response: CheckIfClientNeedsHelp = await self.call_model(
            state["messages"] + [prompt], CheckIfClientNeedsHelp
        )

        print(f"Needs Help: {response.needs_help}")
        print(f"Needs Help AI Reasoning: {response.needs_help_reasoning}")
        print("\n")

        # If the client needs help, redirect to the closing remarks node.
        if response.needs_help:
            return Command(goto="closing_chat")

        return Command(goto="ask_question")

    async def save_and_send_AI_message(self, content: str):
        message = await self.db_manager.store_message(
            from_role=IntakeMessageRole.CASEWORKER,
            content=content,
            client_pseudo_id=self.session.client_pseudo_id,
        )

        if not message:
            raise ValueError(
                f"Could not save message for {self.session.client_pseudo_id}"
            )
        await self.send_message(
            self.session.client_pseudo_id,
            AIMessageEvent(content=IntakeMessageResponse(**message.model_dump())),
        )

    async def _closing_remarks(self, state: ConversationState) -> ConversationState:
        logger.info("🔴 ENTERING NODE: _closing_remarks")
        try:
            closing_message = ""
            if state["error"]:
                closing_message = (
                    "I apologize, but we've encountered a technical issue. "
                    "Your responses have been saved, and our team will reach out to complete the assessment. "
                    "We apologize for the inconvenience."
                )
                await self.db_manager.update_intake_status(
                    self.session.client_pseudo_id, IntakeStatus.ERROR
                )
                await self.save_and_send_AI_message(closing_message)
            else:
                closing_prompt = generate_closing_remarks_prompt()

                response = await self.call_model(state["messages"] + [closing_prompt])

                closing_message = (
                    response
                    if isinstance(response, str)
                    else getattr(response, "content", str(response))
                )

                # Save message in the Completion section
                await self.save_and_send_AI_message(closing_message)

            # Update state to reflect the special completion section
            state["current_section"] = COMPLETION_SECTION
            return state
        except Exception as e:
            try:
                await self.db_manager.update_intake_status(
                    self.session.client_pseudo_id, IntakeStatus.ERROR
                )
            except Exception as e2:
                error_info = {
                    "message": str(e2),
                    "timestamp": datetime.now().isoformat(),
                    "location": "_closing_remarks (status update)",
                }
                self.log_error(error_info, e2)

            error_info: ErrorInfo = {
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
                "location": "_closing_remarks",
            }
            self.log_error(error_info, e)
            raise e

    async def compute_initial_state(self, intake: Intake):
        """
        Compute the initial state for the conversation based on the intake record.

        Args:
            intake: The Intake database record

        Returns:
            The initial ConversationState
        """
        # Get all messages from the database
        messages: list[IntakeMessage] = await self.db_manager.all_messages_by_time(
            self.session.client_pseudo_id
        )
        system_message = get_system_message_prompt()

        # Format messages as LangChain message objects
        formatted_messages = [
            AIMessage(message.content)
            if message.from_role == IntakeMessageRole.CASEWORKER
            else HumanMessage(message.content)
            for message in messages
        ]

        # Create the initial state
        state: ConversationState = {
            "error": None,
            "messages": [system_message] + formatted_messages,
            "current_section": intake.current_section,
        }
        return state

    async def run_assessment(self) -> Dict:
        """
        Run the assessment conversation flow, either as a new conversation or resuming an existing one.

        Returns:
            Dict: Final state after running the assessment
        """
        try:
            if self.graph is None:
                raise RuntimeError("Failed to initialize conversation graph")

            # Set up the proper config with the required thread_id for the checkpointer
            invoke_config = {
                "recursion_limit": 300,
                "configurable": {
                    "thread_id": f"intake_{self.session.client_pseudo_id}",
                    "checkpoint_ns": "intake_conversation",
                    "checkpoint_id": f"client_{self.session.client_pseudo_id}",
                },
            }

            # Run the graph with the initial state
            logger.info(
                f"Starting assessment for client {self.session.client_pseudo_id}"
            )
            return await self.graph.ainvoke(self.initial_state, config=invoke_config)

        except Exception as e:
            traceback.print_exc()
            error_info: ErrorInfo = {
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
                "location": "run_assessment",
            }
            self.log_error(error_info, e)
            # TODO: HANDLE ERROR STATE HERE
            # await self.db_manager.update_intake_status(
            #     self.session.client_pseudo_id, IntakeStatus.ERROR
            # )
            raise
