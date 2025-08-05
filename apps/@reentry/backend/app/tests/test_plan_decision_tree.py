import asyncio
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest


async def create_decision_tree(
    client, assert_response, mock_clientdata_service, decision_tree_key=None
):
    # Use client ID from mock_clientdata_service
    client_id = mock_clientdata_service["clients"][0].external_client_id
    # create a plan
    response = await client.post(
        "/plans",
        json={
            "client_id": client_id,
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    data = response.json()
    plan_id = data["id"]

    # get the first decision tree
    response = await client.get("/decision-trees")
    assert_response(response, 200)
    data = response.json()
    if decision_tree_key is None:
        # take the first one
        decision_tree_id = data["items"][0]["id"]
    else:
        # get the decision tree named "employment_substances"
        # otherwise it might execute another one that does not have statement
        decision_tree_id = None
        for item in data["items"]:
            if item["name"] == decision_tree_key:
                decision_tree_id = item["id"]
                break

        assert decision_tree_id is not None

    # manually create the decision tree
    reqdata = {"decision_tree_id": decision_tree_id}
    response = await client.post(f"/plans/{plan_id}/decisiontrees", json=reqdata)
    assert_response(response, 200)
    data = response.json()
    plan_decision_tree_id = data["id"]
    assert data["plan_id"] == plan_id
    assert data["decision_tree_id"] == decision_tree_id
    assert data["decision_tree"] is not None
    assert data["decision_tree"]["id"] == decision_tree_id
    assert data["execution_id"] is None
    assert data["status"] == "not_started"
    assert data["annotations"] is None
    assert data["run_statements"] is None
    assert data["run_steps"] is None

    return plan_id, decision_tree_id, plan_decision_tree_id


@pytest.mark.asyncio
async def test_plan_decision_tree_create(
    mock_clientdata_service,
    client,
    async_session,
    assert_response,
    seed_decision_trees,
):
    plan_id, decision_tree_id, plan_decision_tree_id = await create_decision_tree(
        client, assert_response, mock_clientdata_service
    )

    # get it manually
    response = await client.get(
        f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}"
    )
    assert_response(response, 200)
    data = response.json()
    assert data["id"] == plan_decision_tree_id
    assert data["plan_id"] == plan_id
    assert data["decision_tree_id"] == decision_tree_id
    assert data["decision_tree"] is not None
    assert data["execution_id"] is None
    assert data["status"] == "not_started"
    assert data["annotations"] is None
    assert data["run_statements"] is None
    assert data["run_steps"] is None


@pytest.mark.asyncio
async def test_plan_decision_tree_delete(
    mock_clientdata_service,
    client,
    async_session,
    assert_response,
    seed_decision_trees,
):
    plan_id, decision_tree_id, plan_decision_tree_id = await create_decision_tree(
        client, assert_response, mock_clientdata_service
    )

    # delete the created decision tree
    response = await client.delete(
        f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}"
    )
    assert_response(response, 200)

    # try to get the deleted decision tree to confirm it was removed
    response = await client.get(
        f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_plan_decision_tree_populate(
    mock_clientdata_service,
    client,
    async_session,
    assert_response,
    seed_decision_trees,
):
    from app.utils.decision_tree_runner import Annotation, DecisionTreeSelection

    # Use client ID from mock_clientdata_service
    client_id = mock_clientdata_service["clients"][0].external_client_id
    # create a plan
    response = await client.post(
        "/plans",
        json={
            "client_id": client_id,
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    data = response.json()
    plan_id = data["id"]

    response = await client.get("/decision-trees")
    assert_response(response, 200)
    data = response.json()
    decision_tree_id = data["items"][0]["id"]
    decision_tree_key = data["items"][0]["name"]

    # populate client assets
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    # check the assets is correctly uploaded
    response = await client.get(f"/plans/{plan_id}/assets")
    assert_response(response, 200)
    data = response.json()
    assert len(data["items"]) == 2

    with patch(
        "app.utils.decision_tree_runner.DecisionTreeRunner.find_decision_trees_to_applies",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = [
            DecisionTreeSelection(
                decision_tree_key=decision_tree_key,
                annotations=[
                    Annotation(
                        source="TestSource",
                        source_location="TestLocation",
                        source_text_extract="TestExtract",
                    )
                ],
            )
        ]

        response = await client.post(f"/plans/{plan_id}/decisiontrees/populate")
        assert_response(response, 200)
        data = response.json()

        # we should get an execution response
        assert data["id"] is not None
        assert data["status"] == "pending"

        # now check maximum 10 times the /executions/{execution_id}
        # until the status is completed or failed
        # otherwise fail the test
        execution_id = data["id"]
        max_attempts = 10
        for attempt in range(max_attempts):
            response = await client.get(f"/executions/{execution_id}")
            assert_response(response, 200)
            execution_data = response.json()

            if execution_data["status"] in {"completed", "failed"}:
                assert execution_data["status"] == "completed"
                break

            await asyncio.sleep(0.5)
        else:
            pytest.fail("Execution did not complete in time")

        # now check the plan decision trees
        response = await client.get(f"/plans/{plan_id}/decisiontrees")
        assert_response(response, 200)
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["decision_tree_id"] == decision_tree_id
        assert data["items"][0]["decision_tree"] is not None
        assert data["items"][0]["decision_tree"]["id"] == decision_tree_id
        assert data["items"][0]["decision_tree"]["name"] == decision_tree_key
        plan_decision_tree_id = data["items"][0]["id"]

        # check the plan decision tree
        response = await client.get(
            f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}"
        )
        assert_response(response, 200)
        data = response.json()

        # validate the details of the decision tree after execution
        assert data["id"] == plan_decision_tree_id
        assert data["plan_id"] == plan_id
        assert data["decision_tree_id"] == decision_tree_id
        assert data["decision_tree"] is not None
        assert data["decision_tree"]["id"] == decision_tree_id
        assert data["decision_tree"]["name"] == decision_tree_key
        assert data["annotations"] is not None
        assert len(data["annotations"]) > 0
        assert data["annotations"][0]["source"] == "TestSource"
        assert data["annotations"][0]["source_location"] == "TestLocation"
        assert data["annotations"][0]["source_text_extract"] == "TestExtract"


@pytest.mark.asyncio
async def test_plan_decision_tree_run(
    mock_clientdata_service,
    client,
    async_session,
    assert_response,
    seed_decision_trees,
):
    from app.utils.decision_tree_runner import (
        Annotation,
        DecisionTreeExecution,
        DecisionTreeRunner,
    )

    # Create a plan and manually associate the first decision tree
    plan_id, decision_tree_id, plan_decision_tree_id = await create_decision_tree(
        client,
        assert_response,
        mock_clientdata_service,
        decision_tree_key="employment_substances",
    )

    # populate client assets
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    # check the assets is correctly uploaded
    response = await client.get(f"/plans/{plan_id}/assets")
    assert_response(response, 200)
    data = response.json()
    assert len(data["items"]) == 2

    with patch.object(
        DecisionTreeRunner,
        "ask_decision_tree_question_llm",
        new_callable=AsyncMock,
    ) as mock_ask:
        # Set mock return value based on input
        async def ask_decision_tree_question_llm_mocked(
            question: str, possible_answers: list[str], agent: None
        ) -> DecisionTreeExecution:
            # look like possible_answers is not deterministic.
            # but we want the test to be. Let's sort it here
            possible_answers = sorted(possible_answers)

            return DecisionTreeExecution(
                answer=possible_answers[0],
                annotations=[
                    Annotation(
                        source="MockSource",
                        source_location="MockLocation",
                        source_text_extract="MockExtract",
                    )
                ],
            )

        mock_ask.side_effect = ask_decision_tree_question_llm_mocked

        # Run the created decision tree
        response = await client.post(
            f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}/run"
        )
        assert_response(response, 200)
        data = response.json()

        # We should get an execution response
        assert data["id"] is not None
        assert data["status"] == "pending"

        # Now check maximum 10 times the /executions/{execution_id}
        # until the status is completed or failed
        execution_id = data["execution_id"]
        max_attempts = 10
        for attempt in range(max_attempts):
            response = await client.get(f"/executions/{execution_id}")
            assert_response(response, 200)
            execution_data = response.json()

            if execution_data["status"] in {"completed", "failed"}:
                assert execution_data["status"] == "completed"
                break

            await asyncio.sleep(0.5)
        else:
            pytest.fail("Execution did not complete in time")

        # Check the plan decision trees
        response = await client.get(f"/plans/{plan_id}/decisiontrees")
        assert_response(response, 200)
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["decision_tree_id"] == decision_tree_id
        assert data["items"][0]["decision_tree"] is not None
        assert data["items"][0]["decision_tree"]["id"] == decision_tree_id
        assert data["items"][0]["status"] == "completed"
        assert data["items"][0]["execution_id"] == execution_id
        plan_decision_tree_id = data["items"][0]["id"]

        # Check the plan decision tree details
        response = await client.get(
            f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}"
        )
        assert_response(response, 200)
        data = response.json()
        from pprint import pprint

        pprint(data)

        # Validate the details of the decision tree after execution
        assert data["id"] == plan_decision_tree_id
        assert data["plan_id"] == plan_id
        assert data["decision_tree_id"] == decision_tree_id
        assert data["decision_tree"] is not None
        assert data["status"] == "completed"
        assert data["execution_id"] == execution_id

        # Check for steps and statements
        assert data["run_steps"] is not None
        assert len(data["run_steps"]) > 0
        assert data["run_statements"] is not None
        assert len(data["run_statements"]) > 0

        # check the first step is the node_key A / node_type start at least
        assert data["run_steps"][0]["node_key"] == "A"
        assert data["run_steps"][0]["node_type"] == "start"
        assert data["run_steps"][0]["node_value"] is not None

        # check that there is at least one statement
        assert len(data["run_statements"]) > 0
        assert "Evaluate for potential relapse triggers" in data["run_statements"][0]

        # on this decision tree, the second step is a question.
        # check the annotations
        # check that the second step has the associated question details
        assert data["run_steps"][1]["node_type"] == "question"
        assert data["run_steps"][1]["node_key"] is not None
        assert data["run_steps"][1]["node_value"] is not None

        # verify the annotations for the question step
        assert data["run_steps"][1]["annotations"] is not None
        assert len(data["run_steps"][1]["annotations"]) > 0
        assert data["run_steps"][1]["annotations"][0]["source"] == "MockSource"
        assert (
            data["run_steps"][1]["annotations"][0]["source_location"] == "MockLocation"
        )
        assert (
            data["run_steps"][1]["annotations"][0]["source_text_extract"]
            == "MockExtract"
        )


@pytest.mark.asyncio
async def test_plan_decision_tree_run_without_assets(
    mock_clientdata_service,
    client,
    async_session,
    assert_response,
    seed_decision_trees,
):
    # Create a plan and manually associate the first decision tree
    plan_id, decision_tree_id, plan_decision_tree_id = await create_decision_tree(
        client,
        assert_response,
        mock_clientdata_service,
        decision_tree_key="employment_substances",
    )

    # Intentionally skip the assets population step

    # Run the created decision tree
    response = await client.post(
        f"/plans/{plan_id}/decisiontrees/{plan_decision_tree_id}/run"
    )
    assert_response(response, 200)
    data = response.json()

    # We should get an execution response
    assert data["id"] is not None
    assert data["status"] == "pending"

    # Now check maximum 10 times the /executions/{execution_id}
    # until the status is completed or failed
    execution_data = {}
    execution_id = data["execution_id"]
    max_attempts = 10
    for attempt in range(max_attempts):
        response = await client.get(f"/executions/{execution_id}")
        assert_response(response, 200)
        execution_data = response.json()

        if execution_data["status"] in {"completed", "failed"}:
            assert execution_data["status"] == "failed"
            break

        await asyncio.sleep(0.5)
    else:
        pytest.fail("Execution did not complete in time")

    assert execution_data["status"] == "failed"
    assert "No assets found" in execution_data["message"]


@pytest.mark.asyncio
async def test_run_non_existing_decision_tree(
    mock_clientdata_service,
    client,
    async_session,
    assert_response,
    seed_decision_trees,
):
    # Create a non-existing decision tree ID
    non_existing_decision_tree_id = uuid.uuid4().hex
    plan_id, _, _ = await create_decision_tree(
        client, assert_response, mock_clientdata_service
    )

    # Attempt to run the non-existing decision tree
    response = await client.post(
        f"/plans/{plan_id}/decisiontrees/{non_existing_decision_tree_id}/run"
    )

    # Assert that the response status indicates failure due to non-existing decision tree
    assert response.status_code == 404
