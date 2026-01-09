from unittest.mock import AsyncMock, MagicMock, Mock

import pytest

from app.models.intake import IntakeStatus
from app.models.intake_sections import ClientIntakeSection
from app.tests.test_fixtures.intake_sections import (
    create_test_sections,
)
from app.utils.intake import db_manager
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.schemas import ClientContext


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
