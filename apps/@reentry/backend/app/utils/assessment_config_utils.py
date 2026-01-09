"""
Utility functions for tracking intake sections using conversation config.

This module provides section tracking WITHOUT ClientIntakeSection dependency,
using the conversation config YAML directly.
"""

import structlog
from typing import Optional

from app.core.data_config.assessment_configs.assessment_config import (
    IntakeConfigConversation,
)

logger = structlog.get_logger(__name__)


def get_first_section_from_config(
    conversation_config: IntakeConfigConversation,
) -> Optional[dict]:
    """
    Get the first section from conversation config.

    Args:
        conversation_config: IntakeConfigConversation instance

    Returns:
        Dict with section data: {title, description, required_information, order}
        Returns None if config has no sections
    """
    if not conversation_config or not conversation_config.sections:
        return None

    first_section = conversation_config.sections[0]
    return {
        "title": first_section.title,
        "description": first_section.description,
        "required_information": first_section.required_information,
        "order": 0,
    }


def get_section_by_title_from_config(
    conversation_config: IntakeConfigConversation, section_title: str
) -> Optional[dict]:
    """
    Get a section by title from conversation config.

    Args:
        conversation_config: IntakeConfigConversation instance
        section_title: Title of the section to find

    Returns:
        Dict with section data and order, or None if not found
    """
    if not conversation_config or not conversation_config.sections:
        return None

    for i, section in enumerate(conversation_config.sections):
        if section.title == section_title:
            return {
                "title": section.title,
                "description": section.description,
                "required_information": section.required_information,
                "order": i,
            }
    return None


def get_next_section_from_config(
    conversation_config: IntakeConfigConversation, current_section_title: str
) -> Optional[dict]:
    """
    Get the next section after current section.

    Args:
        conversation_config: IntakeConfigConversation instance
        current_section_title: Title of the current section

    Returns:
        Dict with next section data, or None if no more sections

    Raises:
        ValueError: If current_section_title is not found in conversation config
    """
    if not conversation_config or not conversation_config.sections:
        return None

    # Find current section's order
    current_order = None
    for i, section in enumerate(conversation_config.sections):
        if section.title == current_section_title:
            current_order = i
            break

    if current_order is None:
        logger.error(f"Section '{current_section_title}' not found in config")
        raise ValueError(
            f"Section '{current_section_title}' not found in conversation config. "
            f"Available sections: {[s.title for s in conversation_config.sections]}"
        )

    # Get next section
    next_order = current_order + 1
    if next_order < len(conversation_config.sections):
        next_section = conversation_config.sections[next_order]
        return {
            "title": next_section.title,
            "description": next_section.description,
            "required_information": next_section.required_information,
            "order": next_order,
        }
    return None


def get_total_sections_count(conversation_config: IntakeConfigConversation) -> int:
    """
    Get total number of sections in conversation config.

    Args:
        conversation_config: IntakeConfigConversation instance

    Returns:
        Number of sections (0 if no config or no sections)
    """
    if not conversation_config or not conversation_config.sections:
        return 0
    return len(conversation_config.sections)


def get_all_section_titles_from_config(
    conversation_config: IntakeConfigConversation,
) -> list[str]:
    """
    Get all section titles from conversation config.

    Args:
        conversation_config: IntakeConfigConversation instance

    Returns:
        List of section titles
    """
    if not conversation_config or not conversation_config.sections:
        return []
    return [section.title for section in conversation_config.sections]


def enrich_sections_with_status(sections: list, current_section: str | None) -> list:
    """
    Enrich intake sections with computed status based on current_section.

    Logic:
    - If current_section is None: all sections are not started - initial
    - If current_section is None or not found: all sections are "completed" -- error
    - If section index < current_section index: "completed"
    - If section index == current_section index: "in_progress"
    - If section index > current_section index: "not_started"

    Args:
        sections: List of section dicts with 'title' and 'description'
        current_section: Title of the current section, or None

    Returns:
        List of IntakeSectionResponse objects with status enriched
    """
    from app.routes.base import IntakeSectionResponse, IntakeSectionStatus

    # Find the index of the current section
    current_index = -1
    if current_section:
        for idx, section in enumerate(sections):
            section_title = (
                section.get("title") if isinstance(section, dict) else section.title
            )
            if section_title == current_section:
                current_index = idx
                break

    # Enrich each section with status
    enriched_sections = []
    for idx, section in enumerate(sections):
        if not current_section:
            # Current section is None, not started
            status = IntakeSectionStatus.NOT_STARTED
        elif current_index < 0:
            # Current section not found, all completed
            status = IntakeSectionStatus.COMPLETED
        elif idx < current_index:
            status = IntakeSectionStatus.COMPLETED
        elif idx == current_index:
            status = IntakeSectionStatus.IN_PROGRESS
        else:
            status = IntakeSectionStatus.NOT_STARTED

        # Handle both dict and object formats
        if isinstance(section, dict):
            title = section.get("title")
            description = section.get("description")
        else:
            title = section.title
            description = section.description

        enriched_sections.append(
            IntakeSectionResponse(
                title=title,
                description=description,
                status=status,
            )
        )

    return enriched_sections
