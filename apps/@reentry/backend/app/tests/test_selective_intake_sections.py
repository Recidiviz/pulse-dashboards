"""Simple tests for selective intake sections seeding functionality."""

from unittest.mock import patch

import pytest
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.manage.intake import compute_section_content_hash, seed_sections_selective
from app.models.intake import IntakeSection


@pytest.mark.asyncio
class TestSelectiveIntakeSectionsSeeding:
    """Test selective intake sections seeding functionality."""

    async def test_compute_section_content_hash(self):
        """Test section content hash computation."""
        section_data = {
            "title": "Employment",
            "description": "Let's discuss your work situation",
            "required_information": "Current job status and plans",
        }

        hash_result = compute_section_content_hash(section_data)
        assert isinstance(hash_result, str)
        assert len(hash_result) == 64  # SHA-256 hex length

    async def test_compute_section_content_hash_consistency(self):
        """Test that identical section data produces identical hashes."""
        section_data = {
            "title": "Employment",
            "description": "Let's discuss your work situation",
            "required_information": "Current job status and plans",
        }

        hash1 = compute_section_content_hash(section_data)
        hash2 = compute_section_content_hash(section_data)
        assert hash1 == hash2

    async def test_compute_section_content_hash_different_data(self):
        """Test that different section data produces different hashes."""
        section_data1 = {
            "title": "Employment",
            "description": "Let's discuss your work situation",
            "required_information": "Current job status and plans",
        }

        section_data2 = {
            "title": "Education",
            "description": "Let's talk about your educational background",
            "required_information": "Educational history and future plans",
        }

        hash1 = compute_section_content_hash(section_data1)
        hash2 = compute_section_content_hash(section_data2)
        assert hash1 != hash2

    async def test_seed_sections_selective_creates_sections(self, async_session):
        """Test that selective seeding creates sections when they don't exist."""
        # Clear any existing sections for clean test
        result = await async_session.exec(select(IntakeSection))
        existing_sections = result.all()
        for section in existing_sections:
            await async_session.delete(section)
        await async_session.commit()

        # Run selective seeding
        await seed_sections_selective(async_session)

        from app.core.data_config.intakesections.constants import SUPPORTED_INTAKE_NAMES

        for intake_name in SUPPORTED_INTAKE_NAMES:
            result = await async_session.exec(
                select(IntakeSection).where(IntakeSection.intake_name == intake_name)
            )
            sections = result.all()
            assert len(sections) > 0, f"No sections found for intake name {intake_name}"

    async def test_unmocked_seed_sections_creates_sections(self, async_session):
        """Test that selective seeding creates sections for all supported intake types."""
        # Clear any existing sections for clean test
        result = await async_session.exec(select(IntakeSection))
        existing_sections = result.all()
        for section in existing_sections:
            await async_session.delete(section)
        await async_session.commit()

        # Run selective seeding
        await seed_sections_selective(async_session)

        from app.core.data_config.intakesections.constants import SUPPORTED_INTAKE_NAMES

        for intake_name in SUPPORTED_INTAKE_NAMES:
            result = await async_session.exec(
                select(IntakeSection).where(IntakeSection.intake_name == intake_name)
            )
            sections = result.all()
            assert len(sections) > 0

    async def test_seed_sections_selective_no_changes(self, async_session):
        """Test seeding when sections already exist with same content."""
        # First seeding
        await seed_sections_selective(async_session)

        # Get initial section count
        result = await async_session.exec(select(IntakeSection))
        initial_sections = result.all()
        initial_count = len(initial_sections)

        # Second seeding with same content
        await seed_sections_selective(async_session)

        # Verify no new sections were created
        result = await async_session.exec(select(IntakeSection))
        final_sections = result.all()
        assert len(final_sections) == initial_count

    @patch(
        "app.manage.intake.INTAKE_SECTIONS_MAPPING",
        new={
            "TEST-SECTIONS": [
                {
                    "title": "Employment",
                    "description": "UPDATED: We'll discuss your current work situation",
                    "required_information": "UPDATED: Employment status and future plans",
                }
            ]
        },
    )
    @patch("app.manage.intake.SUPPORTED_INTAKE_NAMES", new=["TEST-SECTIONS"])
    async def test_seed_sections_selective_updates_content(self, async_session):
        """Test that sections are updated when content changes."""
        # First, create sections with original content
        original_section = IntakeSection(
            title="Employment",
            description="Original description",
            required_information="Original required information",
            intake_name="TEST-SECTIONS",
            order=0,
        )
        async_session.add(original_section)
        await async_session.commit()
        original_id = original_section.id

        # Run selective seeding with mocked updated content
        await seed_sections_selective(async_session)

        # Verify section was updated through revision system

        result = await async_session.exec(
            select(IntakeSection)
            .where(IntakeSection.id == original_id)
            .options(selectinload(IntakeSection.revisions))
        )
        updated_section = result.first()
        assert updated_section is not None

        # Check that revision was created with updated content
        assert updated_section.current_revision is not None
        assert (
            updated_section.current_revision.description
            == "UPDATED: We'll discuss your current work situation"
        )
        assert (
            updated_section.current_revision.required_information
            == "UPDATED: Employment status and future plans"
        )
        # ID should remain the same to preserve relationships
        assert updated_section.id == original_id
