"""Tests for intake section revision system functionality."""

import pytest

from app.crud.intake_section import (
    add_intake_section_revision,
    compute_section_content_hash,
    content_has_changed,
    get_intake_section_by_id,
    get_latest_intake_section_revision,
)
from app.models.intake import IntakeSection


@pytest.mark.asyncio
class TestIntakeSectionRevisions:
    """Test intake section revision system functionality."""

    async def test_create_section_with_first_revision(self, async_session):
        """Test creating a section and adding its first revision."""
        # Create a section
        section = IntakeSection(
            title="Employment",
            description="Let's discuss your work situation",
            required_information="Current job status and plans",
            assessment_type="lsir",
            order=0,
            enabled=True,
        )
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Add first revision
        revision = await add_intake_section_revision(
            async_session,
            section,
            "Employment",
            "Let's discuss your work situation",
            "Current job status and plans",
        )

        # Verify revision was created
        assert revision.intake_section_id == section.id
        assert revision.title == "Employment"
        assert revision.content_hash is not None

        # Verify section points to current revision
        assert section.current_revision_id == revision.id

    async def test_section_properties_return_latest_revision(self, async_session):
        """Test that section properties return content from latest revision."""
        # Create section
        section = IntakeSection(
            title="Original Title",
            description="Original description",
            required_information="Original requirements",
            assessment_type="lsir",
            order=0,
            enabled=True,
        )
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Add first revision
        await add_intake_section_revision(
            async_session,
            section,
            "Updated Title",
            "Updated description",
            "Updated requirements",
        )

        # Reload section with revisions
        section = await get_intake_section_by_id(async_session, section.id, True)

        # Debug: Check if revisions are loaded
        print(
            f"Number of revisions: {len(section.revisions) if section.revisions else 'None'}"
        )
        if section.revisions:
            print(f"Latest revision title: {section.revisions[-1].title}")

        # Current revision should return revision content
        assert section.current_revision.title == "Updated Title"
        assert section.current_revision.description == "Updated description"
        assert section.current_revision.required_information == "Updated requirements"

    async def test_multiple_revisions_latest_used(self, async_session):
        """Test that with multiple revisions, the latest one is used."""
        # Create section
        section = IntakeSection(
            title="Test Section",
            description="Test description",
            required_information="Test requirements",
            assessment_type="lsir",
            order=0,
            enabled=True,
        )
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Add first revision
        await add_intake_section_revision(
            async_session,
            section,
            "First Revision",
            "First description",
            "First requirements",
        )

        # Add second revision
        await add_intake_section_revision(
            async_session,
            section,
            "Second Revision",
            "Second description",
            "Second requirements",
        )

        # Reload section with revisions
        section = await get_intake_section_by_id(async_session, section.id, True)

        # Should return latest revision content
        assert section.current_revision.title == "Second Revision"
        assert section.current_revision.description == "Second description"
        assert section.current_revision.required_information == "Second requirements"

    async def test_section_without_revisions_returns_none(self, async_session):
        """Test that section without revisions returns None for properties."""
        # Create section without revisions
        section = IntakeSection(
            title="Test Section",
            description="Test description",
            required_information="Test requirements",
            assessment_type="lsir",
            order=0,
            enabled=True,
        )
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Reload section with revisions (should be empty)
        section = await get_intake_section_by_id(async_session, section.id, True)

        # Should return None since no revisions exist
        assert section.current_revision is None

    async def test_content_hash_computation(self):
        """Test content hash computation for sections."""
        section_data = {
            "title": "Employment",
            "description": "Let's discuss your work situation",
            "required_information": "Current job status and plans",
        }

        hash1 = compute_section_content_hash(section_data)
        hash2 = compute_section_content_hash(section_data)

        # Same content should produce same hash
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 hex length

    async def test_content_change_detection(self):
        """Test content change detection logic."""
        section_data1 = {
            "title": "Employment",
            "description": "Let's discuss your work situation",
            "required_information": "Current job status and plans",
        }

        section_data2 = {
            "title": "Employment",
            "description": "UPDATED: Let's discuss your work situation",
            "required_information": "Current job status and plans",
        }

        hash1 = compute_section_content_hash(section_data1)
        hash2 = compute_section_content_hash(section_data2)

        # Different content should be detected
        assert content_has_changed(hash1, hash2)
        assert not content_has_changed(hash1, hash1)

    async def test_get_latest_revision(self, async_session):
        """Test getting the latest revision for a section."""
        # Create section
        section = IntakeSection(
            title="Test Section",
            description="Test description",
            required_information="Test requirements",
            assessment_type="lsir",
            order=0,
            enabled=True,
        )
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Add revisions
        await add_intake_section_revision(
            async_session,
            section,
            "First Revision",
            "First description",
            "First requirements",
        )

        rev2 = await add_intake_section_revision(
            async_session,
            section,
            "Second Revision",
            "Second description",
            "Second requirements",
        )

        # Get latest revision
        latest = await get_latest_intake_section_revision(async_session, section.id)

        # Should be the second revision
        assert latest.id == rev2.id
        assert latest.title == "Second Revision"

    async def test_client_intake_section_references_specific_revision(
        self, async_session
    ):
        """Test that ClientIntakeSection references the specific revision that was current when created."""
        from app.models.intake import ClientIntakeSection, Intake

        # Create test intakes
        intake1 = Intake(client_pseudo_id="CLIENT-001", status="created")
        intake2 = Intake(client_pseudo_id="CLIENT-002", status="created")
        async_session.add_all([intake1, intake2])
        await async_session.commit()
        await async_session.refresh(intake1)
        await async_session.refresh(intake2)

        # Create section
        section = IntakeSection(
            title="Test Section",
            description="Test description",
            required_information="Test requirements",
            assessment_type="lsir",
            order=0,
            enabled=True,
        )
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Add first revision
        rev1 = await add_intake_section_revision(
            async_session,
            section,
            "First Version",
            "First description",
            "First requirements",
        )

        # Create ClientIntakeSection pointing to first revision
        client_section1 = ClientIntakeSection(
            intake_id=intake1.id,
            intake_section_id=section.id,
            intake_section_revision_id=rev1.id,
            is_active=True,
            order=0,
            completion_status="not_started",
        )
        async_session.add(client_section1)
        await async_session.commit()

        # Add second revision
        rev2 = await add_intake_section_revision(
            async_session,
            section,
            "Second Version",
            "Second description",
            "Second requirements",
        )

        # Create another ClientIntakeSection pointing to second revision
        client_section2 = ClientIntakeSection(
            intake_id=intake2.id,
            intake_section_id=section.id,
            intake_section_revision_id=rev2.id,
            is_active=True,
            order=0,
            completion_status="not_started",
        )
        async_session.add(client_section2)
        await async_session.commit()

        # Refresh to load relationships
        await async_session.refresh(client_section1)
        await async_session.refresh(client_section2)

        # First client section should still show first version
        assert client_section1.section_title == "First Version"
        assert client_section1.section_description == "First description"

        # Second client section should show second version
        assert client_section2.section_title == "Second Version"
        assert client_section2.section_description == "Second description"

        # The base section should show the latest revision
        section = await get_intake_section_by_id(async_session, section.id, True)
        assert section.current_revision.title == "Second Version"
