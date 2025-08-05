"""
Manage command to export client data from the database to JSON files
"""

import json
from pathlib import Path

from sqlmodel import select

from app.core.db import get_session_async_manager
from app.models.assessment import Assessment
from app.models.models import Plan, PlanAsset, PlanGeneration

from .base import cli


@cli.command("export-client-data")
async def export_client_data(client_id: str):
    """Export assessment and plan data for a client to JSON files"""
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)

    async with get_session_async_manager() as session:
        # Export assessment data
        print(f"Fetching assessment for {client_id}...")
        assessment_result = await session.exec(
            select(Assessment).where(Assessment.client_id == client_id)
        )
        assessment = assessment_result.first()

        if assessment:
            assessment_data = {
                "id": str(assessment.id),
                "client_id": assessment.client_id,
                "intake_id": str(assessment.intake_id),
                "scores": assessment.scores,
                "misses_counts": assessment.misses_counts,
                "runs_steps": assessment.runs_steps,
                "execution_id": str(assessment.execution_id)
                if assessment.execution_id
                else None,
                "created_at": assessment.created_at.isoformat()
                if assessment.created_at
                else None,
                "updated_at": assessment.updated_at.isoformat()
                if assessment.updated_at
                else None,
            }

            assessment_file = data_dir / f"{client_id}_assessment.json"
            with open(assessment_file, "w") as f:
                json.dump(assessment_data, f, indent=2)
            print(f"Assessment data saved to {assessment_file}")
        else:
            print(f"No assessment found for {client_id}")

        # Export plan data
        print(f"Fetching plan for {client_id}...")
        plan_result = await session.exec(
            select(Plan).where(Plan.client_id == client_id)
        )
        plan = plan_result.first()

        if plan:
            # Get plan generations
            generation_result = await session.exec(
                select(PlanGeneration).where(PlanGeneration.plan_id == plan.id)
            )
            generations = generation_result.all()

            # Get plan assets
            asset_result = await session.exec(
                select(PlanAsset).where(PlanAsset.plan_id == plan.id)
            )
            assets = asset_result.all()

            plan_data = {
                "id": str(plan.id),
                "client_id": plan.client_id,
                "type": plan.type,
                "result_gen_id": plan.result_gen_id,
                "client_extracted_info": plan.client_extracted_info,
                "create_execution_id": str(plan.create_execution_id)
                if plan.create_execution_id
                else None,
                "created_at": plan.created_at.isoformat() if plan.created_at else None,
                "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
                "generations": [
                    {
                        "id": str(gen.id),
                        "gen_type": gen.gen_type,
                        "prompt": gen.prompt,
                        "markdown_result": gen.markdown_result,
                        "execution_id": str(gen.execution_id)
                        if gen.execution_id
                        else None,
                        "created_at": gen.created_at.isoformat()
                        if gen.created_at
                        else None,
                    }
                    for gen in generations
                ],
                "assets": [
                    {
                        "id": str(asset.id),
                        "filename": asset.filename,
                        "mimetype": asset.mimetype,
                        "file_blob": asset.file_blob.decode("utf-8")
                        if asset.file_blob
                        else None,
                        "created_at": asset.created_at.isoformat()
                        if asset.created_at
                        else None,
                    }
                    for asset in assets
                ],
            }

            plan_file = data_dir / f"{client_id}_plan.json"
            with open(plan_file, "w") as f:
                json.dump(plan_data, f, indent=2)
            print(f"Plan data saved to {plan_file}")

            # Save individual assets as separate files
            for asset in assets:
                if asset.file_blob and asset.filename:
                    asset_file = data_dir / f"{client_id}_{asset.filename}"
                    with open(asset_file, "wb") as f:
                        f.write(asset.file_blob)
                    print(f"Asset saved to {asset_file}")
        else:
            print(f"No plan found for {client_id}")
