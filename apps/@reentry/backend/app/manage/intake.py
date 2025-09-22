from sqlmodel import delete, select

from app.core.data_config.intakesections.constants import (
    INTAKE_SECTIONS_MAPPING,
    SUPPORTED_INTAKE_NAMES,
)
from app.core.db import AsyncSession, get_session_async_manager
from app.crud.intake_section import (
    add_intake_section_revision,
    content_has_changed,
    get_latest_intake_section_revision,
)
from app.models.intake import ClientIntakeSection, Intake, IntakeMessage, IntakeSection
from app.utils.content_hash import compute_content_hash

from .base import cli


@cli.command()
async def delete_intakes():
    async with get_session_async_manager() as session:
        await delete_all_intake_records(session)


async def delete_all_intake_records(session: AsyncSession):
    """
    Delete all intake records and their associated client intake section records and messages.
    """
    print("Deleting all intake records...")

    # First, delete all messages associated with intakes
    # This is necessary to maintain referential integrity
    await session.execute(delete(IntakeMessage))
    print("All intake messages deleted")

    # Then, delete all client intake section records
    await session.execute(delete(ClientIntakeSection))
    print("All client intake sections deleted")

    # Finally, delete the intakes themselves
    await session.execute(delete(Intake))
    print("All intakes deleted")

    await session.commit()

    print("All intake records and related data deleted successfully")


def compute_section_content_hash(section_data: dict) -> str:
    """Compute content hash for an intake section."""
    content = f"{section_data['title']}|{section_data['description']}|{section_data['required_information']}"
    return compute_content_hash(content)


@cli.command()
async def seed_sections():
    async with get_session_async_manager() as session:
        await seed_sections_selective(session)


async def seed_sections_selective(session: AsyncSession):
    """
    Selective seeding of intake sections using revision system.
    Preserves existing relationships while updating content through revisions.
    """
    print("Seeding intake sections (revision-based selective mode)...")

    for intake_name in SUPPORTED_INTAKE_NAMES:
        print(f"Processing {intake_name} sections...")
        sections_data = INTAKE_SECTIONS_MAPPING[intake_name]

        for i, section_data in enumerate(sections_data):
            # Check if section already exists
            existing = await session.exec(
                select(IntakeSection).where(
                    IntakeSection.title == section_data["title"],
                    IntakeSection.intake_name == intake_name,
                )
            )
            existing_section = existing.first()
            if existing_section:
                # Section exists, check if content has changed using latest revision
                latest_revision = await get_latest_intake_section_revision(
                    session, existing_section.id
                )

                if latest_revision:
                    # Compare with latest revision content
                    existing_content_hash = latest_revision.content_hash
                    new_content_hash = compute_section_content_hash(section_data)

                    if content_has_changed(existing_content_hash, new_content_hash):
                        # Content has changed, add new revision
                        print(
                            f"Adding new revision for {intake_name} section: {section_data['title']}"
                        )
                        print(
                            f"  Old description: {existing_section.description[:60]}..."
                        )
                        print(
                            f"  New description: {section_data['description'][:60]}..."
                        )

                        new_revision = await add_intake_section_revision(
                            session,
                            existing_section,
                            section_data["title"],
                            section_data["description"],
                            section_data["required_information"],
                        )

                        # Refresh section to get updated current_revision_id
                        await session.refresh(existing_section)
                        print(f"  ✅ NEW REVISION CREATED: {new_revision.id}")
                        print(
                            f"  ✅ CURRENT_REVISION_ID SET TO: {existing_section.current_revision_id}"
                        )
                        print(
                            f"  ✅ REVISION DESCRIPTION: {new_revision.description[:60]}..."
                        )
                    else:
                        print(
                            f"No changes for {intake_name} section: {section_data['title']}"
                        )
                else:
                    # No revisions exist yet, create first revision
                    print(
                        f"Creating first revision for {intake_name} section: {section_data['title']}"
                    )
                    print(
                        f"  Section description (direct): {existing_section.description[:60]}..."
                    )
                    print(
                        f"  New revision description: {section_data['description'][:60]}..."
                    )

                    new_revision = await add_intake_section_revision(
                        session,
                        existing_section,
                        section_data["title"],
                        section_data["description"],
                        section_data["required_information"],
                    )

                    # Refresh section to get updated current_revision_id
                    await session.refresh(existing_section)
                    print(f"  ✅ FIRST REVISION CREATED: {new_revision.id}")
                    print(
                        f"  ✅ CURRENT_REVISION_ID SET TO: {existing_section.current_revision_id}"
                    )
                    print(
                        f"  ✅ REVISION DESCRIPTION: {new_revision.description[:60]}..."
                    )

                # Update order if needed
                if existing_section.order != i:
                    existing_section.order = i
                    session.add(existing_section)
            else:
                # Section doesn't exist, create it with first revision
                print(f"Creating new {intake_name} section: {section_data['title']}")
                new_section = IntakeSection(
                    title=section_data["title"],
                    description=section_data["description"],
                    required_information=section_data["required_information"],
                    intake_name=intake_name,
                    order=i,
                    enabled=True,
                )
                session.add(new_section)
                await session.commit()
                await session.refresh(new_section)

                # Create first revision
                await add_intake_section_revision(
                    session,
                    new_section,
                    section_data["title"],
                    section_data["description"],
                    section_data["required_information"],
                )

        # Deactivate sections that are no longer in the current section definitions
        current_titles = {section["title"] for section in sections_data}
        # Find active sections for this assessment type that are not in current definitions
        disabled_sections = await session.exec(
            select(IntakeSection).where(
                IntakeSection.intake_name == intake_name,
                not IntakeSection.enabled,
            )
        )

        for section in disabled_sections:
            if section.title in current_titles:
                print(f"Unabling {intake_name} section: {section.title}")
                section.enabled = True
                session.add(section)
        # Find active sections for this assessment type that are not in current definitions
        active_sections = await session.exec(
            select(IntakeSection).where(
                IntakeSection.intake_name == intake_name,
                IntakeSection.enabled,
            )
        )

        for section in active_sections:
            if section.title not in current_titles:
                print(f"Deactivating unused {intake_name} section: {section.title}")
                section.enabled = False
                session.add(section)

    await session.commit()
    print("Selective intake sections seeding completed")
