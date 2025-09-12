"""
Test state-based section assignment for Phase 2 implementation.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.intake import ClientIntakeSection, Intake, IntakeSection, IntakeType
from app.utils.assessment_runner import get_assessments_type
from app.utils.intake.constants import (
    IntakeStatus,
    get_intake_sections_for_assessment_type,
)


@pytest.mark.asyncio
async def test_assessment_type_selection():
    """Test that assessment type selection works correctly for different states."""
    # Test Arizona -> ORAS_RT
    az_assessment_types = get_assessments_type("US_AZ")
    assert len(az_assessment_types) == 1
    assert az_assessment_types[0].value == "oras_rt"

    # Test Idaho -> LSIR
    id_assessment_types = get_assessments_type("US_ID")
    assert len(id_assessment_types) == 1
    assert id_assessment_types[0].value == "lsir"

    # Test Utah -> LSIR
    ut_assessment_types = get_assessments_type("US_UT")
    assert len(ut_assessment_types) == 1
    assert ut_assessment_types[0].value == "utah_lsir"


@pytest.mark.asyncio
async def test_section_selection_functions():
    """Test that section selection functions return correct sections."""
    # Test LSIR sections
    lsir_sections = get_intake_sections_for_assessment_type("lsir")
    assert len(lsir_sections) == 9
    lsir_titles = [s["title"] for s in lsir_sections]
    assert "Employment" in lsir_titles
    assert "Leisure and Recreation" in lsir_titles

    # Test ORAS_RT sections
    oras_rt_sections = get_intake_sections_for_assessment_type("oras_rt")
    assert len(oras_rt_sections) == 7
    oras_rt_titles = [s["title"] for s in oras_rt_sections]
    assert "Personal Demographics" in oras_rt_titles

    # Test ORAS_PIT uses same as ORAS_RT
    oras_pit_sections = get_intake_sections_for_assessment_type("oras_pit")
    assert oras_pit_sections == oras_rt_sections

    # Test unknown type defaults to LSIR
    unknown_sections = get_intake_sections_for_assessment_type("unknown")
    assert unknown_sections == lsir_sections


@pytest.mark.asyncio
async def test_arizona_client_gets_oras_rt_sections(
    async_session: AsyncSession, seed_default_sections, mock_clientdata_service
):
    """Test that Arizona clients get ORAS_RT sections assigned."""
    # Create intake for Arizona client (using test fixture client)
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["clients"][
            1
        ].pseudonymized_client_id,  # Jane Smith - Arizona client from test fixtures
        status=IntakeStatus.CREATED.value,
        intake_type=IntakeType.CONVERSATION.value,  # Use conversation type for testing
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Move intake to IN_PROGRESS to trigger section assignment
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Get assigned sections
    statement = (
        select(ClientIntakeSection, IntakeSection)
        .join(IntakeSection)
        .where(ClientIntakeSection.intake_id == intake.id)
        .order_by(ClientIntakeSection.order)
    )
    result = await async_session.exec(statement)
    assigned_sections = result.all()

    # Verify we got sections (may have title conflicts so check for any ORAS_RT specific sections)
    assert len(assigned_sections) > 0, "No sections were assigned"

    # Verify section titles - check for ORAS_RT specific sections that don't conflict with LSIR
    assigned_titles = [section[1].title for section in assigned_sections]

    print(f"Assigned titles: {assigned_titles}")

    # Check that we have some ORAS_RT specific sections (that don't conflict with LSIR titles)
    oras_rt_specific_sections = [
        "Personal Demographics",
        "Criminal Attitudes and Behavioral Patterns",
        "Financial and Marital Status",
        "Social Support and Family Relationships",
    ]

    found_oras_sections = [
        title for title in oras_rt_specific_sections if title in assigned_titles
    ]
    assert (
        len(found_oras_sections) > 0
    ), f"No ORAS_RT specific sections found. Found: {assigned_titles}"


@pytest.mark.asyncio
async def test_idaho_client_gets_lsir_sections(
    async_session: AsyncSession, seed_default_sections, mock_clientdata_service
):
    """Test that Idaho clients get LSIR sections assigned."""
    # Create intake for Idaho client (using test fixture client)
    intake = Intake(
        client_pseudo_id=mock_clientdata_service[
            "client_pseudo_id"
        ],  # John Doe - Idaho client from test fixtures
        status=IntakeStatus.CREATED.value,
        intake_type=IntakeType.CONVERSATION.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Move intake to IN_PROGRESS to trigger section assignment
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Get assigned sections
    statement = (
        select(ClientIntakeSection, IntakeSection)
        .join(IntakeSection)
        .where(ClientIntakeSection.intake_id == intake.id)
        .order_by(ClientIntakeSection.order)
    )
    result = await async_session.exec(statement)
    assigned_sections = result.all()

    # Verify we got sections
    assert len(assigned_sections) > 0, "No sections were assigned"

    # Verify section titles - check for LSIR specific sections
    assigned_titles = [section[1].title for section in assigned_sections]

    print(f"Assigned titles: {assigned_titles}")

    # Check that we have LSIR specific sections
    lsir_specific_sections = [
        "Leisure and Recreation",
        "Companions",
        "Alcohol and Drug Use",
        "Family and Marital Relationships",
    ]

    found_lsir_sections = [
        title for title in lsir_specific_sections if title in assigned_titles
    ]
    assert (
        len(found_lsir_sections) > 0
    ), f"No LSIR specific sections found. Found: {assigned_titles}"
