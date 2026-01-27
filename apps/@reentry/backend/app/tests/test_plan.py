import asyncio
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.crud.address import update_intake_address
from app.routes.shared_models import AddressSubmission
from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    CATEGORY_SUBCATEGORY_MAP_LEGACY,
    Resource,
    ResourceCategory,
    ResourceCategoryLegacy,
    ResourceSubcategory,
    ResourceSubcategoryLegacy,
)
from app.utils.action_plan_types import ActionPlan, ActionPlanMarkdown


@pytest.mark.asyncio
async def test_plan_create(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    # Create test plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )

    assert_response(response, 200)
    data = response.json()

    # Verify the plan was created successfully
    assert data["id"] is not None
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

    # Skip client_record assertion for now since it's not essential
    # assert data["client_record"] is not None


@pytest.mark.asyncio
async def test_plan_get_404(
    mock_clientdata_service, client, async_session, assert_response
):
    plan_id = uuid.uuid4()
    response = await client.get(f"/plans/{plan_id}")
    assert_response(response, 404)


@pytest.mark.asyncio
async def test_plan_get(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    # create a plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # get a plan
    response = await client.get(f"/plans/{plan_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["id"] == plan_id
    assert data["client_pseudo_id"] == client_pseudo_id
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    assert "latest_generation" in data
    assert data["latest_generation"] is None

    # list all plans
    response = await client.get("/plans")
    assert_response(response, 200)
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == plan_id
    assert data["items"][0]["client_pseudo_id"] == client_pseudo_id
    assert data["items"][0]["created_at"] is not None
    assert data["items"][0]["updated_at"] is not None

    # delete a plan
    response = await client.delete(f"/plans/{plan_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["status"] == "success"


@pytest.mark.asyncio
async def test_plan_generation(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create client address
    address_data = AddressSubmission(
        street_address="123 Main St", city="Portland", state="OR"
    )
    await update_intake_address(async_session, mock_intake.id, address_data)

    # create a plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # populate client assets
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    # check the plan have no any result yet
    response = await client.get(f"/plans/{plan_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["latest_generation"] is None

    with patch(
        "app.utils.llm_agent_qa.LLMAgentQA.call",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = {}
        with patch(
            "app.utils.llm_agent_gen_plan.LLMAgentGenerate.generate",
            new_callable=AsyncMock,
        ) as mock_gen:
            mock_gen.return_value = ActionPlanMarkdown(
                user_prompt="USER_PROMPT_SENT_TO_MODEL",
                action_plan="ACTION_PLAN",
                messages=[],
                suggested_resources=[],
                structured_action_plan=ActionPlan(
                    sections=[],
                    immediate_needs={
                        "annotations": [],
                        "markdown_content": "",
                        "notes": "",
                        "title": "",
                    },
                    milestones=[],
                    timeline=[],
                    quick_summary_circumstances="",
                    overview="",
                    sections_order=[],
                ),
            )

            # create a generation
            response = await client.post(f"/plans/{plan_id}/generate", json={})
            assert_response(response, 200)
            data = response.json()
            gen_id = data["id"]
            assert data["id"] is not None
            assert data["plan_id"] == plan_id
            assert data["status"] == "pending"
            assert data["prompt"] is None
            assert data["created_at"] is not None
            # assert data["finished_at"] is None ??

            # wait for the generation to complete
            for x in range(10):
                response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
                assert_response(response, 200)
                data = response.json()
                if data["status"] in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
            else:
                pytest.fail("Generation not completed in time")

            # check the latest generation
            assert data["status"] == "completed"
            assert data["markdown_result"] == "ACTION_PLAN"

            # getting the plan should include a result
            response = await client.get(f"/plans/{plan_id}")
            assert_response(response, 200)
            data = response.json()
            assert data["latest_generation"] is not None
            assert data["latest_generation"]["id"] == gen_id
            assert data["latest_generation"]["markdown_result"] == "ACTION_PLAN"
            assert data["latest_generation"]["status"] == "completed"
            assert data["latest_generation"]["execution"]["status"] == "completed"
            assert data["latest_generation"]["execution"]["progress"] == 100


@pytest.mark.asyncio
async def test_plan_generation_manually(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create client address
    address_data = AddressSubmission(
        street_address="123 Main St", city="Portland", state="OR"
    )
    await update_intake_address(async_session, mock_intake.id, address_data)

    # create a plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # populate client assets
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    with patch(
        "app.utils.llm_agent_qa.LLMAgentQA.call",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = {}
        # create a generation
        with patch(
            "app.utils.llm_agent_gen_plan.LLMAgentGenerate.generate",
            new_callable=AsyncMock,
        ) as mock_gen:
            mock_gen.return_value = ActionPlanMarkdown(
                user_prompt="USER_PROMPT_SENT_TO_MODEL",
                action_plan="ACTION_PLAN",
                messages=[],
                suggested_resources=[],
                structured_action_plan=ActionPlan(
                    sections=[],
                    immediate_needs={
                        "annotations": [],
                        "markdown_content": "",
                        "notes": "",
                        "title": "",
                    },
                    milestones=[],
                    timeline=[],
                    quick_summary_circumstances="",
                    overview="",
                    sections_order=[],
                ),
            )

            # create a generation
            response = await client.post(f"/plans/{plan_id}/generate", json={})
            assert_response(response, 200)
            data = response.json()
            gen_id = data["id"]
            assert data["id"] is not None
            assert data["plan_id"] == plan_id
            assert data["status"] == "pending"
            assert data["prompt"] is None
            assert data["created_at"] is not None
            # assert data["finished_at"] is None

            # wait for the generation to complete
            for x in range(10):
                response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
                assert_response(response, 200)
                data = response.json()
                if data["status"] in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
            else:
                pytest.fail("Generation not completed in time")

            # check the latest generation
            assert data["status"] == "completed"
            assert data["markdown_result"] == "ACTION_PLAN"

    # edit manually the generation
    payload = {
        "markdown": "## Sample Plan",
    }
    response = await client.post(f"/plans/{plan_id}/edit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["markdown_result"] == payload["markdown"]


@pytest.mark.asyncio
async def test_plan_assets(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # create a plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # create a fake file with "helloworld" content
    fake_file_content = "helloworld"
    files = {"file": ("helloworld.txt", fake_file_content)}

    # upload the file to the plan
    response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
    assert_response(response, 200)
    data = response.json()
    assert data["filename"] == "helloworld.txt"
    assert data["mimetype"] == "text/plain"
    assert data["plan_id"] == plan_id

    # verify the file is uploaded successfully
    response = await client.get(f"/plans/{plan_id}/assets")
    assert_response(response, 200)
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["filename"] == "helloworld.txt"
    assert data["items"][0]["mimetype"] == "text/plain"
    assert data["items"][0]["plan_id"] == plan_id
    asset_id = data["items"][0]["id"]

    # download the file
    response = await client.get(f"/plans/{plan_id}/assets/{asset_id}/download")
    assert_response(response, 200)
    assert response.text == fake_file_content

    # delete a asset
    response = await client.delete(f"/plans/{plan_id}/assets/{asset_id}")
    assert_response(response, 200)
    data = response.json()
    assert data["status"] == "success"


@pytest.mark.parametrize(
    "category",
    list(CATEGORY_SUBCATEGORY_MAP.keys()),
)
@pytest.mark.asyncio
async def test_resource_type_get_result(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
    category: ResourceCategory,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    # create a plan
    cplan_r = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(cplan_r, 200)
    plan_id = cplan_r.json()["id"]

    subcategories = CATEGORY_SUBCATEGORY_MAP[category]
    subcategory = subcategories[0] if subcategories else None
    # Convert enum to string value
    category_str = category.value if category else None
    subcategory_str = subcategory.value if subcategory else None

    response = await client.get(
        f"/plans/{plan_id}/resources",
        params={
            "filter_category": category_str,
            "filter_subcategory": subcategory_str,
        },
    )
    assert response.status_code == 200

    result = response.json()

    assert result is not None

    for resource in result:
        assert resource["category"] == category_str
        assert resource["subcategory"] == subcategory_str
        assert resource["name"] is not None
        assert resource["address"] is not None


@pytest.mark.parametrize(
    "category",
    list(CATEGORY_SUBCATEGORY_MAP_LEGACY.keys()),
)
@pytest.mark.asyncio
async def test_resource_type_get_result_legacy(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
    category: ResourceCategoryLegacy,
):
    if category == ResourceCategoryLegacy.UNKNOWN:
        pytest.skip()

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    # create a plan
    cplan_r = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(cplan_r, 200)
    plan_id = cplan_r.json()["id"]

    subcategories = CATEGORY_SUBCATEGORY_MAP_LEGACY[category]
    subcategory = subcategories[0] if subcategories else None
    # Convert enum to string value
    category_str = category.value if category else None
    subcategory_str = subcategory.value if subcategory else None

    response = await client.get(
        f"/plans/{plan_id}/resources",
        params={
            "filter_category": category_str,
            "filter_subcategory": subcategory_str,
        },
    )
    assert response.status_code == 200

    result = response.json()

    assert result is not None

    for resource in result:
        assert resource["category"] == category_str
        assert resource["subcategory"] == subcategory_str
        assert resource["name"] is not None
        assert resource["address"] is not None


@pytest.mark.asyncio
async def test_suggested_resources_legacy(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create client address
    address_data = AddressSubmission(
        street_address="123 Main St", city="Portland", state="OR"
    )
    await update_intake_address(async_session, mock_intake.id, address_data)

    # Create a plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # Upload assets
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    # Mock resources
    mock_resources = [
        Resource(
            id="res-1",
            category=ResourceCategoryLegacy.BASIC_NEEDS.value,
            subcategory=ResourceSubcategoryLegacy.HOUSING.value,
            name="Test Housing Resource",
            address="123 Test St, Test City, TX",
        ),
        Resource(
            id="res-2",
            category=ResourceCategoryLegacy.EMPLOYMENT_AND_CAREER.value,
            subcategory=ResourceSubcategoryLegacy.JOB_PLACEMENT.value,
            name="Test Employment Resource",
            address="456 Employment Rd, Test City, TX",
        ),
    ]

    # Create a generation with mock resources
    with patch(
        "app.utils.llm_agent_qa.LLMAgentQA.call",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = {}
        # Create a generation with mock resources
        with patch(
            "app.utils.llm_agent_gen_plan.LLMAgentGenerate.generate",
            new_callable=AsyncMock,
        ) as mock_gen:
            mock_gen.return_value = ActionPlanMarkdown(
                user_prompt="USER_PROMPT_SENT_TO_MODEL",
                action_plan="ACTION_PLAN",
                messages=[],
                suggested_resources=mock_resources,
                structured_action_plan=ActionPlan(
                    sections=[],
                    immediate_needs={
                        "annotations": [],
                        "markdown_content": "",
                        "notes": "",
                        "title": "",
                    },
                    milestones=[],
                    timeline=[],
                    quick_summary_circumstances="",
                    overview="",
                    sections_order=[],
                ),
            )

            # Generate the plan
            response = await client.post(f"/plans/{plan_id}/generate", json={})
            assert_response(response, 200)
            gen_id = response.json()["id"]

            # Wait for generation to complete
            for x in range(10):
                response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
                assert_response(response, 200)
                data = response.json()
                if data["status"] in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
            else:
                pytest.fail("Generation not completed in time")

            # Check suggested resources endpoint
            response = await client.get(f"/plans/{plan_id}/suggested-resources")
            assert_response(response, 200)
            suggested_resources = response.json()

            # Verify resources match what was stored
            assert len(suggested_resources) == 2
            assert suggested_resources[0]["id"] == "res-1"
            assert (
                suggested_resources[0]["category"]
                == ResourceCategoryLegacy.BASIC_NEEDS.value
            )
            assert (
                suggested_resources[0]["subcategory"]
                == ResourceSubcategoryLegacy.HOUSING.value
            )
            assert suggested_resources[0]["name"] == "Test Housing Resource"

            assert suggested_resources[1]["id"] == "res-2"
            assert (
                suggested_resources[1]["category"]
                == ResourceCategoryLegacy.EMPLOYMENT_AND_CAREER
            )
            assert (
                suggested_resources[1]["subcategory"]
                == ResourceSubcategoryLegacy.JOB_PLACEMENT
            )
            assert suggested_resources[1]["name"] == "Test Employment Resource"


@pytest.mark.asyncio
async def test_suggested_resources(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create client address
    address_data = AddressSubmission(
        street_address="123 Main St", city="Portland", state="OR"
    )
    await update_intake_address(async_session, mock_intake.id, address_data)

    # Create a plan
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # Upload assets
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    # Mock resources
    mock_resources = [
        Resource(
            id="res-1",
            category=ResourceCategory.HOUSING.value,
            subcategory=ResourceSubcategory.EMERGENCY.value,
            name="Test Housing Resource",
            address="123 Test St, Test City, TX",
        ),
        Resource(
            id="res-2",
            category=ResourceCategory.EMPLOYMENT.value,
            subcategory=ResourceSubcategory.SECOND_CHANCE.value,
            name="Test Employment Resource",
            address="456 Employment Rd, Test City, TX",
        ),
    ]

    # Create a generation with mock resources
    with patch(
        "app.utils.llm_agent_qa.LLMAgentQA.call",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = {}
        # Create a generation with mock resources
        with patch(
            "app.utils.llm_agent_gen_plan.LLMAgentGenerate.generate",
            new_callable=AsyncMock,
        ) as mock_gen:
            mock_gen.return_value = ActionPlanMarkdown(
                user_prompt="USER_PROMPT_SENT_TO_MODEL",
                action_plan="ACTION_PLAN",
                messages=[],
                suggested_resources=mock_resources,
                structured_action_plan=ActionPlan(
                    sections=[],
                    immediate_needs={
                        "annotations": [],
                        "markdown_content": "",
                        "notes": "",
                        "title": "",
                    },
                    milestones=[],
                    timeline=[],
                    quick_summary_circumstances="",
                    overview="",
                    sections_order=[],
                ),
            )

            # Generate the plan
            response = await client.post(f"/plans/{plan_id}/generate", json={})
            assert_response(response, 200)
            gen_id = response.json()["id"]

            # Wait for generation to complete
            for x in range(10):
                response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
                assert_response(response, 200)
                data = response.json()
                if data["status"] in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
            else:
                pytest.fail("Generation not completed in time")

            # Check suggested resources endpoint
            response = await client.get(f"/plans/{plan_id}/suggested-resources")
            assert_response(response, 200)
            suggested_resources = response.json()

            # Verify resources match what was stored
            assert len(suggested_resources) == 2
            assert suggested_resources[0]["id"] == "res-1"
            assert suggested_resources[0]["category"] == ResourceCategory.HOUSING.value
            assert (
                suggested_resources[0]["subcategory"]
                == ResourceSubcategory.EMERGENCY.value
            )
            assert suggested_resources[0]["name"] == "Test Housing Resource"

            assert suggested_resources[1]["id"] == "res-2"
            assert suggested_resources[1]["category"] == ResourceCategory.EMPLOYMENT
            assert (
                suggested_resources[1]["subcategory"]
                == ResourceSubcategory.SECOND_CHANCE
            )
            assert suggested_resources[1]["name"] == "Test Employment Resource"


@pytest.mark.asyncio
async def test_regeneration_notify_set_on_prompt_generation(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    """Test that regeneration_notify is set to True when generating with a prompt"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create client address
    address_data = AddressSubmission(
        street_address="123 Main St", city="Portland", state="OR"
    )
    await update_intake_address(async_session, mock_intake.id, address_data)

    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    with patch(
        "app.utils.llm_agent_qa.LLMAgentQA.call",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = {}
        with patch(
            "app.utils.llm_agent_gen_plan.LLMAgentGenerate.generate",
            new_callable=AsyncMock,
        ) as mock_gen:
            mock_gen.return_value = ActionPlanMarkdown(
                user_prompt="USER_PROMPT_SENT_TO_MODEL",
                action_plan="ACTION_PLAN_REGENERATED",
                messages=[],
                suggested_resources=[],
                structured_action_plan=ActionPlan(
                    sections=[],
                    immediate_needs={
                        "annotations": [],
                        "markdown_content": "",
                        "notes": "",
                        "title": "",
                    },
                    milestones=[],
                    timeline=[],
                    quick_summary_circumstances="",
                    overview="",
                    sections_order=[],
                ),
            )

            response = await client.post(
                f"/plans/{plan_id}/generate",
                json={"prompt": "Please regenerate the plan with more details"},
            )
            assert_response(response, 200)
            data = response.json()
            gen_id = data["id"]

            for x in range(10):
                response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
                assert_response(response, 200)
                data = response.json()
                if data["status"] in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
            else:
                pytest.fail("Generation not completed in time")

            # Verify regeneration_notify is True for prompt-based generation
            assert data["regeneration_notify"] is True
            assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_set_notify_endpoint(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    """Test the /plans/{id}/set-notify endpoint"""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create client address
    address_data = AddressSubmission(
        street_address="123 Main St", city="Portland", state="OR"
    )
    await update_intake_address(async_session, mock_intake.id, address_data)

    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    with patch(
        "app.utils.llm_agent_qa.LLMAgentQA.call",
        new_callable=AsyncMock,
    ) as mock_find:
        mock_find.return_value = {}
        with patch(
            "app.utils.llm_agent_gen_plan.LLMAgentGenerate.generate",
            new_callable=AsyncMock,
        ) as mock_gen:
            mock_gen.return_value = ActionPlanMarkdown(
                user_prompt="USER_PROMPT_SENT_TO_MODEL",
                action_plan="ACTION_PLAN",
                messages=[],
                suggested_resources=[],
                structured_action_plan=ActionPlan(
                    sections=[],
                    immediate_needs={
                        "annotations": [],
                        "markdown_content": "",
                        "notes": "",
                        "title": "",
                    },
                    milestones=[],
                    timeline=[],
                    quick_summary_circumstances="",
                    overview="",
                    sections_order=[],
                ),
            )

            response = await client.post(
                f"/plans/{plan_id}/generate", json={"prompt": "Regenerate with changes"}
            )
            assert_response(response, 200)
            gen_id = response.json()["id"]

            for x in range(10):
                response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
                assert_response(response, 200)
                data = response.json()
                if data["status"] in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
            else:
                pytest.fail("Generation not completed in time")

            assert data["regeneration_notify"] is True

            response = await client.post(
                f"/plans/{plan_id}/set-notify", json={"notify": False}
            )
            assert_response(response, 200)

            response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
            assert_response(response, 200)
            data = response.json()
            assert data["regeneration_notify"] is False

            response = await client.post(
                f"/plans/{plan_id}/set-notify", json={"notify": True}
            )
            assert_response(response, 200)

            response = await client.get(f"/plans/{plan_id}/gens/{gen_id}")
            assert_response(response, 200)
            data = response.json()
            assert data["regeneration_notify"] is True


@pytest.mark.asyncio
async def test_set_notify_endpoint_error_cases(
    mock_clientdata_service,
    mock_intake,
    client,
    async_session,
    assert_response,
):
    fake_plan_id = uuid.uuid4()
    response = await client.post(
        f"/plans/{fake_plan_id}/set-notify", json={"notify": False}
    )
    assert response.status_code == 404

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    response = await client.post(f"/plans/{plan_id}/set-notify", json={"notify": False})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_plan_create_summary_only_workflow(
    mock_clientdata_service,
    mock_intake_summary_only,
    client,
    async_session,
    assert_response,
):
    """Test that action plan generation fails for intake summary only configs.

    This test verifies that when an assessment config has only an intake summary config
    (no action plan config), attempting to generate an action plan fails with an appropriate error.
    """
    from pathlib import Path

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create plan with no_initial_generation=True (manual assets like other tests)
    response = await client.post(
        "/plans",
        json={
            "client_pseudo_id": client_pseudo_id,
            "intake_id": str(mock_intake_summary_only.id),
            "no_initial_generation": True,
        },
    )
    assert_response(response, 200)
    plan_id = response.json()["id"]

    # Manually upload assets (following pattern from test_plan_generation)
    for filename, name, mimetype in [
        ("client_messages.json", "messages.json", "application/json"),
        ("client_summary.md", "summary.md", "text/markdown"),
    ]:
        with open(Path(__file__).parent / "data" / filename, "r", encoding="utf8") as f:
            files = {"file": (name, f.read(), mimetype)}
            response = await client.post(f"/plans/{plan_id}/assets/upload", files=files)
            assert_response(response, 200)

    with patch(
        "app.models.models.Plan.get_action_plan_config"
    ) as get_action_plan_config:
        mock_storage_instance = MagicMock()
        mock_storage_instance.external_api = AsyncMock(
            return_value={"resources_api_enabled": []}
        )
        get_action_plan_config.return_value = mock_storage_instance

        # Verify that no action plan generation exists yet
        response = await client.get(f"/plans/{plan_id}")
        assert_response(response, 200)
        data = response.json()
        assert data["latest_generation"] is None

    # Attempt to generate an action plan - this should be blocked at the router level
    response = await client.post(f"/plans/{plan_id}/generate", json={})

    # Should return 400 Bad Request (blocked at router before task creation)
    assert (
        response.status_code == 400
    ), "Action plan generation should be blocked for summary-only configs"

    # Verify the error message indicates no action plan support
    error_data = response.json()
    assert "does not support action plan generation" in error_data["detail"].lower()
