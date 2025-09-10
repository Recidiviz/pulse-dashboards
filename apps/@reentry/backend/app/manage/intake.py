from sqlmodel import delete, select

from app.core.db import AsyncSession, get_session_async_manager
from app.crud.intake_section import (
    add_intake_section_revision,
    content_has_changed,
    get_latest_intake_section_revision,
)
from app.models.assessment import AssessmentType
from app.models.intake import ClientIntakeSection, Intake, IntakeMessage, IntakeSection
from app.utils.content_hash import compute_content_hash
from app.utils.intake.constants import (
    SECTIONS_ID_FACR,
    SECTIONS_ORAS_RT,
    SECTIONS_UTAH_LSIR,
    get_intake_sections_for_assessment_type,
)

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


@cli.command()
async def seed_sections():
    async with get_session_async_manager() as session:
        await seed_default_sections(session)


async def seed_default_sections(session: AsyncSession):
    """
    Seed default intake sections if they don't exist.

    Seeds both LSIR and ORAS_RT sections.

    Useful for initial application setup or migrations.
    """
    print("Seeding intake sections...")

    # Seed LSIR sections (marked as default for backward compatibility)
    print("Seeding LSIR sections...")
    for i, topic in enumerate(SECTIONS_ID_FACR):
        existing = await session.exec(
            select(IntakeSection).where(
                IntakeSection.title == topic["title"],
                IntakeSection.assessment_type == "lsir",
            )
        )
        existing_section = existing.first()

        if not existing_section:
            print(f"Creating LSIR section: {topic['title']} (order: {i})")
            new_section = IntakeSection(
                title=topic["title"],
                description=topic["description"],
                required_information=topic["required_information"],
                assessment_type="lsir",
                order=i,
            )
            session.add(new_section)

    # Seed ORAS_RT sections (not marked as default)
    print("Seeding ORAS_RT sections...")
    for i, topic in enumerate(SECTIONS_ORAS_RT):
        existing = await session.exec(
            select(IntakeSection).where(
                IntakeSection.title == topic["title"],
                IntakeSection.assessment_type == "oras_rt",
            )
        )
        existing_section = existing.first()

        if not existing_section:
            print(f"Creating ORAS_RT section: {topic['title']} (order: {i})")
            new_section = IntakeSection(
                title=topic["title"],
                description=topic["description"],
                required_information=topic["required_information"],
                assessment_type="oras_rt",
                order=i,
            )
            session.add(new_section)

    # Seed LSIR sections (marked as default for backward compatibility)
    print("Seeding Utah LSIR sections...")
    for i, topic in enumerate(SECTIONS_UTAH_LSIR):
        existing = await session.exec(
            select(IntakeSection).where(
                IntakeSection.title == topic["title"],
                IntakeSection.assessment_type == "utah_lsir",
            )
        )
        existing_section = existing.first()

        if not existing_section:
            print(f"Creating Utah LSIR section: {topic['title']} (order: {i})")
            new_section = IntakeSection(
                title=topic["title"],
                description=topic["description"],
                required_information=topic["required_information"],
                assessment_type="utah_lsir",
                order=i,
            )
            session.add(new_section)

    await session.commit()
    print("All sections seeded successfully")

    # Return all LSIR sections
    result = await session.exec(
        select(IntakeSection).where(IntakeSection.assessment_type == "lsir")
    )
    return result.all()


def compute_section_content_hash(section_data: dict) -> str:
    """Compute content hash for an intake section."""
    content = f"{section_data['title']}|{section_data['description']}|{section_data['required_information']}"
    return compute_content_hash(content)


async def seed_sections_selective(session: AsyncSession):
    """
    Selective seeding of intake sections using revision system.
    Preserves existing relationships while updating content through revisions.
    """
    print("Seeding intake sections (revision-based selective mode)...")

    # Process each assessment type
    assessment_types = [
        AssessmentType.LSIR,
        AssessmentType.ORAS_RT,
        AssessmentType.UTAH_LSIR,
    ]

    for assessment_type in assessment_types:
        print(f"Processing {assessment_type.upper()} sections...")
        sections_data = get_intake_sections_for_assessment_type(assessment_type)

        for i, section_data in enumerate(sections_data):
            # Check if section already exists
            existing = await session.exec(
                select(IntakeSection).where(
                    IntakeSection.title == section_data["title"],
                    IntakeSection.assessment_type == assessment_type,
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
                            f"Adding new revision for {assessment_type} section: {section_data['title']}"
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
                            f"No changes for {assessment_type} section: {section_data['title']}"
                        )
                else:
                    # No revisions exist yet, create first revision
                    print(
                        f"Creating first revision for {assessment_type} section: {section_data['title']}"
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
                print(
                    f"Creating new {assessment_type} section: {section_data['title']}"
                )
                new_section = IntakeSection(
                    title=section_data["title"],
                    description=section_data["description"],
                    required_information=section_data["required_information"],
                    assessment_type=assessment_type,
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
                IntakeSection.assessment_type == assessment_type,
                not IntakeSection.enabled,
            )
        )

        for section in disabled_sections:
            if section.title in current_titles:
                print(f"Unabling {assessment_type} section: {section.title}")
                section.enabled = True
                session.add(section)
        # Find active sections for this assessment type that are not in current definitions
        active_sections = await session.exec(
            select(IntakeSection).where(
                IntakeSection.assessment_type == assessment_type,
                IntakeSection.enabled,
            )
        )

        for section in active_sections:
            if section.title not in current_titles:
                print(f"Deactivating unused {assessment_type} section: {section.title}")
                section.enabled = False
                session.add(section)

    await session.commit()
    print("Selective intake sections seeding completed")
