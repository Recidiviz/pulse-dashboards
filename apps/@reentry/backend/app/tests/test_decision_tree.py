import pytest

from app.core.db import AsyncSession
from app.crud.decision_tree import (
    DecisionTree,
    DecisionTreeRevision,
    add_decision_tree_revision,
    get_decision_tree_by_id,
    get_decision_tree_revision_by_id,
    get_decision_trees,
    upsert_decision_tree,
)

MERMAID_GRAPH_VALID = """
graph TD
    A[Start: hello]
    A --> B{is it?}
    B --> B1[yes]
    B --> B2[no]
    B1 & B2 --> C[End: goodbye]
"""

MERMAID_GRAPH_VALID_2 = """
graph TD
    A[Start: hello]
    A --> B{is it?}
    B --> B1[Yes]
    B --> B2[No]
    B1 --> C [Should look about X]
    C & B2 --> D[End: goodbye]
"""


@pytest.mark.asyncio
async def test_create_decision_tree_revision(async_session: AsyncSession):
    name = "test_create_decision_tree_revision"
    dts = await get_decision_trees(async_session)
    assert len(dts) == 0

    decision_tree = DecisionTree(name=name)
    await upsert_decision_tree(async_session, decision_tree=decision_tree)

    revision = DecisionTreeRevision(
        mermaid_content=MERMAID_GRAPH_VALID,
        notes="This is a test",
    )
    await add_decision_tree_revision(
        async_session,
        decision_tree=decision_tree,
        revision=revision,
    )

    # fetch and check the object have been created
    decision_tree = await get_decision_tree_by_id(async_session, decision_tree.id)
    assert decision_tree is not None
    assert len(decision_tree.revisions) == 1

    #
    # check the decision tree list
    #

    dts = await get_decision_trees(async_session)
    assert len(dts) == 1
    assert dts[0].name == name
    assert dts[0].current_revision_id is not None

    revision = await get_decision_tree_revision_by_id(
        async_session, dts[0].current_revision_id
    )

    #
    # check the current revision
    #

    assert revision is not None
    assert revision.mermaid_content == MERMAID_GRAPH_VALID
    assert revision.notes == "This is a test"

    #
    # check the decision tree revisions
    # (not loaded when getting all the decision trees)
    #
    dt = await get_decision_tree_by_id(async_session, dts[0].id)
    assert dt is not None
    assert len(dt.revisions) == 1
    assert dt.revisions[0].id == revision.id
    assert dt.revisions[0].mermaid_content == MERMAID_GRAPH_VALID
    assert dt.revisions[0].notes == "This is a test"

    #
    # add another revision
    #
    revision = DecisionTreeRevision(
        mermaid_content=MERMAID_GRAPH_VALID_2, notes="This is a test 2"
    )
    await add_decision_tree_revision(
        async_session,
        decision_tree=decision_tree,
        revision=revision,
    )

    # fetch and check the object have been created
    decision_tree = await get_decision_tree_by_id(async_session, decision_tree.id)
    assert decision_tree is not None
    assert len(decision_tree.revisions) == 2
    assert decision_tree.current_revision_id is not None
    assert decision_tree.current_revision_id == revision.id

    #
    # check latest revision
    #
    revision = await get_decision_tree_revision_by_id(
        async_session,
        decision_tree.current_revision_id,
    )
    assert revision is not None
    assert revision.mermaid_content == MERMAID_GRAPH_VALID_2
    assert revision.notes == "This is a test 2"


# --- not supported
MERMAID_GRAPH_INVALID_1 = """
graph TD
    A[Start: hello]
    A---B{is it the end yet?}
"""

# missing end node (should have End:)
MERMAID_GRAPH_INVALID_2 = """
graph TD
    A[Start: hello]
    A-->B
"""

# missing start node (shoudl start with Start:)
MERMAID_GRAPH_INVALID_3 = """
graph TD
    A[hello]
    A-->B[End: bye]
"""
