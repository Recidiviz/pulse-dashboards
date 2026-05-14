from pathlib import Path
from uuid import uuid4

import structlog
import typer
import yaml
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

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


async def seed_configs_from_staging():
    """
    Fetch active assessment and output configs from the staging Cloud SQL DB and insert locally.
    Requires RECIDIVIZ_STAGING_INSTANCE to be set in .env and gcloud ADC configured.
    """
    from google.cloud.sql.connector import create_async_connector
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.orm import sessionmaker

    if not settings.STAGING_INSTANCE:
        raise ValueError(
            "RECIDIVIZ_STAGING_INSTANCE must be set in your .env file "
            "(e.g. recidiviz-rnd-planner:us-central1:recidiviz-staging)"
        )
    if not settings.STAGING_POSTGRES_PASSWORD:
        raise ValueError(
            "RECIDIVIZ_STAGING_POSTGRES_PASSWORD must be set in your .env file "
            "(get it from GCP Secret Manager: recidiviz-rnd-planner > postgres-password-staging)"
        )

    print(f"Connecting to staging ({settings.STAGING_INSTANCE})...")

    connector = await create_async_connector()

    async def getconn():
        return await connector.connect_async(
            settings.STAGING_INSTANCE,
            "asyncpg",
            user=settings.STAGING_POSTGRES_USER,
            password=settings.STAGING_POSTGRES_PASSWORD,
            db=settings.STAGING_DB,
        )

    staging_engine = create_async_engine("postgresql+asyncpg://", async_creator=getconn)
    staging_session_maker = sessionmaker(
        staging_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with staging_session_maker() as staging_session:
            staging_assessment_configs = (
                await staging_session.exec(
                    select(AssessmentConfig).where(AssessmentConfig.status == "active")
                )
            ).all()
            staging_output_configs = (
                await staging_session.exec(
                    select(OutputConfig).where(OutputConfig.status == "active")
                )
            ).all()
    finally:
        await staging_engine.dispose()
        await connector.close_async()

    async with get_session_async_manager() as local_session:
        for cfg in staging_assessment_configs:
            existing = await local_session.exec(
                select(AssessmentConfig).where(
                    AssessmentConfig.state_code == cfg.state_code,
                    AssessmentConfig.code == cfg.code,
                    AssessmentConfig.version == cfg.version,
                )
            )
            if existing.first():
                print(
                    f"  Assessment config already exists: {cfg.state_code}/{cfg.code} v{cfg.version}"
                )
                continue
            local_session.add(
                AssessmentConfig(
                    id=uuid4(),
                    state_code=cfg.state_code,
                    code=cfg.code,
                    version=cfg.version,
                    display_name=cfg.display_name,
                    description=cfg.description,
                    config_yaml=cfg.config_yaml,
                    status="active",
                    is_active=True,
                    created_by_email=cfg.created_by_email,
                    imported_from_env="staging",
                )
            )
            print(
                f"  Created assessment config from staging: {cfg.state_code}/{cfg.code} v{cfg.version}"
            )

        for cfg in staging_output_configs:
            existing = await local_session.exec(
                select(OutputConfig).where(
                    OutputConfig.code == cfg.code,
                    OutputConfig.version == cfg.version,
                )
            )
            if existing.first():
                print(f"  Output config already exists: {cfg.code} v{cfg.version}")
                continue
            local_session.add(
                OutputConfig(
                    id=uuid4(),
                    output_type=cfg.output_type,
                    code=cfg.code,
                    version=cfg.version,
                    display_name=cfg.display_name,
                    description=cfg.description,
                    config_yaml=cfg.config_yaml,
                    status="active",
                    is_active=True,
                    created_by_email=cfg.created_by_email,
                    imported_from_env="staging",
                )
            )
            print(f"  Created output config from staging: {cfg.code} v{cfg.version}")

        await local_session.commit()
        print("Staging config import complete.")


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
async def seed_db(
    from_staging: bool = typer.Option(
        False,
        "--from-staging",
        help="Fetch active configs from staging Cloud SQL instead of local YAML files. "
        "Requires RECIDIVIZ_STAGING_INSTANCE in .env and gcloud ADC configured.",
    ),
):
    """
    Seed the database with system components.

    This command seeds:
    - Decision trees from mermaid files
    - Default assessment configs from seed_assessment_configs/ (or staging with --from-staging)
    - Default output configs from seed_output_configs/ (or staging with --from-staging)

    Existing data is preserved - only missing configs are added.
    """
    if from_staging:
        await seed_configs_from_staging()
    else:
        await seed_db_selective()
