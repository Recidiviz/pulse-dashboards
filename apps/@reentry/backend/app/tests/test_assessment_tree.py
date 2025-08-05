import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.assessment_tree import (
    AssessmentTree,
    AssessmentTreeRevision,
    add_assessment_tree_revision,
    get_assessment_tree_by_id,
    get_assessment_tree_revision_by_id,
    get_assessment_trees,
    upsert_assessment_tree,
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
async def test_create_assessment_tree_revision(async_session: AsyncSession):
    name = "test_create_assessment_tree_revision"
    dts = await get_assessment_trees(async_session)
    assert len(dts) == 0

    assessment_tree = AssessmentTree(name=name)
    await upsert_assessment_tree(async_session, assessment_tree=assessment_tree)

    revision = AssessmentTreeRevision(
        mermaid_content=MERMAID_GRAPH_VALID,
        additional_structured_data={"some_key": "this is a test"},
    )
    await add_assessment_tree_revision(
        async_session,
        assessment_tree=assessment_tree,
        revision=revision,
    )

    # fetch and check the object have been created
    assessment_tree = await get_assessment_tree_by_id(async_session, assessment_tree.id)
    assert assessment_tree is not None
    assert len(assessment_tree.revisions) == 1

    #
    # check the assessment tree list
    #

    dts = await get_assessment_trees(async_session)
    assert len(dts) == 1
    assert dts[0].name == name
    assert dts[0].current_revision_id is not None

    revision = await get_assessment_tree_revision_by_id(
        async_session, dts[0].current_revision_id
    )

    #
    # check the current revision
    #

    assert revision is not None
    assert revision.mermaid_content == MERMAID_GRAPH_VALID
    assert revision.additional_structured_data == {"some_key": "this is a test"}

    #
    # check the assessment tree revisions
    # (not loaded when getting all the assessment trees)
    #
    dt = await get_assessment_tree_by_id(async_session, dts[0].id)
    assert dt is not None
    assert len(dt.revisions) == 1
    assert dt.revisions[0].id == revision.id
    assert dt.revisions[0].mermaid_content == MERMAID_GRAPH_VALID
    assert dt.revisions[0].additional_structured_data == {"some_key": "this is a test"}

    #
    # add another revision
    #
    revision = AssessmentTreeRevision(
        mermaid_content=MERMAID_GRAPH_VALID_2,
        additional_structured_data={"some_key": "this is a test 2"},
    )
    await add_assessment_tree_revision(
        async_session,
        assessment_tree=assessment_tree,
        revision=revision,
    )

    # fetch and check the object have been created
    assessment_tree = await get_assessment_tree_by_id(async_session, assessment_tree.id)
    assert assessment_tree is not None
    assert len(assessment_tree.revisions) == 2
    assert assessment_tree.current_revision_id is not None
    assert assessment_tree.current_revision_id == revision.id

    #
    # check latest revision
    #
    revision = await get_assessment_tree_revision_by_id(
        async_session,
        assessment_tree.current_revision_id,
    )
    assert revision is not None
    assert revision.mermaid_content == MERMAID_GRAPH_VALID_2
    assert revision.additional_structured_data == {"some_key": "this is a test 2"}
