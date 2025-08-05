import pytest
from httpx import AsyncClient

MERMAID_GRAPH_VALID = """
graph TD
    A[Start: hello]
    A --> B{is it?}
    B --> B1[yes]
    B --> B2[no]
    B1 & B2 --> C[End: goodbye]
"""


@pytest.mark.asyncio
async def test_get_assessment_trees_list_empty(client: AsyncClient, async_session):
    response = await client.get("/assessment-trees")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []


@pytest.mark.asyncio
async def test_create_and_get_assessment_tree(client: AsyncClient, async_session):
    # Create assessment tree
    response = await client.post(
        "/assessment-trees", json={"name": "test_assessment_tree"}
    )
    assert response.status_code == 201
    data = response.json()
    assessment_tree_id = data["id"]

    # Get the created assessment tree
    response = await client.get(f"/assessment-trees/{assessment_tree_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test_assessment_tree"
    assert data["revisions"] == []


@pytest.mark.asyncio
async def test_create_assessment_tree_revision(client: AsyncClient, async_session):
    # Create assessment tree
    response = await client.post(
        "/assessment-trees", json={"name": "test_revision_tree"}
    )
    assert response.status_code == 201
    assessment_tree_id = response.json()["id"]

    # Add revision
    response = await client.post(
        f"/assessment-trees/{assessment_tree_id}/revisions",
        json={
            "mermaid_content": MERMAID_GRAPH_VALID,
            "additional_structured_data": {"key": "value"},
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["mermaid_content"] == MERMAID_GRAPH_VALID

    # Get assessment tree with revisions
    response = await client.get(f"/assessment-trees/{assessment_tree_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["revisions"]) == 1


@pytest.mark.asyncio
async def test_update_assessment_tree(client: AsyncClient, async_session):
    # Create assessment tree
    response = await client.post("/assessment-trees", json={"name": "old_name"})
    assert response.status_code == 201
    assessment_tree_id = response.json()["id"]

    # Update assessment tree
    response = await client.patch(
        f"/assessment-trees/{assessment_tree_id}", json={"name": "new_name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "new_name"


@pytest.mark.asyncio
async def test_delete_assessment_tree(client: AsyncClient, async_session):
    # Create assessment tree
    response = await client.post("/assessment-trees", json={"name": "to_delete"})
    assert response.status_code == 201
    assessment_tree_id = response.json()["id"]

    # Delete assessment tree
    response = await client.delete(f"/assessment-trees/{assessment_tree_id}")
    assert response.status_code == 204

    # Try to get the deleted assessment tree
    response = await client.get(f"/assessment-trees/{assessment_tree_id}")
    assert response.status_code == 404
