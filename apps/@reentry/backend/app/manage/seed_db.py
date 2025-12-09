from pathlib import Path

from ..models.base import AssessmentType
from .base import cli
from .import_assessment_tree import (
    import_assessment_trees_selective,
)
from .import_decision_tree import import_decision_trees_selective


async def seed_db_selective():
    """
    Selective seeding that preserves user data while updating system components.
    Only updates trees and sections when content has actually changed.
    """
    print("Starting selective database seeding...")
    print("This will preserve existing intakes, assessments, and plans.")

    # Seed decision trees (selective mode)
    print("Seeding decision trees (selective mode)")
    app_directory = Path(__file__).parent.parent
    dt_directory = app_directory / "core" / "data_config" / "decisiontrees"
    await import_decision_trees_selective(list(dt_directory.glob("*.mermaid")))

    # Seed assessment trees (selective mode)
    print("Seeding assessment trees (selective mode)")

    # LSIR TREES ASSESSMENT
    at_directory = app_directory / "core" / "data_config" / "assessmenttrees" / "LSIR"
    await import_assessment_trees_selective(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.LSIR,
    )

    # ORAS TREES ASSESSMENT
    at_directory = (
        app_directory / "core" / "data_config" / "assessmenttrees" / "ORAS_PIT"
    )
    await import_assessment_trees_selective(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.ORAS_PIT,
    )

    at_directory = (
        app_directory / "core" / "data_config" / "assessmenttrees" / "ORAS_RT"
    )
    await import_assessment_trees_selective(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.ORAS_RT,
    )

    print("Selective seeding completed successfully!")
    print("All user data (intakes, assessments, plans) has been preserved.")


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
