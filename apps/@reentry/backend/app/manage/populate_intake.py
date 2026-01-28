"""
Management command to populate intake conversation data from YAML files.

This command reads conversation data from YAML files and creates intake records
with associated messages in the database.
"""

from pathlib import Path
from typing import Any, Dict

import structlog
import yaml
from typer import Option

from app.core.db import get_session_async_manager
from app.models.base import IntakeStatus, IntakeType
from app.models.intake import (
    ClientAddress,
    Intake,
    IntakeMessage,
    IntakeSurvey,
)
from app.routes.shared_models import IntakeMessageRole
from app.utils.config_loader import ConfigLoader

from .base import cli

logger = structlog.get_logger(__name__)

EXAMPLES_DIR = (
    Path(__file__).parent.parent.parent / "data" / "examples" / "conversations"
)


def load_yaml_file(yaml_path: Path) -> Dict[str, Any]:
    """Load and parse a YAML file."""
    try:
        with open(yaml_path, "r") as f:
            data = yaml.safe_load(f)
        return data
    except Exception as e:
        logger.error(f"Failed to load YAML file {yaml_path}: {e}")
        raise


def validate_conversation_data(data: Dict[str, Any]) -> bool:
    """Validate the structure of conversation data."""
    if not isinstance(data, dict):
        logger.error("YAML data must be a dictionary")
        return False

    if "conversation" not in data:
        logger.error("YAML data must contain 'conversation' key")
        return False

    if not isinstance(data["conversation"], list):
        logger.error("'conversation' must be a list")
        return False

    for idx, message in enumerate(data["conversation"]):
        if not isinstance(message, dict):
            logger.error(f"Message {idx} must be a dictionary")
            return False

        if "role" not in message or "content" not in message:
            logger.error(f"Message {idx} must have 'role' and 'content' keys")
            return False

        if message["role"] not in [role.value for role in IntakeMessageRole]:
            logger.error(
                f"Message {idx} has invalid role: {message['role']}. "
                f"Must be one of: {[role.value for role in IntakeMessageRole]}"
            )
            return False

    return True


async def create_intake_from_yaml(
    client_pseudo_id: str,
    state_code: str,
    yaml_data: Dict[str, Any],
    yaml_filename: str,
) -> Intake:
    """Create an intake record and associated messages from YAML data."""
    async with get_session_async_manager() as session:
        # Extract metadata
        metadata = yaml_data.get("metadata", {})
        intake_type = metadata.get("intake_type", "conversation")
        status = metadata.get("status", "created")

        # Validate intake_type
        if intake_type not in [t.value for t in IntakeType]:
            valid_types = [t.value for t in IntakeType]
            logger.error(f"Invalid intake_type '{intake_type}'")
            raise ValueError(
                f"Invalid intake_type '{intake_type}'. Must be one of: {valid_types}"
            )

        # Validate status
        if status not in [s.value for s in IntakeStatus]:
            valid_statuses = [s.value for s in IntakeStatus]
            logger.error(f"Invalid status '{status}'")
            raise ValueError(
                f"Invalid status '{status}'. Must be one of: {valid_statuses}"
            )

        # Resolve assessment config - filter by intake_type using ConfigLoader
        resolved_config_id = None
        active_configs = await ConfigLoader.get_active_assessment_configs_by_state(
            state_code, session
        )

        if not active_configs:
            logger.error(f"No active configs found for state_code={state_code}")
            raise ValueError(
                f"No active assessment configs found for state {state_code}"
            )

        # Find first config matching intake_type
        for config in active_configs:
            try:
                # Load the parsed config to check intake_type
                config_file = await ConfigLoader.load_assessment_config(
                    config.id, session
                )

                if config_file.intake.intake_type == intake_type:
                    resolved_config_id = config.id
                    logger.info(
                        f"Using config for {state_code}: "
                        f"{config.code} v{config.version} with intake_type={intake_type} (ID: {resolved_config_id})"
                    )
                    break
            except Exception as e:
                logger.warning(
                    f"Failed to load config {config.code} v{config.version}: {e}"
                )
                continue

        if not resolved_config_id:
            logger.error(
                f"No configs found for state_code={state_code} with intake_type={intake_type}"
            )
            raise ValueError(
                f"No assessment configs found for state {state_code} with intake_type '{intake_type}'"
            )

        # Create intake record - if target status is completed, start with in_progress
        # so we can trigger processing via update_status
        initial_status = (
            IntakeStatus.IN_PROGRESS.value
            if status == IntakeStatus.COMPLETED.value
            else status
        )

        intake = Intake(
            client_pseudo_id=client_pseudo_id,
            intake_type=intake_type,
            status=initial_status,
            assessment_config_id=resolved_config_id,
        )

        session.add(intake)
        await session.commit()
        await session.refresh(intake)

        logger.info(
            f"Created intake {intake.id} for client {client_pseudo_id} from {yaml_filename}"
        )

        # Create messages
        conversation = yaml_data.get("conversation", [])
        messages_created = 0

        for exchange in conversation:
            message = IntakeMessage(
                intake_id=intake.id,
                from_role=exchange["role"],
                content=exchange["content"],
                section=exchange.get("section"),
            )
            session.add(message)
            messages_created += 1

        await session.commit()

        logger.info(f"Created {messages_created} messages for intake {intake.id}")

        # Create address if provided
        address_data = metadata.get("address")
        if address_data:
            address = ClientAddress(
                intake_id=intake.id,
                street_address=address_data.get("street_address"),
                city=address_data.get("city", ""),
                state=address_data.get("state", ""),
            )
            session.add(address)
            logger.info(f"Created address for intake {intake.id}")

        # Create survey if provided
        survey_data = metadata.get("survey")
        if survey_data:
            survey = IntakeSurvey(
                intake_id=intake.id,
                difficulty_rating=survey_data.get("difficulty_rating"),
                questions_confusing=survey_data.get("questions_confusing"),
                preferred_method=survey_data.get("preferred_method"),
                method_other=survey_data.get("method_other"),
                additional_feedback=survey_data.get("additional_feedback"),
            )
            session.add(survey)
            logger.info(f"Created survey for intake {intake.id}")

        await session.commit()
        await session.refresh(intake)

        # If target status is completed, call update_status to trigger processing
        if status == IntakeStatus.COMPLETED.value:
            logger.info(
                f"Updating intake {intake.id} status to completed to trigger processing"
            )
            await intake.update_status(session, IntakeStatus.COMPLETED)
            logger.info(f"Intake {intake.id} completed - plan generation scheduled")

        return intake


@cli.command()
async def populate_intake(
    client_pseudo_id: str = Option(
        ..., help="Client's pseudo ID to associate with the intake"
    ),
    state_code: str = Option(
        ...,
        help="State code (e.g., US_IX, US_UT) for assessment config and example lookup",
    ),
):
    """
    Populate intake conversation data from YAML files.

    This command reads conversation data from YAML files in the
    data/examples/conversations directory and creates intake records
    with associated messages. The command automatically finds the example
    file for the specified state code (e.g., US_IX.yaml) and uses the
    first active assessment config for that state.

    YAML File Format:
        metadata:
          intake_type: conversation  # optional, defaults to "conversation"
          status: created  # optional, defaults to "created"

          # Optional address information
          address:
            street_address: "123 Main St"
            city: "City Name"
            state: "ST"

          # Optional survey information
          survey:
            difficulty_rating: 4  # 1-5, optional
            questions_confusing: "no"  # "no", "some", "most_all", optional
            preferred_method: "chatbot"  # "chatbot", "voice", "person", "other", optional
            method_other: "Text if other"  # optional
            additional_feedback: "Feedback text"  # optional

        conversation:
          - role: caseworker
            content: "Question text"
            section: "Section Name"  # optional

          - role: client
            content: "Answer text"
            section: "Section Name"  # optional

    Args:
        client_pseudo_id: The client's pseudo ID to associate with the intake
        state_code: State code for config lookup and example file selection

    Example usage:
        uv run -m app.manage populate-intake --client-pseudo-id abc123 --state-code US_IX
    """
    # Check if examples directory exists
    if not EXAMPLES_DIR.exists():
        print(f"Error: Examples directory does not exist: {EXAMPLES_DIR}")
        print("Please create the directory and add YAML files.")
        return

    # Look for state-specific example file
    yaml_filename = f"{state_code}.yaml"
    yaml_path = EXAMPLES_DIR / yaml_filename

    if not yaml_path.exists():
        print(f"Error: No example file found for state code '{state_code}'")
        print(f"Expected file: {yaml_path}")

        # Show available state examples
        yaml_files = list(EXAMPLES_DIR.glob("*.yaml")) + list(
            EXAMPLES_DIR.glob("*.yml")
        )
        if yaml_files:
            print("\nAvailable state examples:")
            for f in yaml_files:
                print(f"  - {f.stem}")
        return

    print(f"Loading conversation data from: {yaml_path.name}")

    try:
        # Load and validate YAML data
        yaml_data = load_yaml_file(yaml_path)

        if not validate_conversation_data(yaml_data):
            print("Error: Invalid YAML data structure")
            return

        # Create intake and messages
        intake = await create_intake_from_yaml(
            client_pseudo_id, state_code, yaml_data, yaml_path.name
        )

        print("\n✓ Successfully created intake!")
        print(f"  Intake ID: {intake.id}")
        print(f"  Client Pseudo ID: {intake.client_pseudo_id}")
        print(f"  Intake Type: {intake.intake_type}")
        print(f"  Status: {intake.status}")
        if intake.assessment_config_id:
            print(f"  Assessment Config ID: {intake.assessment_config_id}")

        # Count messages by section
        conversation = yaml_data.get("conversation", [])
        sections = {}
        for exchange in conversation:
            section = exchange.get("section", "No section")
            sections[section] = sections.get(section, 0) + 1

        print(f"\n  Messages created: {len(conversation)}")
        if sections:
            print("  Messages by section:")
            for section, count in sections.items():
                print(f"    - {section}: {count}")

    except Exception as e:
        logger.error(f"Failed to populate intake: {e}", exc_info=True)
        print(f"\nError: Failed to populate intake: {e}")
        return
