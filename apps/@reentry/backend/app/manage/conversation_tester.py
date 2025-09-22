"""
Command to test the conversation graph directly from the command line.
This allows experimenting with the conversation flow without running the full app or saving to database.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path

from langchain_core.messages import AIMessage

from app.core.data_config.intakesections.constants import INTAKE_SECTIONS_MAPPING
from app.models.intake import IntakeMessage, IntakeMessageRole, IntakeSection
from app.tests.test_intake_conversation_graph import make_client_sections
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.schemas import ClientContext, ServerEvent

from .base import cli

# Set up logging to see the flow
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")


class MockDatabaseManager:
    """Mock database manager that doesn't save anything to database."""

    def __init__(self, sections):
        self.current_section_index = 0
        self.sections = [section["title"] for section in sections]

    async def store_message(
        self, client_pseudo_id: str, content: str, from_role: str
    ) -> IntakeMessage:
        """Mock store message - returns a proper IntakeMessage instance."""
        print(
            f"💾 [Mock DB] ENTERING store_message from {from_role}: {content[:50]}{'...' if len(content) > 50 else ''}"
        )
        message = IntakeMessage(
            id=str(uuid.uuid4()),
            content=content,
            from_role=IntakeMessageRole(from_role),
            client_pseudo_id=client_pseudo_id,
            intake_id=str(uuid.uuid4()),
        )
        print(
            f"✅ [Mock DB] EXITING store_message, returning message with id: {message.id}"
        )
        return message

    async def get_latest_message(self, client_pseudo_id: str) -> IntakeMessage:
        """Mock get latest message."""
        return IntakeMessage(
            id=str(uuid.uuid4()),
            content="Mock message",
            from_role=IntakeMessageRole.CASEWORKER,
            client_pseudo_id=client_pseudo_id,
            intake_id=str(uuid.uuid4()),
        )

    async def complete_section(self) -> str:
        """Mock complete section - returns next section title or completion."""
        self.current_section_index += 1

        if self.current_section_index >= len(self.sections):
            print("🏁 [Mock DB] All sections completed, moving to Completion")
            return "Completion"

        next_section = self.sections[self.current_section_index]
        print(f"✅ [Mock DB] Section completed, moving to: {next_section}")
        return next_section

    async def update_intake_status(self, client_pseudo_id: str, status: str) -> None:
        """Mock update intake status."""
        print(f"📊 [Mock DB] Updated client {client_pseudo_id} status to {status}")

    async def all_messages_by_time(self) -> list:
        """Mock get all messages - returns empty list for new conversation."""
        return []


class MockIntake:
    """Mock intake object."""

    def __init__(self, sections):
        self.current_section = sections[0]["title"]


async def mock_wait_for_user_response(
    client_pseudo_id: str, message: IntakeMessage
) -> str:
    """Mock wait for user response - gets input from command line."""
    print(f"📞 MOCK_WAIT_FOR_USER_RESPONSE called for client: {client_pseudo_id}")
    print(f"\n🤖 AI: {message.content}")

    while True:
        response = input("\n👤 You: ").strip()

        # Allow user to quit
        if response.lower() in ["quit", "exit", "q"]:
            raise KeyboardInterrupt("User requested to quit")

        # Don't allow empty responses
        if response:
            print(f"✅ MOCK_WAIT_FOR_USER_RESPONSE returning: {response}")
            return response

        print("Please enter a response (or 'quit' to exit)")


async def mock_send_message(client_pseudo_id: str, event: ServerEvent) -> str:
    """Mock send message - prints events and handles AI messages."""
    print(f"🔔 MOCK_SEND_MESSAGE called with event type: {event.type}")

    if event.type == "AIMessage":
        # This is an AI message being sent to the user
        ai_content = (
            event.content.content
            if hasattr(event.content, "content")
            else str(event.content)
        )
        print(f"\n🤖 AI: {ai_content}")
    elif event.type == "sectionChange":
        # This is a section change notification
        print(f"\n📋 Section changed to: {event.content.section}")
        print("=" * 50)
    else:
        print(f"📤 Server Event: {event.type}")

    print(f"✅ MOCK_SEND_MESSAGE completed for event type: {event.type}")
    return "sent"


@cli.command()
async def test_conversation(type):
    """
    Test the conversation graph from command line.
    This allows experimenting with the conversation flow without database or full app.
    """
    print("🚀 Starting conversation graph test...")
    print("💡 Instructions:")
    print("   - Type your responses naturally")
    print("   - Type 'quit', 'exit', or 'q' to exit")
    print("   - Empty responses will be rejected")
    print("=" * 60)

    # Create mock objects
    mock_client = ClientContext(client_pseudo_id="test-client-123", client_name="Bob")

    # Create sections
    sections = [
        IntakeSection(title=section["title"], description=section["description"])
        for section in INTAKE_SECTIONS_MAPPING[type]
    ]

    mock_db_manager = MockDatabaseManager(sections)
    mock_intake = MockIntake(sections)

    client_sections = make_client_sections(mock_intake, sections)

    print(f"📚 Available sections ({len(sections)}):")
    for i, section in enumerate(sections, 1):
        print(f"   {i}. {section.title}")

    # Initialize conversation graph
    conversation_graph = IntakeConversationGraph(
        session=mock_client,
        db_manager=mock_db_manager,
        wait_for_user_response=mock_wait_for_user_response,
        send_message=mock_send_message,
    )

    # Initialize the graph
    await conversation_graph.initialize(mock_intake, client_sections)

    print("✅ Conversation graph initialized!")
    print(f"📋 Starting with section: {mock_intake.current_section}")
    print("=" * 60)

    try:
        # Run the assessment
        final_state = await conversation_graph.run_assessment()

        print("\n" + "=" * 50)
        print("🎉 Conversation completed!")
        print(f"📊 Final state: {final_state.get('current_section', 'Unknown')}")

        # Print conversation summary
        messages = final_state.get("messages", [])
        print(f"💬 Total messages exchanged: {len(messages)}")

        # Ask if user wants to save conversation
        save_response = (
            input("\n💾 Would you like to save this conversation to a file? (y/n): ")
            .strip()
            .lower()
        )
        if save_response in ["y", "yes"]:
            await save_conversation_to_file(final_state, mock_client.client_name)

    except KeyboardInterrupt:
        print("\n\n⏹️  Conversation interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during conversation: {e}")
        import traceback

        traceback.print_exc()


async def save_conversation_to_file(final_state: dict, client_name: str):
    """Save the conversation to a file in experiments/intake_conversations directory."""

    # Create experiments directory
    experiments_dir = (
        Path(__file__).parent.parent.parent / "experiments" / "intake_conversations"
    )
    experiments_dir.mkdir(parents=True, exist_ok=True)

    # Find next available number using client name
    safe_client_name = client_name.lower().replace(" ", "_")
    counter = 1
    while True:
        filename = f"test-conversation-{safe_client_name}-{counter}.json"
        file_path = experiments_dir / filename
        if not file_path.exists():
            break
        counter += 1

    # Prepare conversation data
    conversation_data = {
        "timestamp": datetime.now().isoformat(),
        "client_name": client_name,
        "final_section": final_state.get("current_section"),
        "total_messages": len(final_state.get("messages", [])),
        "messages": [],
    }

    # Extract messages (skip system message)
    for msg in final_state.get("messages", [])[1:]:  # Skip system message
        if hasattr(msg, "content"):
            message_type = "AI" if isinstance(msg, AIMessage) else "Human"
            conversation_data["messages"].append(
                {
                    "type": message_type,
                    "content": msg.content,
                }
            )

    # Save to file
    with open(file_path, "w") as f:
        json.dump(conversation_data, f, indent=2)

    print(f"✅ Conversation saved to: {file_path}")


if __name__ == "__main__":
    asyncio.run(test_conversation())
