"""
Evaluate summary generation using fake conversation data.

This command allows testing the summary generation pipeline without running a full conversation,
using pre-defined conversation history  data from JSON files or default values.
"""

import json
import logging
import structlog
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.data_config.output_configs.loader import OutputFileLoader
from app.utils.intake_summary_runner import generate_summary

from ..base import cli

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")
logger = structlog.get_logger(__name__)


# Default conversation messages
DEFAULT_CONVERSATION = [
    {
        "role": "assistant",
        "content": "Hi, I'm here to help gather some information from you. Let's start with your background. Can you tell me about your education and employment history?",
    },
    {
        "role": "user",
        "content": "I finished high school and worked at a factory for 5 years before my conviction.",
    },
    {
        "role": "assistant",
        "content": "Thank you for sharing that. Can you tell me about your housing situation and family support?",
    },
    {
        "role": "user",
        "content": "I'm staying with my mom right now. My wife and I are separated, and I have two kids I want to reconnect with.",
    },
    {
        "role": "assistant",
        "content": "I understand. Let's talk about any substance use or other challenges you might be facing.",
    },
    {
        "role": "user",
        "content": "I used to drink heavily, which contributed to my problems. I've been sober for 6 months now and want to stay that way.",
    },
]


def format_conversation_from_messages(messages: List[Dict[str, Any]]) -> str:
    """
    Format conversation messages into a readable string.

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys

    Returns:
        A formatted string with the conversation
    """
    formatted_output = ""

    for message in messages:
        role = message.get("role", "unknown")
        content = message.get("content", "")

        # Map role to display name
        if role == "assistant":
            display_role = "Caseworker"
        elif role == "user":
            display_role = "Client"
        else:
            display_role = role.capitalize()

        formatted_output += f"{display_role}: {content}\n\n"

    return formatted_output


@cli.command()
async def evaluate_summary(
    output_config_name: str,
    conversation_file: Optional[str] = None,
):
    """
    Evaluate summary generation with fake conversation data.

    Args:
        output_config_name: Name of the output config YAML file (e.g., "summary-default-v0.yaml")
        conversation_file: Optional path to JSON file with conversation messages (uses default if not provided)
    """
    logger.info("Starting summary evaluation")
    logger.info(f"Output config: {output_config_name}")

    try:
        # Load conversation from file or use default
        if conversation_file:
            conversation_path = Path(conversation_file)
            if not conversation_path.exists():
                print(f"❌ Error: Conversation file not found: {conversation_file}")
                return

            with open(conversation_path, "r") as f:
                conversation_messages = json.load(f)
            logger.info(
                f"Loaded {len(conversation_messages)} conversation messages from file"
            )
        else:
            conversation_messages = DEFAULT_CONVERSATION
            logger.info(
                f"Using default conversation with {len(conversation_messages)} messages"
            )

        # Load output config using the loader
        yaml_content = OutputFileLoader.read_file_content(output_config_name)
        output_config = OutputFileLoader.validate_yaml_content(yaml_content)

        logger.info(
            f"Loaded output config: {output_config.metadata.code} v{output_config.metadata.version}"
        )

        # Format conversation messages
        formatted_conversation = format_conversation_from_messages(
            conversation_messages
        )

        # Generate summary
        print("\n" + "=" * 60)
        print("📝 GENERATING SUMMARY")
        print("=" * 60)

        summary = await generate_summary(formatted_conversation, output_config)

        # Print results
        print("\n" + "=" * 60)
        print("📄 CLIENT SUMMARY")
        print("=" * 60)
        print(summary)

        print("\n" + "=" * 60)
        print("✅ EVALUATION COMPLETE")
        print("=" * 60)

        logger.info("Summary generation completed successfully")

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        print(f"❌ Error: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON: {e}")
        print(f"❌ Error: Invalid JSON in input file: {e}")
    except Exception as e:
        logger.error(f"Error during summary evaluation: {e}")
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    import asyncio

    asyncio.run(
        evaluate_summary(
            "summary-default-v0.yaml",
        )
    )
