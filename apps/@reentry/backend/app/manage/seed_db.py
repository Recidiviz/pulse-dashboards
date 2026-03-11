from pathlib import Path
from uuid import uuid4

import structlog
import yaml
from sqlmodel import select

from app.core.config import settings
from app.core.db import get_session_async_manager
from app.models.ai_persona import AIPersona
from app.models.assessment_config import AssessmentConfig
from app.models.output_config import OutputConfig
from app.utils.string_utils import normalize_state_code_format

from .base import cli

logger = structlog.get_logger(__name__)

# Seed config directories (actual production-ready configs)
DATA_CONFIG_DIR = Path(__file__).parent.parent / "core" / "data_config"
SEED_ASSESSMENT_DIR = DATA_CONFIG_DIR / "seed_assessment_configs"
SEED_OUTPUT_DIR = DATA_CONFIG_DIR / "seed_output_configs"


async def seed_configs():
    """
    Seed the database with default assessment and output configs.
    Reads all YAML files from the seed config directories.
    Only inserts configs that don't already exist (by state_code/code/version).
    """
    print("Seeding default configs...")

    async with get_session_async_manager() as session:
        # Seed assessment configs
        if SEED_ASSESSMENT_DIR.exists():
            for filepath in SEED_ASSESSMENT_DIR.glob("*.yaml"):
                try:
                    yaml_content = filepath.read_text()
                    data = yaml.safe_load(yaml_content)
                    metadata = data.get("metadata", {})

                    state_code = normalize_state_code_format(
                        metadata.get("state_code", "")
                    )
                    code = metadata.get("code", "")
                    version = metadata.get("version", 0)

                    if not state_code or not code:
                        print(
                            f"  Warning: Skipping {filepath.name} - missing state_code or code"
                        )
                        continue

                    # Check if already exists
                    existing = await session.exec(
                        select(AssessmentConfig).where(
                            AssessmentConfig.state_code == state_code,
                            AssessmentConfig.code == code,
                            AssessmentConfig.version == version,
                        )
                    )
                    if existing.first():
                        print(
                            f"  Assessment config already exists: {state_code}/{code} v{version}"
                        )
                        continue

                    # Create new config
                    config = AssessmentConfig(
                        id=uuid4(),
                        state_code=state_code,
                        code=code,
                        version=version,
                        display_name=metadata.get("display_name", f"{code} Config"),
                        description=metadata.get("description"),
                        config_yaml=yaml_content,
                        status="active",
                        is_active=True,
                        created_by_email="seed@recidiviz.org",
                    )
                    session.add(config)
                    print(
                        f"  Created assessment config: {state_code}/{code} v{version}"
                    )
                except Exception as e:
                    print(f"  Error loading {filepath.name}: {e}")
        else:
            print(
                f"  Warning: Seed assessment configs directory not found: {SEED_ASSESSMENT_DIR}"
            )

        # Seed output configs
        if SEED_OUTPUT_DIR.exists():
            for filepath in SEED_OUTPUT_DIR.glob("*.yaml"):
                try:
                    yaml_content = filepath.read_text()
                    data = yaml.safe_load(yaml_content)
                    metadata = data.get("metadata", {})

                    code = metadata.get("code", "")
                    version = metadata.get("version", 0)
                    output_type = metadata.get("output_type", "intake_summary")

                    if not code:
                        print(f"  Warning: Skipping {filepath.name} - missing code")
                        continue

                    # Check if already exists
                    existing = await session.exec(
                        select(OutputConfig).where(
                            OutputConfig.code == code,
                            OutputConfig.version == version,
                        )
                    )
                    if existing.first():
                        print(f"  Output config already exists: {code} v{version}")
                        continue

                    # Create new config
                    config = OutputConfig(
                        id=uuid4(),
                        output_type=output_type,
                        code=code,
                        version=version,
                        display_name=metadata.get("display_name", f"{code} Config"),
                        description=metadata.get("description"),
                        config_yaml=yaml_content,
                        status="active",
                        is_active=True,
                        created_by_email="seed@recidiviz.org",
                    )
                    session.add(config)
                    print(f"  Created output config: {code} v{version}")
                except Exception as e:
                    print(f"  Error loading {filepath.name}: {e}")
        else:
            print(
                f"  Warning: Seed output configs directory not found: {SEED_OUTPUT_DIR}"
            )

        await session.commit()
        print("Config seeding complete.")


async def seed_db_selective():
    """
    Selective seeding that preserves user data while updating system components.
    Only updates trees and sections when content has actually changed.
    """
    print("Starting selective database seeding...")
    print("This will preserve existing intakes and plans.")

    # Seed decision trees (selective mode)
    # Import here to avoid circular import
    from .import_decision_tree import import_decision_trees_selective

    print("Seeding decision trees (selective mode)")
    app_directory = Path(__file__).parent.parent
    dt_directory = app_directory / "core" / "data_config" / "decisiontrees"
    await import_decision_trees_selective(list(dt_directory.glob("*.mermaid")))

    # Seed default configs only in local development (DEPLOY_ENV=local)
    # This prevents accidental config insertion in any GCP deployment
    # (dev, demo, staging, pilot, prod all use DEPLOY_ENV=gcp)
    if settings.DEPLOY_ENV == "local":
        await seed_configs()
    else:
        print(
            f"Skipping config seeding (DEPLOY_ENV={settings.DEPLOY_ENV}, "
            f"ENV_NAME={settings.ENV_NAME}) - only allowed in local development"
        )

    print("All user data (intakes, plans) has been preserved.")


async def seed_ai_personas():
    """
    Seed the database with default AI personas from headless_conversation_eval.py.
    Only inserts personas that don't already exist (by name).
    """
    print("Seeding AI personas...")

    async with get_session_async_manager() as session:
        # Import SAMPLE_PERSONAS from evaluation code
        from app.manage.evaluate.headless_conversation_eval import SAMPLE_PERSONAS

        for persona_data in SAMPLE_PERSONAS:
            try:
                name = persona_data.get("name")
                if not name:
                    print(f"  Warning: Skipping persona - missing name")
                    continue

                # Check if already exists
                existing = await session.exec(
                    select(AIPersona).where(AIPersona.name == name)
                )
                if existing.first():
                    print(f"  AI Persona already exists: {name}")
                    continue

                # Create new persona
                persona = AIPersona(
                    name=name,
                    age=persona_data.get("age", 30),
                    background=persona_data.get("background", "No background provided"),
                    challenges=persona_data.get(
                        "challenges", "No challenges provided"
                    ),
                    communication_style=persona_data.get(
                        "communication_style", "Direct and honest"
                    ),
                    is_active=True,
                )
                session.add(persona)
                print(f"  Created AI persona: {name}")
            except Exception as e:
                print(f"  Error creating persona {persona_data.get('name', 'unknown')}: {e}")

        await session.commit()
        print("AI persona seeding complete.")


@cli.command()
async def seed_personas():
    """
    Seed the database with default AI personas for testing.

    This command seeds AI personas from SAMPLE_PERSONAS in headless_conversation_eval.py.
    Existing personas are preserved - only missing personas are added.
    """
    await seed_ai_personas()


@cli.command()
async def seed_db():
    """
    Seed the database with system components.

    This command seeds:
    - Decision trees from mermaid files
    - Default assessment configs from seed_assessment_configs/
    - Default output configs from seed_output_configs/

    Existing data is preserved - only missing configs are added.
    """

    await seed_db_selective()
    return
