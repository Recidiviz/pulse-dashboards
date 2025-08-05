from pathlib import Path

from app.core.db import AsyncSession, get_session_async_manager
from app.crud.decision_tree import (
    DecisionTree,
    DecisionTreeRevision,
    add_decision_tree_revision,
    add_decision_tree_revision_with_hash,
    get_decision_tree_by_name,
    upsert_decision_tree,
)
from app.utils.mermaid import MermaidParser

from .base import cli


async def import_decision_tree_db(session: AsyncSession, filepath: Path):
    name = filepath.stem
    print(f"Importing decision tree {name}")
    decision_tree = await get_decision_tree_by_name(session, name)
    if decision_tree is not None:
        print(f"! Decision tree {name} already exists, skipping")
        return

    with open(filepath, "r", encoding="utf8") as f:
        mermaid_content = f.read()
    try:
        MermaidParser.parse(mermaid_content)
    except Exception as e:
        print(f"File {filepath} is not a valid Mermaid graph, skipping ({e})")
        return

    # try to see if there is a additionnal txt files associated to it
    txt_file = filepath.with_suffix(".txt")
    notes = ""
    if txt_file.exists():
        with open(txt_file, "r", encoding="utf8") as f:
            notes = f.read()

    # add the decision tree
    decision_tree = DecisionTree(name=name)
    revision = DecisionTreeRevision(mermaid_content=mermaid_content, notes=notes)

    await upsert_decision_tree(session, decision_tree=decision_tree)
    await add_decision_tree_revision(
        session, decision_tree=decision_tree, revision=revision
    )


async def import_decision_trees(filepaths: list[Path]):
    async with get_session_async_manager() as session:
        for filepath in filepaths:
            await import_decision_tree_db(session, filepath)


async def import_decision_tree_selective(session: AsyncSession, filepath: Path):
    """
    Selective import that only creates new revisions when content changes.
    Preserves existing trees and their references while updating content.
    """
    name = filepath.stem
    print(f"Importing decision tree {name} (selective mode)")

    with open(filepath, "r", encoding="utf8") as f:
        mermaid_content = f.read()

    try:
        MermaidParser.parse(mermaid_content)
    except Exception as e:
        print(f"File {filepath} is not a valid Mermaid graph, skipping ({e})")
        return

    # Load associated notes if exists
    txt_file = filepath.with_suffix(".txt")
    notes = ""
    if txt_file.exists():
        with open(txt_file, "r", encoding="utf8") as f:
            notes = f.read()

    # Check if decision tree already exists
    decision_tree = await get_decision_tree_by_name(session, name)

    if decision_tree is None:
        # Create new decision tree
        print(f"Creating new decision tree: {name}")
        decision_tree = DecisionTree(name=name, enabled=True)
        await upsert_decision_tree(session, decision_tree=decision_tree)

        # Add first revision with hash
        await add_decision_tree_revision_with_hash(
            session, decision_tree, mermaid_content, notes
        )
    else:
        # Tree exists, check if content changed and add revision if needed
        print(f"Decision tree {name} exists, checking for content changes")
        revision = await add_decision_tree_revision_with_hash(
            session, decision_tree, mermaid_content, notes
        )

        if revision:
            print(f"Added new revision for decision tree: {name}")
        else:
            print(f"No changes detected for decision tree: {name}")


async def import_decision_trees_selective(filepaths: list[Path]):
    """Import multiple decision trees using selective mode."""
    async with get_session_async_manager() as session:
        for filepath in filepaths:
            await import_decision_tree_selective(session, filepath)


@cli.command()
async def import_decision_tree(filepaths: list[Path]):
    """
    Import decision trees from a list of Mermaid files.

    This command reads Mermaid graph definitions from the given file paths,
    verifies their validity, and stores them in the database if they are new.
    If a corresponding text file (.txt) with the same name exists, it also
    imports notes associated with the decision tree.
    """
    await import_decision_trees(filepaths)
