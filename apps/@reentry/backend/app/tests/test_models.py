import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Plan, PlanAsset, PlanGeneration


@pytest.mark.asyncio
async def test_create_plan(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    result = await async_session.get(Plan, new_plan.id)
    assert result is not None
    assert result.client_pseudo_id == "client_1"


@pytest.mark.asyncio
async def test_create_plan_asset(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    new_asset = PlanAsset(
        plan_id=new_plan.id,
        client_pseudo_id="client_1",
        filename="example.png",
        file_blob=b"fake_data",
        mimetype="image/png",
    )
    async_session.add(new_asset)
    await async_session.commit()

    result = await async_session.get(PlanAsset, new_asset.id)
    assert result is not None
    assert result.filename == "example.png"
    assert result.mimetype == "image/png"
    assert result.file_blob == b"fake_data"
    assert result.plan_id == new_plan.id


@pytest.mark.asyncio
async def test_create_plan_generation(async_session: AsyncSession):
    new_plan = Plan(client_pseudo_id="client_1")
    async_session.add(new_plan)
    await async_session.commit()

    new_generation = PlanGeneration(
        plan_id=new_plan.id,
        prompt="Test prompt",
        markdown_result="**Test result**",
    )
    async_session.add(new_generation)
    await async_session.commit()

    result = await async_session.get(PlanGeneration, new_generation.id)
    assert result is not None
    assert result.status == "not_started"
    assert result.prompt == "Test prompt"
    assert result.markdown_result == "**Test result**"
    assert result.plan_id == new_plan.id
