"""
Provides standardized intake section examples for use in tests.
"""

from typing import List
from uuid import uuid4

from app.models.intake import ClientIntakeSection, IntakeSection


def create_test_section(title: str = "Test Section", order: int = 0) -> IntakeSection:
    """Create a single test section with customizable title and order."""
    return IntakeSection(
        id=uuid4(),
        title=title,
        description=f"Description for {title}",
        required_information=f"Required information for {title}",
        assessment_type="lsir",
        order=order,
        enabled=True,
    )


def create_test_sections(count: int = 2) -> List[IntakeSection]:
    """Create multiple test sections for testing."""
    return [create_test_section(f"Test Section {i+1}", i) for i in range(count)]


def create_test_client_intake_section(
    intake_id,
    intake_section_id,
    completion_status="not_started",
    is_active=True,
    order=0,
    intake_section_revision_id=None,
) -> ClientIntakeSection:
    """Create a ClientIntakeSection with proper revision handling for tests."""
    return ClientIntakeSection(
        intake_id=intake_id,
        intake_section_id=intake_section_id,
        intake_section_revision_id=intake_section_revision_id,
        completion_status=completion_status,
        is_active=is_active,
        order=order,
    )
