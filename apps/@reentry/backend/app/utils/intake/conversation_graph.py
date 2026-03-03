import traceback
from datetime import datetime
from typing import Any, Callable, Coroutine, Dict, Optional

import structlog
from langchain_core.messages import AIMessage, AnyMessage
from langchain_core.messages.human import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.types import Command

from app.core.config import tracer
from app.core.data_config.assessment_configs.assessment_config import (
    IntakeConfigConversation,
)
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
    IsSectionComplete,
    generate_closing_remarks_prompt,
    generate_opening_remarks_prompt,
    generate_question_prompt,
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
from app.utils.langsmith_utils import create_langsmith_metadata, create_langsmith_tags

logger = structlog.get_logger(__name__)


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
        model,
    ) -> None:
        if not model:
            raise ValueError(
                "model is required - cannot use IntakeConversationGraph without explicit model configuration"
            )

        self.memory = MemorySaver()
        self.model = model
        self.session = session
        self.db_manager = db_manager
        self.send_message = send_message
        self.log_error = log_error
        self.wait_for_user_response = wait_for_user_response

        # Create semantic thread_id for LangSmith legibility
        client_id_short = (
            session.client_pseudo_id[:8] if session.client_pseudo_id else "unknown"
        )
        semantic_thread_id = f"intake-conv-{client_id_short}"

        self.run_name = "Intake-Conversation"

        # Build config with LangSmith metadata and tags
        self.config = {
            "configurable": {"thread_id": semantic_thread_id},
            "callbacks": [self.custom_metrics_callback],
            "run_name": self.run_name,
            "metadata": create_langsmith_metadata(
                client_pseudo_id=session.client_pseudo_id,
                workflow_type="intake_conversation",
            ),
            "tags": create_langsmith_tags(
                workflow_type="intake_conversation",
            ),
        }
        if tracer:
            self.config["callbacks"].append(tracer)

        # These will be initialized in initialize()
        self.workflow = None
        self.graph = None
        self.assessment_config: IntakeConfigConversation
        self.intake_id = None

    async def initialize(self, intake: Intake) -> None:
        """Initialize the conversation graph."""
        try:
            if client_pseudo_id := self.session.client_pseudo_id:
                structlog.contextvars.bind_contextvars(
                    client_pseudo_id=client_pseudo_id
                )

            # Store intake_id to pass to db_manager methods
            self.intake_id = intake.id

            self.assessment_config = await self.db_manager.get_conversation_config(
                intake.assessment_config_id
            )
            print(self.assessment_config, intake.assessment_config_id)

            self.section_data = {}
            if intake.client_intake_sections:
                # Fall back to client sections if they exist (backwards compatibility)
                logger.info(
                    "Using sections from client_intake_sections (backwards compatibility)"
                )
                for client_section in intake.client_intake_sections:
                    section_data = client_section.get_effective_section_data()
                    self.section_data[section_data["title"]] = section_data
            elif self.assessment_config.sections:
                # Use sections from assessment config
                logger.info("Using sections from assessment config")
                for section in self.assessment_config.sections:
                    self.section_data[section.title] = {
                        "title": section.title,
                        "description": section.description,
                        "required_information": section.required_information,
                        "source": "assessment_config",
                    }

            self.initial_state: ConversationState = await self.compute_initial_state(
                intake
            )
            self.workflow = StateGraph(
                state_schema=ConversationState,
                config_schema=ConfigSchema,
            )
            logger.info("Building conversation graph")
            self._build_graph()
            self.graph = self.workflow.compile(checkpointer=self.memory)
        except Exception as e:
            logger.error(
                f"Failed to load conversation config {intake.assessment_config_id}: {e}"
            )
            raise

    def _build_graph(self) -> None:
        if not self.workflow:
            raise RuntimeError("Intake State Graph is not initialized")
        """Constructs the conversation workflow with evaluation nodes."""

        self.workflow.add_node("intake_chat_introduction", self._opening_remarks)
        self.workflow.add_node("intake_evaluate_section", self._evaluate_section)
        self.workflow.add_node("intake_section_complete", self._complete_section)
        self.workflow.add_node("intake_closing_chat", self._closing_remarks)
        self.workflow.add_node(
            "intake_resume_conversation", self._resume_conversation_user
        )

        # Set conditional entry point based on conversation state
        self.workflow.set_conditional_entry_point(self._get_entry_point)

        self.workflow.add_edge("intake_resume_conversation", "intake_evaluate_section")
        self.workflow.add_edge("intake_chat_introduction", "intake_evaluate_section")
        self.workflow.add_conditional_edges(
            "intake_section_complete",
            lambda state: "intake_closing_chat"
            if state["current_section"] == COMPLETION_SECTION
            or state["current_section"] is None
            else "intake_evaluate_section",
        )
        self.workflow.add_edge("intake_closing_chat", END)

    async def call_model(
        self,
        messages: list[AnyMessage],
        output_type: Optional[Any] = None,
    ):
        logger.info(
            f"🔄 CALLING MODEL: {len(messages)} messages, output_type={output_type.__name__ if output_type else 'None'}"
        )

        start_time = datetime.now()

        try:
            if output_type is not None:
                response = await self.model.with_structured_output(output_type).ainvoke(
                    messages, self.config
                )
            else:
                response = await self.model.ainvoke(messages, self.config)

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"✅ MODEL RESPONSE RECEIVED in {duration:.2f}s")

            return response

        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.error(f"❌ MODEL CALL FAILED after {duration:.2f}s: {e}")
            raise

    async def _get_entry_point(self, state: ConversationState) -> str:
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
            print("Starting with intake_chat_introduction - new conversation")
            return "intake_chat_introduction"

        # Check the last message to determine what to do next
        last_message = state["messages"][-1]

        # If the last message is from the AI, it's the user's turn to answer
        # In this case, we should resume to let them see the last AI message again
        if isinstance(last_message, AIMessage):
            print("Last message was from AI - resuming conversation for user to answer")
            return "intake_resume_conversation"
        else:
            print("Last message was from user - evaluating section")
            return "intake_evaluate_section"

    async def _opening_remarks(self, state: ConversationState) -> ConversationState:
        logger.info("🔵 ENTERING NODE: _opening_remarks")
        if not self.db_manager:
            raise RuntimeError("database manager !")
        client_data = self.session
        sections_titles = await self.db_manager.get_section_titles(self.intake_id)
        opening_prompt = generate_opening_remarks_prompt(
            client_data, sections_titles, self.assessment_config
        )

        state["messages"].append(opening_prompt)
        try:
            client_pseudo_id = self.session.client_pseudo_id

            response = await self.call_model(state["messages"])
            ai_message_str = response if isinstance(response, str) else response.content
            state["messages"].append(AIMessage(ai_message_str))
            message = await self.db_manager.store_message(
                intake_id=self.intake_id,
                from_role=IntakeMessageRole.CASEWORKER,
                content=ai_message_str,
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

    async def _evaluate_section(self, state: ConversationState) -> Command:
        logger.info("🟢 ENTERING NODE: _evaluate_section")
        """
        Evaluate if the current section is complete and ask next question if not.
        This is the V3 version that skips the "check if client needs help" step.
        """
        current_section_title = state["current_section"]

        try:
            client_pseudo_id = self.session.client_pseudo_id

            # Validate current section
            if not current_section_title:
                raise ValueError("Empty current section")

            if current_section_title not in self.section_data:
                raise ValueError(f"Section not found: {current_section_title}")

            section_data = self.section_data[current_section_title]
            print(
                f"🤖 CONVERSATION (V3): Using {section_data['source']} data for section: {section_data['title']}"
            )

            # Prepare section evaluation prompt
            required_info = section_data.get(
                "required_information", "No specific requirements"
            )
            section_prompt = generate_question_prompt(
                section_data["title"],
                required_info,
                self.assessment_config,
            )

            # Evaluate section completion
            logger.info("🔄 EVALUATING SECTION: IsSectionComplete")
            section_response = await self.call_model(
                state["messages"] + [section_prompt], IsSectionComplete
            )

            logger.info(
                f"✅ IsSectionComplete RESPONSE: {section_response.section_complete}"
            )
            logger.info(f"   Reasoning: {section_response.section_complete_reasoning}")

            # If section is complete, go to complete section
            if (
                section_response.section_complete
                or not section_response.section_next_question
            ):
                logger.info("Section complete - redirecting to section completion")
                return Command(goto="intake_section_complete")

            # Continue with next question
            logger.info("Continuing conversation with next question")
            state["messages"].append(AIMessage(section_response.section_next_question))

            message = await self.db_manager.store_message(
                intake_id=self.intake_id,
                from_role=IntakeMessageRole.CASEWORKER,
                content=section_response.section_next_question,
            )

            if not message:
                raise ValueError(
                    f"error saving message in evaluate section for client {client_pseudo_id}"
                )

            client_response = await self.wait_for_user_response(
                self.session.client_pseudo_id,
                message,
            )

            if not client_response:
                # Handled externally by deleting the graph and re-instantiating when we receive a message
                print("timeout human")
                return Command(goto=END)

            state["messages"].append(HumanMessage(client_response))

            # Loop back to this same node to check again with the new user response
            return Command(update=state, goto="intake_evaluate_section")

        except Exception as e:
            traceback.print_exc()
            print(f"ERROR in _evaluate_section: {e}")
            raise e

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
            # internal can't see messages from previous chats.
            # external users have conversation history.
            is_internal = await self.db_manager.is_internal_intake(self.intake_id)
            welcome_message_text = f"Hi {self.session.client_name}, thanks for joining again! Let's continue our conversation."

            # Check if the last message from the database is already a welcome back message
            # SO we avoid adding multiple welcome messages during unstable connections
            latest_message = await self.db_manager.get_latest_message(self.intake_id)
            is_last_message_welcome_back = (
                latest_message
                and latest_message.content
                and WELCOME_BACK_TEST_STRING in latest_message.content.lower()
                and latest_message.from_role == IntakeMessageRole.CASEWORKER
            )
            latest_non_welcome_message = (
                await self.db_manager.get_latest_non_welcome_ai_message(self.intake_id)
            )
            if not latest_non_welcome_message:
                logger.error("No previous question found to resume from")
                return Command(goto=END)

            if is_internal:
                logger.info(
                    "Resume conversation: internal user can't see past messages so send welcome then repeat the last question."
                )

                # Note that without conversation history, the user can see these 2 messages on resuming.
                # 1 - Hi Uxr Kelly User #1, thanks for joining again! Let's continue our conversation.
                # 2 - Thank you for letting me know. Do you have a Social Security card?
                # The second question is the last non-welcome question but its letting me know part is from the
                # previous chat session. A better UX would be to include the chat history in the future.

                stored_message = await self.db_manager.store_message(
                    intake_id=self.intake_id,
                    from_role=IntakeMessageRole.CASEWORKER,
                    content=welcome_message_text,
                )
                if not stored_message:
                    logger.error(
                        f"Could not save welcome back message for client {client_pseudo_id}"
                    )
                    return Command(goto=END)

                # store in conversation state
                state["messages"].append(AIMessage(welcome_message_text))
                message_event = AIMessageEvent(
                    content=IntakeMessageResponse(**stored_message.model_dump())
                )
                await self.send_message(client_pseudo_id, message_event)

                # To get a response we have to repeat the last non-welcome message.
                client_response = await self.wait_for_user_response(
                    client_pseudo_id, latest_non_welcome_message
                )

                if not client_response:
                    # wait_for_user_response has a timeout.
                    # on timeout, we end the conversation graph.
                    # on reconnecting, we start a new graph.
                    return Command(goto=END)

                # Add the client's response to the conversation state
                state["messages"].append(HumanMessage(client_response))
                return state

            else:
                logger.info(
                    "Resume conversation: external user has conversation history. Only welcome back if not already welcomed."
                )

                if not is_last_message_welcome_back:
                    stored_message = await self.db_manager.store_message(
                        intake_id=self.intake_id,
                        from_role=IntakeMessageRole.CASEWORKER,
                        content=welcome_message_text,
                    )
                    if not stored_message:
                        logger.error(
                            f"Could not save welcome back message for client {client_pseudo_id}"
                        )
                        return Command(goto=END)
                    # store in conversation state
                    state["messages"].append(AIMessage(welcome_message_text))
                    message_event = AIMessageEvent(
                        content=IntakeMessageResponse(**stored_message.model_dump())
                    )
                    await self.send_message(client_pseudo_id, message_event)

                logger.info(
                    "Resume Conversation: done with welcoming, repeating the last question."
                )
                client_response = await self.wait_for_user_response(
                    client_pseudo_id, latest_non_welcome_message
                )
                if not client_response:
                    # wait_for_user_response has a timeout.
                    # on timeout, we end the conversation graph.
                    # on reconnecting, we start a new graph.
                    return Command(goto=END)
                state["messages"].append(HumanMessage(client_response))
                return state

        except Exception as e:
            logger.error(f"Error in _resume_conversation_user: {e}")
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
            intake_id=self.intake_id,
            from_role=IntakeMessageRole.CASEWORKER,
            content=transition_message_text,
        )
        if not message:
            raise ValueError(
                f"Could not save transition message for client {self.session.client_pseudo_id}"
            )

        # Complete section in database
        new_section_title = await self.db_manager.complete_section(self.intake_id)
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

    async def save_and_send_AI_message(self, content: str):
        message = await self.db_manager.store_message(
            intake_id=self.intake_id,
            from_role=IntakeMessageRole.CASEWORKER,
            content=content,
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
                    self.intake_id, IntakeStatus.ERROR
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
                    self.intake_id, IntakeStatus.ERROR
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
            self.intake_id
        )
        system_message = get_system_message_prompt(self.assessment_config)

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
            if client_pseudo_id := self.session.client_pseudo_id:
                structlog.contextvars.bind_contextvars(
                    client_pseudo_id=client_pseudo_id
                )

            if self.graph is None:
                raise RuntimeError("Failed to initialize conversation graph")

            # Create semantic identifiers for LangSmith legibility
            client_id_short = (
                self.session.client_pseudo_id[:8]
                if self.session.client_pseudo_id
                else "unknown"
            )

            # Set up the proper config with the required thread_id for the checkpointer
            invoke_config = {
                "recursion_limit": 300,
                "run_name": self.run_name,
                "metadata": create_langsmith_metadata(
                    client_pseudo_id=self.session.client_pseudo_id,
                    workflow_type="intake_conversation",
                    current_section=self.initial_state.get("current_section"),
                ),
                "tags": create_langsmith_tags(
                    workflow_type="intake_conversation",
                ),
                "configurable": {
                    "thread_id": f"intake-assessment-{client_id_short}",
                    "checkpoint_ns": "intake_conversation",
                    "checkpoint_id": f"client-{client_id_short}",
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
