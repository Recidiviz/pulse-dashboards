from typing import Literal, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.models import PlanAsset


async def create_plan_asset(session: AsyncSession, plan_asset: PlanAsset):
    session.add(plan_asset)
    await session.commit()
    await session.refresh(plan_asset)
    return plan_asset


@overload
async def get_asset_by_id(
    session: AsyncSession, asset_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[PlanAsset]: ...


@overload
async def get_asset_by_id(
    session: AsyncSession, asset_id: UUID, *, query_only: Literal[False] = False
) -> PlanAsset | None: ...


@statement_or_result(first_only=True)
async def get_asset_by_id(
    session: AsyncSession, asset_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[PlanAsset] | PlanAsset | None:
    return select(PlanAsset).where(PlanAsset.id == asset_id)


@overload
async def get_asset_by_filename(
    session: AsyncSession, plan_id: UUID, filename: str, *, query_only: Literal[True]
) -> SelectOfScalar[PlanAsset]: ...


@overload
async def get_asset_by_filename(
    session: AsyncSession,
    plan_id: UUID,
    filename: str,
    *,
    query_only: Literal[False] = False,
) -> PlanAsset | None: ...


@statement_or_result(first_only=True)
async def get_asset_by_filename(
    session: AsyncSession, plan_id: UUID, filename: str, *, query_only: bool = False
) -> SelectOfScalar[PlanAsset] | PlanAsset | None:
    return select(PlanAsset).where(
        PlanAsset.plan_id == plan_id,
        PlanAsset.filename == filename,
    )


@overload
async def get_assets_by_plan_id(
    session: AsyncSession, plan_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[PlanAsset]: ...


@overload
async def get_assets_by_plan_id(
    session: AsyncSession, plan_id: UUID, *, query_only: Literal[False] = False
) -> list[PlanAsset]: ...


@statement_or_result(result_type=list)
async def get_assets_by_plan_id(
    session: AsyncSession, plan_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[PlanAsset] | list[PlanAsset]:
    return select(PlanAsset).where(PlanAsset.plan_id == plan_id)


async def delete_asset_by_id(session: AsyncSession, asset_id: UUID):
    asset = await get_asset_by_id(session, asset_id)
    if not asset:
        return False
    await session.delete(asset)
    await session.commit()
    return True
