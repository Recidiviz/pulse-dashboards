"""Tests for selective assessment tree import functionality."""

import tempfile
from pathlib import Path

import pytest
from sqlmodel import select

from app.crud.assessment_tree import get_assessment_tree_by_name
from app.manage.import_assessment_tree import import_assessment_tree_selective
from app.models.assessment_tree import AssessmentTreeRevision


@pytest.mark.asyncio
class TestSelectiveAssessmentTreeImport:
    """Test selective assessment tree import functionality."""

    async def test_import_new_assessment_tree(self, async_session):
        """Test importing a new assessment tree."""
        mermaid_content = """graph TD
    A[Start] --> B{Question}
    B --> C[Action 1]
    B --> D[Action 2]"""

        yaml_content = """description: "Test assessment tree"
version: "1.0"
"""

        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test files
            mermaid_file = Path(temp_dir) / "test_tree.mermaid"
            yaml_file = Path(temp_dir) / "test_tree.yaml"

            mermaid_file.write_text(mermaid_content)
            yaml_file.write_text(yaml_content)

            # Import the tree
            await import_assessment_tree_selective(
                async_session, mermaid_file, "test_type"
            )

            # Verify tree was created
            tree = await get_assessment_tree_by_name(async_session, "test_tree")
            assert tree is not None
            assert tree.name == "test_tree"
            assert tree.assessment_type == "test_type"
            assert tree.enabled is True

            # Verify revision was created with content hash
            result = await async_session.exec(
                select(AssessmentTreeRevision).where(
                    AssessmentTreeRevision.assessment_tree_id == tree.id
                )
            )
            revisions = result.all()
            assert len(revisions) == 1

            revision = revisions[0]
            assert revision.mermaid_content == mermaid_content
            assert revision.content_hash is not None
            assert len(revision.content_hash) == 64  # SHA-256 hex length

    async def test_import_existing_tree_no_changes(self, async_session):
        """Test importing an existing tree with no content changes."""
        mermaid_content = """graph TD
    A[Start] --> B{Question}
    B --> C[Action 1]"""

        with tempfile.TemporaryDirectory() as temp_dir:
            mermaid_file = Path(temp_dir) / "no_change_test.mermaid"
            mermaid_file.write_text(mermaid_content)

            # First import
            await import_assessment_tree_selective(
                async_session, mermaid_file, "test_type"
            )

            tree = await get_assessment_tree_by_name(async_session, "no_change_test")
            result = await async_session.exec(
                select(AssessmentTreeRevision).where(
                    AssessmentTreeRevision.assessment_tree_id == tree.id
                )
            )
            initial_revisions = result.all()
            initial_count = len(initial_revisions)

            # Second import with same content
            await import_assessment_tree_selective(
                async_session, mermaid_file, "test_type"
            )

            # Verify no new revision was created
            result = await async_session.exec(
                select(AssessmentTreeRevision).where(
                    AssessmentTreeRevision.assessment_tree_id == tree.id
                )
            )
            final_revisions = result.all()
            assert len(final_revisions) == initial_count

    async def test_import_existing_tree_with_changes(self, async_session):
        """Test importing an existing tree with content changes."""
        original_content = """graph TD
    A[Start] --> B{Question}
    B --> C[Action 1]"""

        modified_content = """graph TD
    A[Start] --> B{Question}
    B --> C[Action 1]
    B --> D[Action 2]
    C --> E[End]"""

        with tempfile.TemporaryDirectory() as temp_dir:
            mermaid_file = Path(temp_dir) / "change_test.mermaid"

            # First import
            mermaid_file.write_text(original_content)
            await import_assessment_tree_selective(
                async_session, mermaid_file, "test_type"
            )

            tree = await get_assessment_tree_by_name(async_session, "change_test")
            result = await async_session.exec(
                select(AssessmentTreeRevision).where(
                    AssessmentTreeRevision.assessment_tree_id == tree.id
                )
            )
            initial_revisions = result.all()
            initial_count = len(initial_revisions)

            # Second import with changed content
            mermaid_file.write_text(modified_content)
            await import_assessment_tree_selective(
                async_session, mermaid_file, "test_type"
            )

            # Verify new revision was created
            result = await async_session.exec(
                select(AssessmentTreeRevision)
                .where(AssessmentTreeRevision.assessment_tree_id == tree.id)
                .order_by(AssessmentTreeRevision.created_at)
            )
            final_revisions = result.all()
            assert len(final_revisions) == initial_count + 1

            # Verify content is updated
            latest_revision = final_revisions[-1]
            assert latest_revision.mermaid_content == modified_content
            assert latest_revision.content_hash != initial_revisions[0].content_hash

    async def test_import_without_yaml_file(self, async_session):
        """Test importing when no YAML file exists."""
        mermaid_content = """graph TD
    A[Start] --> B{Question}"""

        with tempfile.TemporaryDirectory() as temp_dir:
            mermaid_file = Path(temp_dir) / "no_yaml.mermaid"
            mermaid_file.write_text(mermaid_content)

            await import_assessment_tree_selective(
                async_session, mermaid_file, "test_type"
            )

            # Verify tree was created without YAML data
            tree = await get_assessment_tree_by_name(async_session, "no_yaml")
            assert tree is not None

            result = await async_session.exec(
                select(AssessmentTreeRevision).where(
                    AssessmentTreeRevision.assessment_tree_id == tree.id
                )
            )
            revisions = result.all()
            assert len(revisions) == 1
            assert revisions[0].additional_structured_data is None
