from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, Mock
from uuid import uuid4

import pytest
from langchain_core.messages import AIMessage as LCAIMessage
from langchain_core.messages import HumanMessage as LCHumanMessage
from langchain_core.messages import SystemMessage
from langgraph.graph import END
from langgraph.types import Command

from app.core.data_config.assessment_configs.assessment_config import (
    IntakeBotPromptsConfig,
    IntakeConfigConversation,
    IntakeSectionConfig,
    ModelConfig,
)
from app.models.intake import COMPLETION_SECTION, IntakeMessageRole, IntakeStatus
from app.models.intake_sections import ClientIntakeSection
from app.tests.test_fixtures.intake_sections import (
    create_test_sections,
)
from app.utils.intake import db_manager
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.prompts import IsSectionComplete
from app.utils.intake.schemas import ClientContext, ConversationState


@pytest.fixture
def client_context():
    return ClientContext(client_pseudo_id="test-client-id", client_name="Test Client")


@pytest.fixture
def mock_db_manager():
    return MagicMock(spec=db_manager.DatabaseManager)


@pytest.fixture
def mock_wait_for_user_response():
    return AsyncMock(return_value="User response")


@pytest.fixture
def mock_send_message():
    return AsyncMock()


@pytest.fixture
async def intake(async_session, mock_intake):
    """Create an intake with assessment_config_id."""
    from app.models.base import IntakeType

    # Use a real client from mock service
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS

    mock_intake.current_section = "Education / Employment"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)
    return mock_intake


@pytest.fixture
def sections():
    sections = create_test_sections(2)
    sections[0].title = "Education / Employment"
    sections[0].description = "Education and employment information"
    sections[0].required_information = "Education level, employment status"
    sections[1].title = "Housing"
    sections[1].description = "Housing situation"
    sections[1].required_information = "Current housing status"
    return sections


def make_client_sections(intake, sections):
    client_sections = []
    for i, section in enumerate(sections):
        client_sections.append(
            ClientIntakeSection(
                intake_id=intake.id,
                section_id=section.id,
                intake_section=section,
                status=IntakeStatus("in_progress") if i == 0 else "not_started",
                isActive=True,
                order=i,
            )
        )
    return client_sections


@pytest.fixture
def mock_model():
    """Create a mock model for testing."""
    return Mock()


@pytest.fixture
def graph(
    client_context,
    mock_db_manager,
    mock_wait_for_user_response,
    mock_send_message,
    mock_model,
):
    return IntakeConversationGraph(
        session=client_context,
        db_manager=mock_db_manager,
        wait_for_user_response=mock_wait_for_user_response,
        send_message=mock_send_message,
        model=mock_model,
    )


class TestIntakeConversationGraph:
    @pytest.mark.asyncio
    async def test_initialization(self, graph):
        """Test that the graph can be created."""
        assert graph.session.client_pseudo_id == "test-client-id"
        assert graph.session.client_name == "Test Client"
        assert graph.workflow is None
        assert graph.graph is None

    @pytest.mark.asyncio
    async def test_initialize_with_intake(self, graph, intake, seed_configs):
        """Test initializing the graph with an intake record."""
        # Mock the database call
        graph.db_manager.get_messages = AsyncMock(return_value=[])
        graph.db_manager.get_conversation_config = AsyncMock(
            return_value=seed_configs["assessment_files_by_state"]["US_UT"].intake
        )

        # Sections are now loaded from assessment config inside initialize()
        await graph.initialize(intake)
        assert graph.workflow is not None
        assert graph.graph is not None
        assert graph.section_data is not None
        # Check that sections were loaded from config
        assert len(graph.section_data) > 0
        assert graph.initial_state is not None

    @pytest.mark.asyncio
    async def test_run_assessment_not_initialized(self, graph):
        """Test that run_assessment fails if not initialized."""
        with pytest.raises(
            RuntimeError, match="Failed to initialize conversation graph"
        ):
            await graph.run_assessment()

    # --- Entry point routing ---

    @pytest.mark.asyncio
    async def test_get_entry_point_new_conversation_no_messages(self, graph):
        """Empty message list → start with introduction."""
        state: ConversationState = {
            "messages": [],
            "current_section": "Housing",
            "error": None,
        }
        result = await graph._get_entry_point(state)
        assert result == "intake_chat_introduction"

    @pytest.mark.asyncio
    async def test_get_entry_point_only_system_message(self, graph):
        """Single system message (new session) → start with introduction."""
        state: ConversationState = {
            "messages": [SystemMessage("You are a helpful assistant")],
            "current_section": "Housing",
            "error": None,
        }
        result = await graph._get_entry_point(state)
        assert result == "intake_chat_introduction"

    @pytest.mark.asyncio
    async def test_get_entry_point_last_ai_message_resumes(self, graph):
        """Last message from AI → resume so user can respond."""
        state: ConversationState = {
            "messages": [
                SystemMessage("System prompt"),
                LCAIMessage("What is your education level?"),
            ],
            "current_section": "Education / Employment",
            "error": None,
        }
        result = await graph._get_entry_point(state)
        assert result == "intake_resume_conversation"

    @pytest.mark.asyncio
    async def test_get_entry_point_last_human_message_evaluates(self, graph):
        """Last message from user → evaluate section."""
        state: ConversationState = {
            "messages": [
                SystemMessage("System prompt"),
                LCAIMessage("What is your education level?"),
                LCHumanMessage("I completed high school."),
            ],
            "current_section": "Education / Employment",
            "error": None,
        }
        result = await graph._get_entry_point(state)
        assert result == "intake_evaluate_section"

    # --- compute_initial_state ---

    @pytest.mark.asyncio
    async def test_compute_initial_state_no_prior_messages(self, graph):
        """With no prior messages, state has only system message."""
        graph.intake_id = uuid4()
        graph.assessment_config = _make_assessment_config()
        graph.db_manager.all_messages_by_time = AsyncMock(return_value=[])

        intake_mock = MagicMock()
        intake_mock.current_section = "Education / Employment"

        state = await graph.compute_initial_state(intake_mock)

        assert state["current_section"] == "Education / Employment"
        assert state["error"] is None
        assert len(state["messages"]) == 1
        assert isinstance(state["messages"][0], SystemMessage)

    @pytest.mark.asyncio
    async def test_compute_initial_state_with_prior_messages(self, graph):
        """Prior messages are converted to LangChain messages and prepended after system msg."""
        graph.intake_id = uuid4()
        graph.assessment_config = _make_assessment_config()

        ai_msg = MagicMock()
        ai_msg.from_role = IntakeMessageRole.CASEWORKER
        ai_msg.content = "Hello!"

        user_msg = MagicMock()
        user_msg.from_role = IntakeMessageRole.CLIENT
        user_msg.content = "Hi there."

        graph.db_manager.all_messages_by_time = AsyncMock(
            return_value=[ai_msg, user_msg]
        )

        intake_mock = MagicMock()
        intake_mock.current_section = "Housing"

        state = await graph.compute_initial_state(intake_mock)

        assert state["current_section"] == "Housing"
        # system message + 2 converted messages
        assert len(state["messages"]) == 3
        assert isinstance(state["messages"][1], LCAIMessage)
        assert isinstance(state["messages"][2], LCHumanMessage)
        assert state["messages"][1].content == "Hello!"
        assert state["messages"][2].content == "Hi there."

    # --- call_model ---

    @pytest.mark.asyncio
    async def test_call_model_without_output_type(self, graph):
        """Without output_type, calls model.ainvoke directly."""
        graph.model = MagicMock()
        graph.model.ainvoke = AsyncMock(return_value=LCAIMessage("AI reply"))

        messages = [SystemMessage("System"), LCHumanMessage("Hello")]
        result = await graph.call_model(messages)

        graph.model.ainvoke.assert_called_once_with(messages, graph.config)
        assert result.content == "AI reply"

    @pytest.mark.asyncio
    async def test_call_model_with_output_type(self, graph):
        """With output_type, calls model.with_structured_output(...).ainvoke."""
        structured_mock = MagicMock()
        structured_mock.ainvoke = AsyncMock(
            return_value=IsSectionComplete(
                section_complete=True,
                section_complete_reasoning="Done",
                section_next_question=None,
            )
        )
        graph.model = MagicMock()
        graph.model.with_structured_output = MagicMock(return_value=structured_mock)

        messages = [SystemMessage("System")]
        result = await graph.call_model(messages, IsSectionComplete)

        graph.model.with_structured_output.assert_called_once_with(IsSectionComplete)
        structured_mock.ainvoke.assert_called_once_with(messages, graph.config)
        assert result.section_complete is True


class TestGraphConstructor:
    def test_initialization_without_model_raises(
        self,
        client_context,
        mock_db_manager,
        mock_wait_for_user_response,
        mock_send_message,
    ):
        """Constructor requires a model; None raises ValueError."""
        with pytest.raises(ValueError, match="model is required"):
            IntakeConversationGraph(
                session=client_context,
                db_manager=mock_db_manager,
                wait_for_user_response=mock_wait_for_user_response,
                send_message=mock_send_message,
                model=None,
            )

    def test_config_thread_id_derived_from_client_id(self, graph):
        """Thread ID contains the first 8 chars of client_pseudo_id."""
        thread_id = graph.config["configurable"]["thread_id"]
        assert thread_id == "intake-conv-test-cli"

    def test_workflow_and_graph_are_none_before_initialize(self, graph):
        """workflow and graph should be None until initialize() is called."""
        assert graph.workflow is None
        assert graph.graph is None

    def test_build_graph_raises_without_workflow(self, graph):
        """_build_graph raises RuntimeError when workflow is not set."""
        graph.workflow = None
        with pytest.raises(RuntimeError, match="Intake State Graph is not initialized"):
            graph._build_graph()


class TestInitializeGraph:
    @pytest.mark.asyncio
    async def test_initialize_loads_sections_from_assessment_config(
        self, graph, intake, seed_configs
    ):
        """Sections from assessment config are loaded when no client_intake_sections exist."""
        graph.db_manager.get_conversation_config = AsyncMock(
            return_value=seed_configs["assessment_files_by_state"]["US_UT"].intake
        )
        graph.db_manager.all_messages_by_time = AsyncMock(return_value=[])

        await graph.initialize(intake)

        assert graph.section_data is not None
        assert len(graph.section_data) > 0
        # Verify each section has the expected keys
        for title, data in graph.section_data.items():
            assert "title" in data
            assert "description" in data
            assert "required_information" in data

    @pytest.mark.asyncio
    async def test_initialize_builds_workflow_and_graph(
        self, graph, intake, seed_configs
    ):
        """After initialize(), workflow and graph are non-None."""
        graph.db_manager.get_conversation_config = AsyncMock(
            return_value=seed_configs["assessment_files_by_state"]["US_UT"].intake
        )
        graph.db_manager.all_messages_by_time = AsyncMock(return_value=[])

        await graph.initialize(intake)

        assert graph.workflow is not None
        assert graph.graph is not None

    @pytest.mark.asyncio
    async def test_initialize_raises_on_missing_config(self, graph, intake):
        """initialize() propagates exception when get_conversation_config fails."""
        graph.db_manager.get_conversation_config = AsyncMock(
            side_effect=ValueError("Config not found")
        )

        with pytest.raises(ValueError, match="Config not found"):
            await graph.initialize(intake)


class TestEvaluateSection:
    @pytest.mark.asyncio
    async def test_section_complete_redirects_to_complete_section(
        self, initialized_graph
    ):
        """When IsSectionComplete.section_complete is True → goto intake_section_complete."""
        initialized_graph.call_model = AsyncMock(
            return_value=IsSectionComplete(
                section_complete=True,
                section_complete_reasoning="All info collected",
                section_next_question=None,
            )
        )

        state = _make_state()
        result = await initialized_graph._evaluate_section(state)

        assert isinstance(result, Command)
        assert result.goto == "intake_section_complete"

    @pytest.mark.asyncio
    async def test_section_no_next_question_also_redirects(self, initialized_graph):
        """No next question (even if not explicitly complete) → goto intake_section_complete."""
        initialized_graph.call_model = AsyncMock(
            return_value=IsSectionComplete(
                section_complete=False,
                section_complete_reasoning="Ambiguous",
                section_next_question=None,
            )
        )

        state = _make_state()
        result = await initialized_graph._evaluate_section(state)

        assert isinstance(result, Command)
        assert result.goto == "intake_section_complete"

    @pytest.mark.asyncio
    async def test_section_incomplete_asks_question_and_loops(
        self, initialized_graph, mock_wait_for_user_response
    ):
        """When section is incomplete, store message, wait for user, then loop back."""
        question = "What level of education did you complete?"
        initialized_graph.call_model = AsyncMock(
            return_value=IsSectionComplete(
                section_complete=False,
                section_complete_reasoning="Need education level",
                section_next_question=question,
            )
        )

        mock_message = _make_mock_message(content=question)
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=mock_message
        )
        mock_wait_for_user_response.return_value = "I finished high school."

        state = _make_state()
        result = await initialized_graph._evaluate_section(state)

        initialized_graph.db_manager.store_message.assert_called_once()
        mock_wait_for_user_response.assert_called_once()
        assert isinstance(result, Command)
        assert result.goto == "intake_evaluate_section"

    @pytest.mark.asyncio
    async def test_user_timeout_ends_conversation(
        self, initialized_graph, mock_wait_for_user_response
    ):
        """None response from wait_for_user_response (timeout) → END."""
        initialized_graph.call_model = AsyncMock(
            return_value=IsSectionComplete(
                section_complete=False,
                section_complete_reasoning="Need more info",
                section_next_question="What is your job status?",
            )
        )

        mock_message = _make_mock_message(content="What is your job status?")
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=mock_message
        )
        mock_wait_for_user_response.return_value = None

        state = _make_state()
        result = await initialized_graph._evaluate_section(state)

        assert isinstance(result, Command)
        assert result.goto == END

    @pytest.mark.asyncio
    async def test_missing_section_in_section_data_raises(self, initialized_graph):
        """Section not found in section_data raises ValueError."""
        state = _make_state(current_section="Nonexistent Section")

        with pytest.raises(ValueError, match="Section not found"):
            await initialized_graph._evaluate_section(state)

    @pytest.mark.asyncio
    async def test_empty_current_section_raises(self, initialized_graph):
        """Empty current_section raises ValueError."""
        state = _make_state(current_section=None)

        with pytest.raises(ValueError, match="Empty current section"):
            await initialized_graph._evaluate_section(state)


class TestOpeningRemarks:
    @pytest.mark.asyncio
    async def test_opening_remarks_stores_and_sends_message(self, initialized_graph):
        """_opening_remarks calls model, stores the reply, and sends it to client."""
        initialized_graph.db_manager.get_section_titles = AsyncMock(
            return_value=["Education / Employment", "Housing"]
        )
        ai_reply = LCAIMessage("Welcome to your intake!")
        initialized_graph.call_model = AsyncMock(return_value=ai_reply)

        mock_message = _make_mock_message(content="Welcome to your intake!")
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=mock_message
        )

        state = _make_state()
        result = await initialized_graph._opening_remarks(state)

        initialized_graph.db_manager.get_section_titles.assert_called_once()
        initialized_graph.db_manager.store_message.assert_called_once()
        initialized_graph.send_message.assert_called_once()

        # AI message should be added to state
        assert any(
            isinstance(m, LCAIMessage) and m.content == "Welcome to your intake!"
            for m in result["messages"]
        )

    @pytest.mark.asyncio
    async def test_opening_remarks_raises_when_store_fails(self, initialized_graph):
        """_opening_remarks raises when store_message returns None."""
        initialized_graph.db_manager.get_section_titles = AsyncMock(
            return_value=["Education / Employment"]
        )
        initialized_graph.call_model = AsyncMock(return_value=LCAIMessage("Hello!"))
        initialized_graph.db_manager.store_message = AsyncMock(return_value=None)

        state = _make_state()
        with pytest.raises(ValueError, match="error saving message"):
            await initialized_graph._opening_remarks(state)


class TestCompleteSection:
    @pytest.mark.asyncio
    async def test_complete_section_transitions_to_next_section(
        self, initialized_graph
    ):
        """_complete_section advances current_section in state."""
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=_make_mock_message(content="Thank you!")
        )
        initialized_graph.db_manager.complete_section = AsyncMock(
            return_value="Housing"
        )

        state = _make_state(current_section="Education / Employment")
        result = await initialized_graph._complete_section(state)

        assert result["current_section"] == "Housing"

    @pytest.mark.asyncio
    async def test_complete_section_sends_section_change_event(self, initialized_graph):
        """_complete_section notifies the client via send_message."""
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=_make_mock_message(content="Thank you!")
        )
        initialized_graph.db_manager.complete_section = AsyncMock(
            return_value="Housing"
        )

        state = _make_state(current_section="Education / Employment")
        await initialized_graph._complete_section(state)

        initialized_graph.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_section_raises_on_db_error(self, initialized_graph):
        """complete_section returning 'error' triggers ValueError."""
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=_make_mock_message(content="Thank you!")
        )
        initialized_graph.db_manager.complete_section = AsyncMock(return_value="error")

        state = _make_state()
        with pytest.raises(ValueError, match="Could not complete section"):
            await initialized_graph._complete_section(state)

    @pytest.mark.asyncio
    async def test_complete_section_raises_when_transition_message_fails(
        self, initialized_graph
    ):
        """store_message returning None for the transition message raises ValueError."""
        initialized_graph.db_manager.store_message = AsyncMock(return_value=None)

        state = _make_state()
        with pytest.raises(ValueError, match="Could not save transition message"):
            await initialized_graph._complete_section(state)


class TestClosingRemarks:
    @pytest.mark.asyncio
    async def test_normal_closing_generates_and_sends_message(self, initialized_graph):
        """Successful closing remarks stores message and sets current_section to COMPLETION."""
        closing_text = "Thank you for your time!"
        initialized_graph.call_model = AsyncMock(return_value=LCAIMessage(closing_text))
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=_make_mock_message(content=closing_text)
        )

        state = _make_state(error=None)
        result = await initialized_graph._closing_remarks(state)

        assert result["current_section"] == COMPLETION_SECTION
        initialized_graph.db_manager.store_message.assert_called_once()
        initialized_graph.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_error_state_sends_apology_and_updates_status(
        self, initialized_graph
    ):
        """Error state sends apology message and marks intake as ERROR."""
        initialized_graph.db_manager.update_intake_status = AsyncMock(return_value=None)
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=_make_mock_message(content="We apologize")
        )

        error_info = {
            "message": "Something went wrong",
            "timestamp": datetime.now().isoformat(),
            "location": "test",
        }
        state = _make_state(error=error_info)
        result = await initialized_graph._closing_remarks(state)

        initialized_graph.db_manager.update_intake_status.assert_called_once_with(
            initialized_graph.intake_id, IntakeStatus.ERROR
        )
        assert result["current_section"] == COMPLETION_SECTION

    @pytest.mark.asyncio
    async def test_closing_remarks_string_model_response(self, initialized_graph):
        """Model returning a raw string (not AIMessage) is handled correctly."""
        initialized_graph.call_model = AsyncMock(return_value="Raw string reply")
        initialized_graph.db_manager.store_message = AsyncMock(
            return_value=_make_mock_message(content="Raw string reply")
        )

        state = _make_state(error=None)
        result = await initialized_graph._closing_remarks(state)

        assert result["current_section"] == COMPLETION_SECTION


class TestRunAssessment:
    @pytest.mark.asyncio
    async def test_run_assessment_invokes_graph_with_initial_state(
        self, initialized_graph
    ):
        """run_assessment calls graph.ainvoke with the initial state."""
        final_state = {
            "messages": [],
            "current_section": COMPLETION_SECTION,
            "error": None,
        }
        mock_compiled_graph = MagicMock()
        mock_compiled_graph.ainvoke = AsyncMock(return_value=final_state)

        initialized_graph.graph = mock_compiled_graph
        initialized_graph.initial_state = _make_state()

        result = await initialized_graph.run_assessment()

        mock_compiled_graph.ainvoke.assert_called_once()
        call_args = mock_compiled_graph.ainvoke.call_args
        assert call_args[0][0] == initialized_graph.initial_state
        assert result == final_state

    @pytest.mark.asyncio
    async def test_run_assessment_propagates_graph_exception(self, initialized_graph):
        """Exceptions from graph.ainvoke are re-raised."""
        mock_compiled_graph = MagicMock()
        mock_compiled_graph.ainvoke = AsyncMock(side_effect=RuntimeError("Graph error"))

        initialized_graph.graph = mock_compiled_graph
        initialized_graph.initial_state = _make_state()

        with pytest.raises(RuntimeError, match="Graph error"):
            await initialized_graph.run_assessment()


# ---------------------------------------------------------------------------
# Module-level helpers
# ---------------------------------------------------------------------------


def _make_assessment_config() -> IntakeConfigConversation:
    """Build a minimal IntakeConfigConversation for testing."""
    return IntakeConfigConversation(
        intake_type="conversation",
        transcription_post_processing_model=ModelConfig(
            provider="openai", name="gpt-4o-mini", version=None
        ),
        chat_model=ModelConfig(provider="openai", name="gpt-4o", version=None),
        prompts=IntakeBotPromptsConfig(
            role="You are a helpful social worker",
            tone="Be warm and professional",
            system_message="You help clients complete intake assessments",
            opening_remarks="Welcome to your intake assessment",
        ),
        sections=[
            IntakeSectionConfig(
                title="Education / Employment",
                description="Education and employment information",
                required_information="Education level, employment status",
            ),
            IntakeSectionConfig(
                title="Housing",
                description="Housing situation",
                required_information="Current housing status",
            ),
        ],
    )


def _make_mock_message(
    content: str = "Test message",
    role: IntakeMessageRole = IntakeMessageRole.CASEWORKER,
    section: str = "Education / Employment",
) -> MagicMock:
    """Create a mock IntakeMessage with model_dump() support."""
    msg = MagicMock()
    msg.id = uuid4()
    msg.content = content
    msg.from_role = role
    msg.section = section
    msg.created_at = datetime(2024, 1, 1)
    msg.updated_at = datetime(2024, 1, 1)
    msg.model_dump.return_value = {
        "id": str(msg.id),
        "content": content,
        "from_role": role,
        "section": section,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
    }
    return msg


def _make_state(
    messages: list | None = None,
    current_section: str | None = "Education / Employment",
    error=None,
) -> ConversationState:
    """Build a minimal ConversationState for testing."""
    return ConversationState(
        messages=messages if messages is not None else [SystemMessage("System prompt")],
        current_section=current_section,
        error=error,
    )


@pytest.fixture
def initialized_graph(
    graph,
    mock_wait_for_user_response,
    mock_send_message,
):
    """Graph with assessment_config, section_data, and intake_id pre-populated."""
    graph.intake_id = uuid4()
    graph.assessment_config = _make_assessment_config()
    graph.section_data = {
        "Education / Employment": {
            "title": "Education / Employment",
            "description": "Education and employment information",
            "required_information": "Education level, employment status",
            "source": "assessment_config",
        },
        "Housing": {
            "title": "Housing",
            "description": "Housing situation",
            "required_information": "Current housing status",
            "source": "assessment_config",
        },
    }
    # Expose the fixtures on the graph so test methods can reference them
    graph.wait_for_user_response = mock_wait_for_user_response
    graph.send_message = mock_send_message
    return graph
