from pathlib import Path

from .base import cli
from .import_decision_tree import import_decision_trees_selective


async def seed_db_selective():
    """
    Selective seeding that preserves user data while updating system components.
    Only updates trees and sections when content has actually changed.
    """
    print("Starting selective database seeding...")
    print("This will preserve existing intakes and plans.")

    # Seed decision trees (selective mode)
    print("Seeding decision trees (selective mode)")
    app_directory = Path(__file__).parent.parent
    dt_directory = app_directory / "core" / "data_config" / "decisiontrees"
    await import_decision_trees_selective(list(dt_directory.glob("*.mermaid")))
    print("All user data (intakes, plans) has been preserved.")


@cli.command()
async def seed_db():
    """
    Seed the database with system components.

    Args:
        force: If True, drops and recreates the entire database.
               If False, uses selective seeding to preserve user data.
        wipe: If True, completely wipes the database without recreating anything.
              To populate again, deploy a service or restart an already deployed one.
    """

    await seed_db_selective()
    return
