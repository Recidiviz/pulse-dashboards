import pytest
from sqlalchemy.ext.asyncio import AsyncSession

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


@pytest.mark.asyncio
async def test_api_get_decision_trees(client, async_session, assert_response):
    response = await client.get("/decision-trees")
    assert_response(response, 200)
    data = response.json()
    assert len(data["items"]) == 0
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 50
    assert data["pages"] == 0


@pytest.mark.asyncio
async def test_api_create_decision_tree(client, async_session, assert_response):
    name = "test_api_create_decision_tree"
    data = {
        "name": name,
        "notes": "Initial revision",
    }
    response = await client.post("/decision-trees", json=data)
    assert_response(response, 201)
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == name
    assert data["current_revision_id"] is None
    assert data["enabled"] is False
    dt_id = data["id"]

    # add new revision
    data = {
        "mermaid_content": MERMAID_GRAPH_VALID,
        "notes": "First revision",
    }

    response = await client.post(f"/decision-trees/{dt_id}/revisions", json=data)
    assert_response(response, 201)
    data = response.json()
    assert data["id"] is not None
    assert data["mermaid_content"] == MERMAID_GRAPH_VALID
    assert data["notes"] == "First revision"
    assert data["decision_tree_id"] == dt_id

    # check that the decision tree has been updated
    response = await client.get(f"/decision-trees/{dt_id}")
    assert_response(response, 200)
    data = response.json()
    assert len(data["revisions"]) == 1

    # check that the list of decision trees has been updated
    response = await client.get("/decision-trees")
    assert_response(response, 200)
    data = response.json()
    assert len(data["items"]) == 1
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["size"] == 50
    assert data["pages"] == 1
    assert data["items"][0]["name"] == name

    # add new revision
    data = {
        "mermaid_content": MERMAID_GRAPH_VALID_2,
        "notes": "Second revision",
    }

    response = await client.post(f"/decision-trees/{dt_id}/revisions", json=data)
    assert_response(response, 201)
    data = response.json()
    assert data["id"] is not None
    assert data["mermaid_content"] == MERMAID_GRAPH_VALID_2
    assert data["notes"] == "Second revision"
    assert data["decision_tree_id"] == dt_id


@pytest.mark.asyncio
async def test_api_get_decision_tree_by_id(client, async_session, assert_response):
    name = "test_api_get_decision_tree_by_id"
    data = {
        "name": name,
    }
    response = await client.post("/decision-trees", json=data)
    assert_response(response, 201)
    data = response.json()
    dt_id = data["id"]

    response = await client.get(f"/decision-trees/{dt_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["id"] == dt_id
    assert data["name"] == name
    assert data["current_revision_id"] is None
    assert len(data["revisions"]) == 0


@pytest.mark.asyncio
async def test_api_patch_decision_tree(client, async_session, assert_response):
    # Create a decision tree to patch
    name = "test_api_patch_decision_tree"
    initial_data = {
        "name": name,
        "mermaid_content": MERMAID_GRAPH_VALID,
        "notes": "Initial revision",
    }
    response = await client.post("/decision-trees", json=initial_data)
    assert_response(response, 201)
    data = response.json()
    assert data["name"] == name
    assert data["criterias"] is None
    dt_id = data["id"]

    # Patch the decision tree
    updated_data = {"name": "updated_name", "criterias": "updated_criterias"}
    response = await client.patch(f"/decision-trees/{dt_id}", json=updated_data)
    assert_response(response, 200)
    data = response.json()

    # Verify that the patch was successful
    assert data["id"] == dt_id
    assert data["name"] == "updated_name"
    assert data["criterias"] == "updated_criterias"

    # Retrieve the updated decision tree and confirm changes
    response = await client.get(f"/decision-trees/{dt_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["id"] == dt_id
    assert data["name"] == "updated_name"
    assert data["criterias"] == "updated_criterias"


@pytest.mark.asyncio
async def test_api_get_decision_tree_revisions(client, async_session, assert_response):
    # Create a decision tree with a single revision
    name = "test_api_get_decision_tree_revisions"
    initial_data = {
        "name": name,
    }
    response = await client.post("/decision-trees", json=initial_data)
    assert_response(response, 201)
    data = response.json()
    dt_id = data["id"]

    # Add a first revision
    updated_data = {
        "mermaid_content": MERMAID_GRAPH_VALID,
        "notes": "Initial revision",
    }
    response = await client.post(
        f"/decision-trees/{dt_id}/revisions", json=updated_data
    )
    assert_response(response, 201)

    # Retrieve revisions for the decision tree
    response = await client.get(f"/decision-trees/{dt_id}/revisions")
    assert_response(response, 200)
    data = response.json()

    # Verify that revisions match expectations
    assert len(data["items"]) == 1
    assert data["items"][0]["mermaid_content"] == MERMAID_GRAPH_VALID
    assert data["items"][0]["notes"] == "Initial revision"

    # Add another revision
    updated_data = {
        "mermaid_content": MERMAID_GRAPH_VALID_2,
        "notes": "Second revision",
    }
    response = await client.post(
        f"/decision-trees/{dt_id}/revisions", json=updated_data
    )
    assert_response(response, 201)

    # Retrieve revisions for the decision tree
    response = await client.get(f"/decision-trees/{dt_id}/revisions")
    assert_response(response, 200)
    data = response.json()

    # Verify that revisions match expectations
    assert len(data["items"]) == 2
    assert data["items"][0]["mermaid_content"] == MERMAID_GRAPH_VALID
    assert data["items"][0]["notes"] == "Initial revision"
    assert data["items"][1]["mermaid_content"] == MERMAID_GRAPH_VALID_2
    assert data["items"][1]["notes"] == "Second revision"


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


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "mermaid_content,expected",
    [
        (MERMAID_GRAPH_INVALID_1, "is not a valid mermaid graph"),
        (MERMAID_GRAPH_INVALID_2, "must have at least 1 end node"),
        (MERMAID_GRAPH_INVALID_3, "must have one start node"),
    ],
)
async def test_api_create_decision_tree_with_invalid_mermaid(
    client,
    async_session,
    assert_response,
    mermaid_content,
    expected,
):
    name = "test_api_create_decision_tree_with_invalid_mermaid"
    data = {
        "name": name,
    }
    response = await client.post("/decision-trees", json=data)
    assert_response(response, 201)
    data = response.json()
    dt_id = data["id"]

    # add the invalid revision
    revision_data = {
        "mermaid_content": mermaid_content,
        "notes": "Invalid mermaid test",
    }
    response = await client.post(
        f"/decision-trees/{dt_id}/revisions", json=revision_data
    )

    assert_response(response, 422)
    data = response.json()
    assert "detail" in data
    assert expected in repr(data["detail"])


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "mermaid_content,expected",
    [
        (MERMAID_GRAPH_INVALID_1, "is not a valid mermaid graph"),
        (MERMAID_GRAPH_INVALID_2, "must have at least 1 end node"),
        (MERMAID_GRAPH_INVALID_3, "must have one start node"),
    ],
)
async def test_api_add_decision_tree_revision(
    client,
    async_session,
    assert_response,
    mermaid_content,
    expected,
):
    name = "test_api_add_decision_tree_revision"
    initial_data = {
        "name": name,
        "notes": "Initial revision",
    }
    response = await client.post("/decision-trees", json=initial_data)
    assert_response(response, 201)
    data = response.json()
    dt_id = data["id"]

    revision_data = {
        "mermaid_content": mermaid_content,
        "notes": "New revision",
    }
    response = await client.post(
        f"/decision-trees/{dt_id}/revisions", json=revision_data
    )
    assert_response(response, 422)
    data = response.json()
    assert "detail" in data
    assert expected in repr(data["detail"])


# write a test with that activate the decision tree by default, then deactivate it with an update
@pytest.mark.asyncio
async def test_api_activate_deactivate_decision_tree(
    client, async_session, assert_response
):
    # Create a decision tree
    name = "test_api_activate_deactivate_decision_tree"
    initial_data = {
        "name": name,
    }
    response = await client.post("/decision-trees", json=initial_data)
    assert_response(response, 201)
    data = response.json()
    dt_id = data["id"]

    # Verify that the decision tree is inactive by default
    response = await client.get(f"/decision-trees/{dt_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["enabled"] is False

    # Try to activate, it should fail as there is no revision yet
    updated_data = {
        "enabled": True,
    }
    response = await client.patch(f"/decision-trees/{dt_id}", json=updated_data)
    assert_response(response, 400)

    # Add revision
    revision_data = {
        "mermaid_content": MERMAID_GRAPH_VALID,
        "notes": "Initial revision",
    }
    response = await client.post(
        f"/decision-trees/{dt_id}/revisions", json=revision_data
    )
    assert_response(response, 201)

    # Activate the decision tree
    updated_data = {"enabled": True}
    response = await client.patch(f"/decision-trees/{dt_id}", json=updated_data)
    assert_response(response, 200)

    # Verify that the decision tree is activated
    response = await client.get(f"/decision-trees/{dt_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["enabled"] is True
