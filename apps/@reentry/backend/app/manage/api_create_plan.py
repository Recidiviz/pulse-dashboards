import asyncio

import httpx
import structlog

from .base import cli

logger = structlog.get_logger(__name__)


async def get_plan_by_client_id(
    client: httpx.AsyncClient, client_id: str
) -> dict | None:
    logger.info("Fetching plan for client", client_id=client_id)
    response = await client.get(f"/plans/by_client/{client_id}")
    if response.status_code == 404:
        return None
    assert response.status_code == 200
    plan = response.json()
    return plan


async def create_plan(client: httpx.AsyncClient, client_id: str) -> dict:
    logger.info("Creating plan for client", client_id=client_id)
    response = await client.post("/plans", json={"client_id": client_id})
    assert response.status_code == 200
    plan = response.json()
    return plan


async def regen_plan(
    client: httpx.AsyncClient, plan_id: str, prompt: str | None = None
) -> dict:
    logger.info("Regenerating plan", plan_id=plan_id)
    response = await client.post(f"/plans/{plan_id}/generate", json={"prompt": prompt})
    assert response.status_code == 200
    gen = response.json()
    return gen


async def delete_plan(client: httpx.AsyncClient, plan_id: str):
    logger.info("Deleting plan", plan_id=plan_id)
    response = await client.delete(f"/plans/{plan_id}")
    assert response.status_code == 200


@cli.command()
async def api_create_plan(
    client_id: str,
    force: bool = False,
    regen: bool = False,
    prompt: str | None = None,
):
    """
    Use the API to create the initial plan
    """

    # implement with baseurl as http://localhost:8000/
    async with httpx.AsyncClient(base_url="http://localhost:8000/") as client:
        # check if a plan already exists
        plan = await get_plan_by_client_id(client, client_id=client_id)
        if plan:
            logger.info("Plan already exists", plan_id=plan["id"])
            if not regen:
                if not force:
                    logger.error("Plan already exists, use --force to recreate")
                    return
                else:
                    logger.info("Deleting the existing plan", plan_id=plan["id"])
                    await delete_plan(client, plan["id"])

        # create plan
        if regen:
            if not plan:
                logger.error("No plan found, create a new plan instead of regenerating")
                return
            gen = await regen_plan(client, plan_id=plan["id"], prompt=prompt)
            logger.info("Regenerating the plan", plan_id=plan["id"], gen_id=gen["id"])
            execution_id = gen["execution_id"]
        else:
            plan = await create_plan(client, client_id=client_id)
            logger.info("Plan created", plan_id=plan["id"])
            execution_id = plan["create_execution_id"]

        # monitor the execution
        logger.info("Monitoring the execution", execution_id=execution_id)
        last_key = None
        while True:
            response = await client.get(f"/executions/{execution_id}")
            execution = response.json()
            status = execution["status"]
            message = execution.get("message")
            progress = execution.get("progress")
            key = (status, message, progress)
            if key != last_key:
                logger.debug(message, status=status, progress=progress)
                last_key = key
            if execution["status"] in ("completed", "failed"):
                break
            await asyncio.sleep(1)

        # get the plan
        plan = await get_plan_by_client_id(client, client_id=client_id)
        if plan:
            print(plan["latest_generation"]["markdown_result"])
