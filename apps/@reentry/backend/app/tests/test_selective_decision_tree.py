"""Simple tests for selective decision tree import functionality."""

import tempfile
from pathlib import Path

import pytest
from sqlmodel import select

from app.crud.decision_tree import get_decision_tree_by_name
from app.manage.import_decision_tree import import_decision_tree_selective
from app.models.decision_tree import DecisionTreeRevision


@pytest.mark.asyncio
class TestSelectiveDecisionTreeImport:
    """Test selective decision tree import functionality."""

    async def test_import_new_decision_tree(self, async_session):
        """Test importing a new decision tree."""
        mermaid_content = """graph TD
    A[Client Needs Employment] --> B{Has High School Diploma}
    B --> C[Job Skills Assessment]
    B --> D[GED Program]
    C --> E[Job Placement]
    D --> C"""

        notes_content = "This decision tree helps with employment planning."

        with tempfile.TemporaryDirectory() as temp_dir:
            mermaid_file = Path(temp_dir) / "employment_test.mermaid"
            notes_file = Path(temp_dir) / "employment_test.txt"

            mermaid_file.write_text(mermaid_content)
            notes_file.write_text(notes_content)

            await import_decision_tree_selective(async_session, mermaid_file)

            # Verify tree was created
            tree = await get_decision_tree_by_name(async_session, "employment_test")
            assert tree is not None
            assert tree.name == "employment_test"
            assert tree.enabled is True

            # Verify revision was created with content hash
            result = await async_session.exec(
                select(DecisionTreeRevision).where(
                    DecisionTreeRevision.decision_tree_id == tree.id
                )
            )
            revisions = result.all()
            assert len(revisions) == 1

            revision = revisions[0]
            assert revision.mermaid_content == mermaid_content
            assert revision.notes == notes_content
            assert revision.content_hash is not None
            assert len(revision.content_hash) == 64  # SHA-256 hex length

    async def test_import_existing_tree_no_changes(self, async_session):
        """Test importing an existing tree with no content changes."""
        mermaid_content = """graph TD
    A[Start] --> B{Decision Point}
    B --> C[Outcome 1]
    B --> D[Outcome 2]"""

        notes_content = "Test decision tree notes."

        with tempfile.TemporaryDirectory() as temp_dir:
            mermaid_file = Path(temp_dir) / "no_change_test.mermaid"
            notes_file = Path(temp_dir) / "no_change_test.txt"

            mermaid_file.write_text(mermaid_content)
            notes_file.write_text(notes_content)

            # First import
            await import_decision_tree_selective(async_session, mermaid_file)

            tree = await get_decision_tree_by_name(async_session, "no_change_test")
            result = await async_session.exec(
                select(DecisionTreeRevision).where(
                    DecisionTreeRevision.decision_tree_id == tree.id
                )
            )
            initial_revisions = result.all()
            initial_count = len(initial_revisions)

            # Second import with same content
            await import_decision_tree_selective(async_session, mermaid_file)

            # Verify no new revision was created
            result = await async_session.exec(
                select(DecisionTreeRevision).where(
                    DecisionTreeRevision.decision_tree_id == tree.id
                )
            )
            final_revisions = result.all()
            assert len(final_revisions) == initial_count

    async def test_import_existing_tree_with_changes(self, async_session):
        """Test importing an existing tree with content changes."""
        original_content = """graph TD
    A[Start] --> B{Decision}
    B --> C[Action 1]"""

        modified_content = """graph TD
    A[Start] --> B{Decision}
    B --> C[Action 1]
    B --> D[Action 2]
    C --> E[Final Step]"""

        notes_content = "Consistent notes content."

        with tempfile.TemporaryDirectory() as temp_dir:
            mermaid_file = Path(temp_dir) / "change_test.mermaid"
            notes_file = Path(temp_dir) / "change_test.txt"
            notes_file.write_text(notes_content)

            # First import
            mermaid_file.write_text(original_content)
            await import_decision_tree_selective(async_session, mermaid_file)

            tree = await get_decision_tree_by_name(async_session, "change_test")
            result = await async_session.exec(
                select(DecisionTreeRevision).where(
                    DecisionTreeRevision.decision_tree_id == tree.id
                )
            )
            initial_revisions = result.all()
            initial_count = len(initial_revisions)

            # Second import with changed mermaid content
            mermaid_file.write_text(modified_content)
            await import_decision_tree_selective(async_session, mermaid_file)

            # Verify new revision was created
            result = await async_session.exec(
                select(DecisionTreeRevision)
                .where(DecisionTreeRevision.decision_tree_id == tree.id)
                .order_by(DecisionTreeRevision.created_at)
            )
            final_revisions = result.all()
            assert len(final_revisions) == initial_count + 1

            # Verify content is updated
            latest_revision = final_revisions[-1]
            assert latest_revision.mermaid_content == modified_content
            assert latest_revision.content_hash != initial_revisions[0].content_hash
