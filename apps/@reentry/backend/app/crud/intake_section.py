from datetime import datetime
from typing import List, Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.intake_sections import (
    ClientIntakeSection,
    IntakeSection,
    IntakeSectionRevision,
)
from app.utils.content_hash import compute_content_hash


async def create_intake_sections(
    session: AsyncSession,
    sections: List[IntakeSection],
) -> List[IntakeSection]:
    """Create multiple intake sections."""
    session.add_all(sections)
    await session.commit()

    # Refresh to get assigned IDs
    for section in sections:
        await session.refresh(section)

    return sections


@overload
async def get_intake_sections_by_intake_name(
    session: AsyncSession,
    intake_name: str,
    include_revisions: bool = True,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[IntakeSection]: ...


@overload
async def get_intake_sections_by_intake_name(
    session: AsyncSession,
    intake_name: str,
    include_revisions: bool = True,
    *,
    query_only: Literal[False] = False,
) -> list[IntakeSection]: ...


@statement_or_result(result_type=list)
async def get_intake_sections_by_intake_name(
    session: AsyncSession,
    intake_name: str,
    include_revisions: bool = True,
    *,
    query_only: bool = False,
) -> SelectOfScalar[IntakeSection] | list[IntakeSection]:
    """Get all intake sections for a specific assessment type."""
    statement = select(IntakeSection).where(IntakeSection.intake_name == intake_name)

    if include_revisions:
        from sqlalchemy.orm import selectinload

        statement = statement.options(selectinload(IntakeSection.revisions))

    return statement


@overload
async def get_intake_section_by_id(
    session: AsyncSession,
    section_id: UUID,
    include_revisions: bool = True,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[IntakeSection]: ...


@overload
async def get_intake_section_by_id(
    session: AsyncSession,
    section_id: UUID,
    include_revisions: bool = True,
    *,
    query_only: Literal[False] = False,
) -> IntakeSection | None: ...


@statement_or_result(first_only=True)
async def get_intake_section_by_id(
    session: AsyncSession,
    section_id: UUID,
    include_revisions: bool = True,
    *,
    query_only: bool = False,
) -> SelectOfScalar[IntakeSection] | IntakeSection | None:
    """Get an intake section by ID."""
    statement = select(IntakeSection).where(IntakeSection.id == section_id)

    if include_revisions:
        from sqlalchemy.orm import selectinload

        statement = statement.options(selectinload(IntakeSection.revisions))

    return statement


@overload
async def get_intake_sections_by_titles(
    session: AsyncSession, titles: List[str], *, query_only: Literal[True]
) -> SelectOfScalar[IntakeSection]: ...


@overload
async def get_intake_sections_by_titles(
    session: AsyncSession, titles: List[str], *, query_only: Literal[False] = False
) -> list[IntakeSection]: ...


@statement_or_result(result_type=list)
async def get_intake_sections_by_titles(
    session: AsyncSession, titles: List[str], *, query_only: bool = False
) -> SelectOfScalar[IntakeSection] | list[IntakeSection]:
    """Get intake sections by their titles."""
    return select(IntakeSection).where(IntakeSection.title.in_(titles))


@overload
async def get_intake_section_by_title_and_assessment_type(
    session: AsyncSession,
    title: str,
    intake_name: str,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[IntakeSection]: ...


@overload
async def get_intake_section_by_title_and_assessment_type(
    session: AsyncSession,
    title: str,
    intake_name: str,
    *,
    query_only: Literal[False] = False,
) -> IntakeSection | None: ...


@statement_or_result(first_only=True)
async def get_intake_section_by_title_and_assessment_type(
    session: AsyncSession, title: str, intake_name: str, *, query_only: bool = False
) -> SelectOfScalar[IntakeSection] | IntakeSection | None:
    """Get an intake section by title and assessment type."""
    return select(IntakeSection).where(
        IntakeSection.title == title, IntakeSection.intake_name == intake_name
    )


async def update_intake_section(
    session: AsyncSession,
    section: IntakeSection,
) -> IntakeSection:
    """Update an intake section."""
    session.add(section)
    await session.commit()
    await session.refresh(section)
    return section


async def delete_intake_section(
    session: AsyncSession,
    section_id: UUID,
) -> bool:
    """Delete an intake section by ID."""
    section = await get_intake_section_by_id(session, section_id)
    if not section:
        return False
    await session.delete(section)
    await session.commit()
    return True


@overload
async def check_section_in_use(
    session: AsyncSession, section_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[ClientIntakeSection]: ...


@overload
async def check_section_in_use(
    session: AsyncSession, section_id: UUID, *, query_only: Literal[False] = False
) -> ClientIntakeSection | None: ...


# TODO use this to remove unused sections
@statement_or_result(first_only=True)
async def check_section_in_use(
    session: AsyncSession, section_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[ClientIntakeSection] | ClientIntakeSection | None:
    """Check if a section is in use by any client intake."""
    return select(ClientIntakeSection).where(
        ClientIntakeSection.intake_section_id == section_id
    )


@overload
async def get_intake_sections_with_revisions(
    session: AsyncSession,
    intake_name: str,
    include_revisions: bool = True,
    filter_enabled: bool = True,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[IntakeSection]: ...


@overload
async def get_intake_sections_with_revisions(
    session: AsyncSession,
    intake_name: str,
    include_revisions: bool = True,
    filter_enabled: bool = True,
    *,
    query_only: Literal[False] = False,
) -> list[IntakeSection]: ...


@statement_or_result(result_type=list)
async def get_intake_sections_with_revisions(
    session: AsyncSession,
    intake_name: str,
    include_revisions: bool = True,
    filter_enabled: bool = True,
    *,
    query_only: bool = False,
) -> SelectOfScalar[IntakeSection] | list[IntakeSection]:
    """Get intake sections with their revisions, similar to trees."""
    statement = select(IntakeSection).where(IntakeSection.intake_name == intake_name)

    if filter_enabled:
        statement = statement.where(IntakeSection.enabled)

    statement = statement.order_by(IntakeSection.order)

    if include_revisions:
        from sqlalchemy.orm import selectinload

        statement = statement.options(selectinload(IntakeSection.revisions))

    return statement


def compute_section_content_hash(section_data: dict) -> str:
    """Compute content hash for an intake section."""
    content = f"{section_data['title']}|{section_data['description']}|{section_data['required_information']}"
    return compute_content_hash(content)


async def add_intake_section_revision(
    session: AsyncSession,
    intake_section: IntakeSection,
    title: str,
    description: str,
    required_information: str,
) -> IntakeSectionRevision:
    """Add a new revision to an intake section."""
    section_data = {
        "title": title,
        "description": description,
        "required_information": required_information,
    }
    content_hash = compute_section_content_hash(section_data)

    revision = IntakeSectionRevision(
        intake_section=intake_section,
        description=description,
        title=title,
        required_information=required_information,
        content_hash=content_hash,
        created_at=datetime.utcnow(),
    )

    session.add(revision)
    await session.commit()
    await session.refresh(revision)

    # Update the current revision pointer
    intake_section.current_revision_id = revision.id
    session.add(intake_section)
    await session.commit()

    return revision


@overload
async def get_latest_intake_section_revision(
    session: AsyncSession, section_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[IntakeSectionRevision]: ...


@overload
async def get_latest_intake_section_revision(
    session: AsyncSession, section_id: UUID, *, query_only: Literal[False] = False
) -> IntakeSectionRevision | None: ...


@statement_or_result(first_only=True)
async def get_latest_intake_section_revision(
    session: AsyncSession, section_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[IntakeSectionRevision] | IntakeSectionRevision | None:
    """Get the latest revision for an intake section."""
    return (
        select(IntakeSectionRevision)
        .where(IntakeSectionRevision.intake_section_id == section_id)
        .order_by(IntakeSectionRevision.created_at.desc())
    )


def content_has_changed(existing_hash: str, new_content_hash: str) -> bool:
    """Check if content has changed based on hash comparison."""
    return existing_hash != new_content_hash
