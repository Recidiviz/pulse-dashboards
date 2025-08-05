from pathlib import Path

from yaml import Loader, load

from app.core.db import AsyncSession, get_session_async_manager
from app.crud.assessment_tree import (
    AssessmentTree,
    AssessmentTreeRevision,
    add_assessment_tree_revision,
    add_assessment_tree_revision_with_hash,
    delete_assessment_tree,
    get_assessment_tree_by_name,
    upsert_assessment_tree,
)
from app.utils.mermaid import MermaidParser

from .base import cli


async def import_assessment_tree_db(
    session: AsyncSession, filepath: Path, assessment_type: str, force=False
):
    name = filepath.stem
    print(f"Importing assessment tree {name}")
    assessment_tree = await get_assessment_tree_by_name(session, name)
    if assessment_tree is not None:
        if force:
            await delete_assessment_tree(session, assessment_tree)
        else:
            print(f"! Assessment tree {name} already exists, skipping")
            return

    mermaid_content = filepath.read_text(encoding="utf-8")

    # try to see if there is a additionnal txt files associated to it
    yaml_file = filepath.with_suffix(".yaml")
    data = None
    if yaml_file.exists():
        data = load(yaml_file.read_text(encoding="utf-8"), Loader)

    try:
        MermaidParser.parse(mermaid_content, data)
    except Exception as e:
        print(f"File {filepath} is not a valid Mermaid graph, skipping ({e})")
        return

    # add the assessment tree
    assessment_tree = AssessmentTree(
        name=name, enabled=True, assessment_type=assessment_type
    )
    revision = AssessmentTreeRevision(
        mermaid_content=mermaid_content, additional_structured_data=data
    )

    await upsert_assessment_tree(session, assessment_tree=assessment_tree)
    await add_assessment_tree_revision(
        session, assessment_tree=assessment_tree, revision=revision
    )


async def import_assessment_trees(
    filepaths: list[Path], assessment_type: str, force=False
):
    async with get_session_async_manager() as session:
        for filepath in filepaths:
            await import_assessment_tree_db(session, filepath, assessment_type, force)


async def import_assessment_tree_selective(
    session: AsyncSession, filepath: Path, assessment_type: str
):
    """
    Selective import that only creates new revisions when content changes.
    Preserves existing trees and their references while updating content.
    """
    name = filepath.stem
    print(f"Importing assessment tree {name} (selective mode)")

    mermaid_content = filepath.read_text(encoding="utf-8")

    # Load associated YAML data if exists
    yaml_file = filepath.with_suffix(".yaml")
    data = None
    if yaml_file.exists():
        data = load(yaml_file.read_text(encoding="utf-8"), Loader)

    try:
        MermaidParser.parse(mermaid_content, data)
    except Exception as e:
        print(f"File {filepath} is not a valid Mermaid graph, skipping ({e})")
        return

    # Check if assessment tree already exists
    assessment_tree = await get_assessment_tree_by_name(session, name)

    if assessment_tree is None:
        # Create new assessment tree
        print(f"Creating new assessment tree: {name}")
        assessment_tree = AssessmentTree(
            name=name, enabled=True, assessment_type=assessment_type
        )
        await upsert_assessment_tree(session, assessment_tree=assessment_tree)

        # Add first revision with hash
        await add_assessment_tree_revision_with_hash(
            session, assessment_tree, mermaid_content, data
        )
    else:
        # Tree exists, check if content changed and add revision if needed
        print(f"Assessment tree {name} exists, checking for content changes")
        revision = await add_assessment_tree_revision_with_hash(
            session, assessment_tree, mermaid_content, data
        )

        if revision:
            print(f"Added new revision for assessment tree: {name}")
        else:
            print(f"No changes detected for assessment tree: {name}")


async def import_assessment_trees_selective(
    filepaths: list[Path], assessment_type: str
):
    """Import multiple assessment trees using selective mode."""
    async with get_session_async_manager() as session:
        for filepath in filepaths:
            await import_assessment_tree_selective(session, filepath, assessment_type)


@cli.command()
async def import_assessment_tree(filepaths: list[Path]):
    """
    Import assessment trees from a list of Mermaid files.

    This command reads Mermaid graph definitions from the given file paths,
    verifies their validity, and stores them in the database if they are new.
    If a corresponding file (.yaml) with the same name exists, it also
    imports notes associated with the assessment tree.
    """
    await import_assessment_trees(filepaths)
