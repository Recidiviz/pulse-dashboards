from pathlib import Path
from pprint import pprint

import structlog

from app.models.assessment import Assessment

from .base import cli

logger = structlog.get_logger(__name__)


async def _create_assessment(client_id: str):
    """
    Use the tasks to create a new assessment
    """

    from app.core.db import get_session_async_manager
    from app.crud.assessment import create_assessment

    async with get_session_async_manager() as session:
        assessment = Assessment(client_id=client_id)
        assessment = await create_assessment(session, assessment)
        await assessment.schedule_execution(session)
        await session.refresh(assessment)
        return assessment


@cli.command()
async def create_assessment(client_id: str):
    experiments_dir = (
        Path(__file__).parent.parent.parent / "experiments" / "structured_assessment"
    )
    experiments_dir.mkdir(parents=True, exist_ok=True)

    assessment = await _create_assessment(client_id)

    print("Scores: ")
    pprint(assessment.scores)
    print("Misses: ")
    pprint(assessment.misses_counts)

    counter = 1
    file_name = f"{client_id}_assessment_it{counter}.json"
    while True:
        if not (experiments_dir / file_name).exists():
            break
        counter += 1
        file_name = f"{client_id}_assessment_it{counter}.json"

    data = assessment.model_dump_json(by_alias=True)
    (experiments_dir / file_name).write_text(data)

    print(f"\nAssessment saved to {experiments_dir / file_name}\n\n")
