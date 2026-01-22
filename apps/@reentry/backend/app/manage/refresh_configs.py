"""
Refresh assessment and output configs from YAML files to database.

This command reads all assessment and output config YAML files from the data_config
directory and updates the corresponding records in the database with the file contents.
"""

from pathlib import Path

import structlog
from sqlmodel import select

from app.core.data_config.assessment_configs.loader import AssessmentFileLoader
from app.core.data_config.output_configs.loader import OutputFileLoader
from app.core.db import AsyncSession, get_session
from app.models.assessment_config import AssessmentConfig
from app.models.output_config import OutputConfig
from app.utils.string_utils import normalize_code

from .base import cli

logger = structlog.get_logger(__name__)


async def refresh_assessment_configs(session: AsyncSession) -> tuple[int, int]:
    """
    Refresh all assessment configs from YAML files.

    Returns:
        Tuple of (updated_count, skipped_count)
    """
    config_dir = (
        Path(__file__).parent.parent / "core" / "data_config" / "assessment_configs"
    )
    yaml_files = list(config_dir.glob("*.yaml"))

    updated_count = 0
    skipped_count = 0

    logger.info(f"Found {len(yaml_files)} assessment config files")

    for yaml_file in yaml_files:
        try:
            # Read and validate the YAML file
            yaml_content = AssessmentFileLoader.read_file_content(yaml_file.name)
            file_model = AssessmentFileLoader.validate_yaml_content(yaml_content)

            # Find the matching record in the database
            normalized_code = normalize_code(file_model.metadata.code)
            statement = select(AssessmentConfig).where(
                AssessmentConfig.state_code == file_model.metadata.state_code,
                AssessmentConfig.code == normalized_code,
                AssessmentConfig.version == file_model.metadata.version,
            )
            result = await session.exec(statement)
            db_config = result.first()

            if not db_config:
                logger.warning(
                    f"No database record found for {yaml_file.name}. Skipping.",
                    state_code=file_model.metadata.state_code,
                    code=file_model.metadata.code,
                    version=file_model.metadata.version,
                )
                skipped_count += 1
                continue

            # Update the config_yaml field
            db_config.config_yaml = yaml_content
            session.add(db_config)

            logger.info(
                f"Updated assessment config: {yaml_file.name}",
                state_code=file_model.metadata.state_code,
                code=file_model.metadata.code,
                version=file_model.metadata.version,
            )
            updated_count += 1

        except Exception as e:
            logger.error(
                f"Error processing {yaml_file.name}: {e}",
                error=str(e),
            )
            skipped_count += 1
            continue

    await session.commit()
    return updated_count, skipped_count


async def refresh_output_configs(session: AsyncSession) -> tuple[int, int]:
    """
    Refresh all output configs from YAML files.

    Returns:
        Tuple of (updated_count, skipped_count)
    """
    config_dir = (
        Path(__file__).parent.parent / "core" / "data_config" / "output_configs"
    )
    yaml_files = [f for f in config_dir.glob("*.yaml")]

    updated_count = 0
    skipped_count = 0

    logger.info(f"Found {len(yaml_files)} output config files")

    for yaml_file in yaml_files:
        try:
            # Read and validate the YAML file
            yaml_content = OutputFileLoader.read_file_content(yaml_file.name)
            file_model = OutputFileLoader.validate_yaml_content(yaml_content)

            # Find the matching record in the database
            normalized_code = normalize_code(file_model.metadata.code)
            statement = select(OutputConfig).where(
                OutputConfig.code == normalized_code,
                OutputConfig.version == file_model.metadata.version,
            )
            result = await session.exec(statement)
            db_config = result.first()

            if not db_config:
                logger.warning(
                    f"No database record found for {yaml_file.name}. Skipping.",
                    code=file_model.metadata.code,
                    version=file_model.metadata.version,
                )
                skipped_count += 1
                continue

            # Update the config_yaml field
            db_config.config_yaml = yaml_content
            session.add(db_config)

            logger.info(
                f"Updated output config: {yaml_file.name}",
                code=file_model.metadata.code,
                version=file_model.metadata.version,
            )
            updated_count += 1

        except Exception as e:
            logger.error(
                f"Error processing {yaml_file.name}: {e}",
                error=str(e),
            )
            skipped_count += 1
            continue

    await session.commit()
    return updated_count, skipped_count


@cli.command()
async def refresh_configs():
    """
    Refresh all assessment and output configs from YAML files to database.

    ⚠️  WARNING: This is for DEVELOPMENT ITERATION ONLY!

    Use this command ONLY when iterating on a new config version before production deployment.
    For production deployments, ALWAYS create new versions using migrations to maintain
    version immutability and proper audit trails.

    This command:
    1. Reads all YAML files from the data_config directory
    2. For each file, finds the matching database record
    3. Updates the config_yaml field with the file contents
    """
    logger.warning(
        "⚠️  Config refresh is for development iteration only. "
        "Always use migrations for production deployments!"
    )
    logger.info("Starting config refresh from YAML files...")

    async for session in get_session():
        # Refresh assessment configs
        logger.info("Refreshing assessment configs...")
        assessment_updated, assessment_skipped = await refresh_assessment_configs(
            session
        )
        logger.info(
            f"Assessment configs: {assessment_updated} updated, {assessment_skipped} skipped"
        )

        # Refresh output configs
        logger.info("Refreshing output configs...")
        output_updated, output_skipped = await refresh_output_configs(session)
        logger.info(
            f"Output configs: {output_updated} updated, {output_skipped} skipped"
        )

        # Summary
        total_updated = assessment_updated + output_updated
        total_skipped = assessment_skipped + output_skipped
        logger.info(
            f"Config refresh completed: {total_updated} total updated, {total_skipped} total skipped"
        )
