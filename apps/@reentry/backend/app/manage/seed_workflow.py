"""
--- Not working ATM
Script to seed a complete workflow with proper dependencies:
1. Intakes in different stages
2. Assessments only for completed intakes
3. Plans only for completed assessments

This ensures the proper workflow dependency chain is maintained.
"""

import json
from pathlib import Path
from typing import Optional

from sqlmodel import select

from app.core.db import AsyncSession, get_session_async_manager
from app.crud.intake import create_intake
from app.models.intake import (
    ClientAddress,
    Intake,
    IntakeMessage,
    IntakeStatus,
    IntakeType,
)
from app.routes.shared_models import IntakeMessageRole

from .base import cli


def load_client_data_from_file(client_pseudo_id: str, data_type: str) -> dict | None:
    """Load client data from JSON file in seed_workflow folder"""
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed_workflow"
    file_path = data_dir / f"{client_pseudo_id}_{data_type}.json"

    if not file_path.exists():
        print(f"Data file not found: {file_path}")
        return None

    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        return None


def get_available_client_data_files() -> list[str]:
    """Get list of client IDs that have data files in seed_workflow folder"""
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed_workflow"
    if not data_dir.exists():
        return []

    client_pseudo_ids = set()
    for file_path in data_dir.glob("*_assessment.json"):
        client_pseudo_id = file_path.stem.replace("_assessment", "")
        client_pseudo_ids.add(client_pseudo_id)

    for file_path in data_dir.glob("*_plan.json"):
        client_pseudo_id = file_path.stem.replace("_plan", "")
        client_pseudo_ids.add(client_pseudo_id)

    return list(client_pseudo_ids)


async def load_intake_conversation_from_example(
    session: AsyncSession,
    client_pseudo_id: str,
    example_file_path: Optional[str] = None,
    force: bool = False,
) -> Intake:
    """
    Create an intake with messages from example conversation data.

    Args:
        session: Database session
        client_pseudo_id: Client pseudo ID to create intake for
        example_file_path: Path to JSON file with conversation data
                          (defaults to data/examples/intake_examples/test_conversation.json)
        force: If True, delete existing intake and create new one

    Returns:
        Created Intake object
    """
    # Default to test conversation if no path provided
    if example_file_path is None:
        data_dir = (
            Path(__file__).parent.parent.parent
            / "data"
            / "examples"
            / "intake_examples"
        )
        example_file_path = data_dir / "test_conversation.json"
    else:
        example_file_path = Path(example_file_path)

    if not example_file_path.exists():
        raise FileNotFoundError(f"Example file not found: {example_file_path}")

    try:
        with open(example_file_path, "r") as f:
            data = json.load(f)
    except Exception as e:
        raise ValueError(f"Error loading example data from {example_file_path}: {e}")

    # Check if intake already exists for this client
    existing_intake_result = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    existing_intake = existing_intake_result.first()

    if existing_intake:
        if force:
            # Delete existing intake (cascade should handle messages and related data)
            print(
                f"🗑️  Deleting existing intake {existing_intake.id} for client {client_pseudo_id}"
            )
            await session.delete(existing_intake)
            await session.commit()
        else:
            raise ValueError(
                f"Intake already exists for client {client_pseudo_id}. Use --force to replace it."
            )

    # Create the intake
    intake_data = data.get("intake", {})
    intake = await create_intake(
        session=session,
        client_pseudo_id=client_pseudo_id,
        intake_type=IntakeType(intake_data.get("intake_type", "conversation")),
    )

    # Update status if specified in example
    if "status" in intake_data:
        status = IntakeStatus(intake_data["status"])
        if status != IntakeStatus.CREATED:
            await intake.update_status(session, status)

    # Create messages
    messages_data = data.get("messages", [])
    for msg_data in messages_data:
        message = IntakeMessage(
            intake_id=intake.id,
            from_role=IntakeMessageRole(msg_data["from_role"]),
            content=msg_data["content"],
            section=msg_data.get("section"),
        )
        session.add(message)

    # Create a fake address for the intake
    fake_address = ClientAddress(
        intake_id=intake.id, street_address="123 Test Street", city="Boise", state="ID"
    )
    session.add(fake_address)

    await session.commit()
    await session.refresh(intake)

    print(f"✅ Created intake {intake.id} for client {client_pseudo_id}")
    print(f"   Status: {intake.status}")
    print(f"   Messages: {len(messages_data)}")
    print(
        f"   Address: {fake_address.street_address}, {fake_address.city}, {fake_address.state}"
    )

    return intake


async def create_test_intake(session: AsyncSession, client_pseudo_id: str) -> Intake:
    """
    Convenience function to create a test intake using the default example conversation.
    """
    return await load_intake_conversation_from_example(session, client_pseudo_id)


@cli.command()
async def create_test_intake_command(
    client_pseudo_id: str, example_file: Optional[str] = None, force: bool = False
):
    """
    Create a test intake with example conversation data for testing assessment retry mechanism.

    Args:
        client_pseudo_id: Client pseudo ID to create intake for
        example_file: Optional path to custom example JSON file
        force: If True, replace existing intake for this client
    """
    async with get_session_async_manager() as session:
        try:
            intake = await load_intake_conversation_from_example(
                session, client_pseudo_id, example_file, force
            )

            print("\n🎉 Successfully created test intake!")
            print(f"   Intake ID: {intake.id}")
            print(f"   Client: {client_pseudo_id}")
            print(f"   Status: {intake.status}")
            print(f"   Type: {intake.intake_type}")

            # Get message count
            messages = await session.exec(
                select(IntakeMessage).where(IntakeMessage.intake_id == intake.id)
            )
            message_count = len(messages.all())
            print(f"   Messages: {message_count}")

            print(
                f"\n💡 You can now test the assessment retry mechanism with this intake. but running uv run -m app.manage create-assessment {client_pseudo_id}"
            )

        except ValueError as e:
            print(f"❌ Error: {e}")
        except FileNotFoundError as e:
            print(f"❌ File not found: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
