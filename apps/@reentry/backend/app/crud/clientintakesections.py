"""
CRUD operations for ClientIntakeSection management.

This module extracts all ClientIntakeSection queries from models/intake.py.
"""

import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.db import AsyncSession
from app.models.intake_sections import (
    ClientIntakeSection,
    CompletionStatus,
    IntakeSection,
)

logger = logging.getLogger(__name__)


async def get_current_client_section_by_title(
    session: AsyncSession, intake_id: UUID, current_section_title: str
) -> Optional[ClientIntakeSection]:
    """
    Find the current ClientIntakeSection by title.

    Args:
        session: Database session
        intake_id: UUID of the intake
        current_section_title: Title of the section to find

    Returns:
        ClientIntakeSection or None
    """
    statement = (
        select(ClientIntakeSection)
        .join(IntakeSection)
        .where(
            ClientIntakeSection.intake_id == intake_id,
            IntakeSection.title == current_section_title,
        )
    )
    result = await session.exec(statement)
    return result.first()


async def get_all_client_sections_ordered(
    session: AsyncSession, intake_id: UUID
) -> List[ClientIntakeSection]:
    """
    Get all ClientIntakeSection records for an intake, ordered by order field.

    Args:
        session: Database session
        intake_id: UUID of the intake

    Returns:
        List of ClientIntakeSection records ordered by order field
    """
    statement = (
        select(ClientIntakeSection)
        .join(IntakeSection)
        .where(ClientIntakeSection.intake_id == intake_id)
        .order_by(ClientIntakeSection.order)
        .options(
            selectinload(ClientIntakeSection.intake_section).selectinload(
                IntakeSection.revisions
            ),
            selectinload(ClientIntakeSection.intake_section_revision),
        )
    )
    result = await session.exec(statement)
    return result.all()


async def mark_section_completed(
    session: AsyncSession, client_section: ClientIntakeSection
) -> None:
    """
    Mark a ClientIntakeSection as completed.

    Args:
        session: Database session
        client_section: ClientIntakeSection to mark as completed
    """
    client_section.completion_status = CompletionStatus.COMPLETED
    session.add(client_section)


async def mark_section_in_progress(
    session: AsyncSession, client_section: ClientIntakeSection
) -> None:
    """
    Mark a ClientIntakeSection as in progress.

    Args:
        session: Database session
        client_section: ClientIntakeSection to mark as in progress
    """
    client_section.completion_status = CompletionStatus.IN_PROGRESS
    session.add(client_section)


def find_next_section_in_list(
    all_sections: List[ClientIntakeSection], current_order: int
) -> Optional[ClientIntakeSection]:
    """
    Find the next section in a list given the current order.

    Args:
        all_sections: List of ClientIntakeSection records
        current_order: Current section order

    Returns:
        Next ClientIntakeSection or None if no more sections
    """
    for section in all_sections:
        if section.order > current_order:
            return section
    return None
