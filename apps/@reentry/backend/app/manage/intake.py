from sqlmodel import delete

from app.core.db import AsyncSession, get_session_async_manager
from app.models.intake import ClientIntakeSection, Intake, IntakeMessage

from .base import cli


@cli.command()
async def delete_intakes():
    async with get_session_async_manager() as session:
        await delete_all_intake_records(session)


async def delete_all_intake_records(session: AsyncSession):
    """
    Delete all intake records and their associated client intake section records and messages.
    """
    print("Deleting all intake records...")

    # First, delete all messages associated with intakes
    # This is necessary to maintain referential integrity
    await session.execute(delete(IntakeMessage))
    print("All intake messages deleted")

    # Then, delete all client intake section records
    await session.execute(delete(ClientIntakeSection))
    print("All client intake sections deleted")

    # Finally, delete the intakes themselves
    await session.execute(delete(Intake))
    print("All intakes deleted")

    await session.commit()

    print("All intake records and related data deleted successfully")
