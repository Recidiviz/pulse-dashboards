from typing import Dict, Optional
from uuid import UUID

import structlog
from sqlmodel import func, select

from app.core.data_config.assessment_configs.assessment_config import (
    AssessmentConfigFile,
    IntakeConfigConversation,
)
from app.core.data_config.assessment_configs.loader import AssessmentFileLoader
from app.core.data_config.output_configs.loader import OutputFileLoader
from app.core.data_config.output_configs.output_config import (
    ActionPlanConfigFile,
    IntakeSummaryConfigFile,
)
from app.core.db import AsyncSession
from app.crud.config_management import get_active_output_config
from app.models.assessment_config import AssessmentConfig
from app.utils.state_code import normalize_state_code

logger = structlog.get_logger(__name__)
# Module-level caches (shared across application)
_assessment_cache: Dict[UUID, AssessmentConfigFile] = {}


class ConfigLoader:
    """Loads and caches assessment and output configs from database."""

    @classmethod
    def invalidate_assessment_cache(cls) -> None:
        """Invalidate the assessment config cache.

        Must be called whenever an assessment config is activated or deactivated,
        because the assessment config content may have changed.

        Note: Summary and plan output configs are always loaded fresh from the
        database (no caching) so they don't need explicit invalidation.
        """
        _assessment_cache.clear()
        logger.info(
            "Assessment config cache invalidated",
            assessment_cache_cleared=True,
        )

    @classmethod
    async def load_assessment_config(
        cls, config_id: UUID, session: AsyncSession
    ) -> AssessmentConfigFile:
        """Load and validate assessment config from database by UUID.

        Args:
            config_id: UUID of the assessment config
            session: Database session

        Returns:
            Validated AssessmentConfigFile pydantic model

        Raises:
            ValueError: If config_id not found in database
        """
        # Check cache first
        if config_id in _assessment_cache:
            logger.debug(f"Assessment config cache hit: {config_id}")
            return _assessment_cache[config_id]

        # Query database
        config = await session.get(AssessmentConfig, config_id)
        if not config:
            raise ValueError(f"Assessment config not found: {config_id}")

        # Validate and parse YAML content
        try:
            validated = AssessmentFileLoader.validate_yaml_content(config.config_yaml)
            logger.info(
                f"Loaded assessment config: {config.state_code}/{config.code} v{config.version} ({config_id})"
            )
        except Exception as e:
            logger.error(f"Failed to validate assessment config {config_id}: {e}")
            raise

        # Cache and return
        _assessment_cache[config_id] = validated
        return validated

    @classmethod
    async def list_assessment_configs(
        cls, state_code: str, session: AsyncSession
    ) -> list[AssessmentConfig]:
        """List all assessment configs for a given state code.

        Args:
            state_code: State code to filter by (e.g., "US_UT")
            session: Database session

        Returns:
            List of AssessmentConfig database models (not validated pydantic files)
        """
        statement = select(AssessmentConfig).where(
            AssessmentConfig.state_code == state_code
        )
        result = await session.exec(statement)
        configs = result.all()
        logger.debug(f"Listed {len(configs)} assessment configs for {state_code}")
        return list(configs)

    @classmethod
    async def get_active_assessment_config(
        cls, state_code: str, code: str, session: AsyncSession
    ) -> Optional[AssessmentConfig]:
        """Get the active assessment config for a given state and code.

        This is the recommended method to use when creating a new intake,
        as it returns the currently active config version.

        Args:
            state_code: State code (e.g., "US_UT")
            code: Assessment code (e.g., "CCCI", "ccci" - will be normalized)
            session: Database session

        Returns:
            Active AssessmentConfig database model, or None if not found

        Example:
            >>> config = await ConfigLoader.get_active_assessment_config(
            ...     state_code="US_UT",
            ...     code="CCCI",
            ...     session=session
            ... )
            >>> if config:
            ...     intake = Intake(assessment_config_id=config.id)
        """
        state_code = normalize_state_code(state_code)

        # Query for active config, ordered by version desc as a safety net
        # in case multiple configs are accidentally active for the same code
        statement = (
            select(AssessmentConfig)
            .where(normalize_state_code(AssessmentConfig.state_code) == state_code)
            .where(AssessmentConfig.code == code)
            .where(AssessmentConfig.is_active)
            .order_by(AssessmentConfig.version.desc())
        )
        result = await session.exec(statement)
        config = result.first()

        if config:
            logger.debug(
                f"Found active assessment config: {state_code}/{code} v{config.version}"
            )
        else:
            logger.warning(f"No active assessment config found for {state_code}/{code}")

        return config

    @classmethod
    async def load_conversation_config(
        cls, assessment_config_id, session
    ) -> IntakeConfigConversation:
        assessment_config = await cls.load_assessment_config(
            assessment_config_id, session
        )
        logger.info(
            f"Loaded assessment config: {assessment_config.metadata.state_code}/{assessment_config.metadata.code} v{assessment_config.metadata.version}"
        )
        if not isinstance(assessment_config.intake, IntakeConfigConversation):
            raise ValueError("Wrong conversation type in intake conversation graph")
        return assessment_config.intake

    @classmethod
    async def get_active_assessment_configs_by_state(
        cls, state_code: str, session: AsyncSession
    ) -> list[AssessmentConfig]:
        """Get all active assessment configs for a given state.

        Returns one active assessment config per code for the state, selecting the
        latest version when multiple active configs exist for the same (state_code, code) pair.

        Args:
            state_code: State code (e.g., "US_UT")
            session: Database session

        Returns:
            List of active AssessmentConfig database models (empty list if none found).
            One config per code, always the highest version number for each code.
        """
        state_code = normalize_state_code(state_code)

        # Subquery to find the max version for each code in this state
        max_version_subquery = (
            select(
                AssessmentConfig.code,
                func.max(AssessmentConfig.version).label("max_version"),
            )
            .where(AssessmentConfig.state_code == state_code)
            .where(AssessmentConfig.is_active)
            .group_by(AssessmentConfig.code)
            .subquery()
        )

        # Main query to get configs matching the max version for each code
        statement = (
            select(AssessmentConfig)
            .join(
                max_version_subquery,
                (AssessmentConfig.code == max_version_subquery.c.code)
                & (AssessmentConfig.version == max_version_subquery.c.max_version),
            )
            .where(AssessmentConfig.state_code == state_code)
            .where(AssessmentConfig.is_active)
        )

        result = await session.exec(statement)
        configs = result.all()

        if len(configs) == 0:
            logger.debug(f"No active assessment configs found for state {state_code}")
        else:
            logger.debug(
                f"Found {len(configs)} active assessment config(s) for state {state_code}"
            )

        return list(configs)

    @classmethod
    async def get_conversation_intake_state_codes(
        cls, session: AsyncSession
    ) -> list[str]:
        """Get all state codes that have active AssessmentConfigs with conversation intake type.

        Returns:
            List of unique state codes (e.g., ["US_ID", "US_UT"]) that have at least one
            active assessment config with intake.intake_type == "conversation"
        """
        # Get all active assessment configs
        statement = select(AssessmentConfig).where(AssessmentConfig.is_active)
        result = await session.exec(statement)
        all_active_configs = result.all()

        conversation_state_codes = set()

        for config in all_active_configs:
            try:
                # Use load_assessment_config for caching
                validated = await cls.load_assessment_config(config.id, session)
                if isinstance(validated.intake, IntakeConfigConversation):
                    conversation_state_codes.add(config.state_code)
            except Exception as e:
                logger.warning(
                    f"Failed to validate config {config.id} ({config.state_code}/{config.code}): {e}"
                )
                continue

        result_list = sorted(list(conversation_state_codes))
        logger.debug(
            f"Found {len(result_list)} state(s) with conversation intake: {result_list}"
        )
        return result_list

    @classmethod
    async def load_summary_config(
        cls, assessment_id: UUID, session: AsyncSession
    ) -> Optional[IntakeSummaryConfigFile]:
        """Load the summary output config for a given assessment.

        Always queries the database for the currently active output config
        to ensure newly activated versions are picked up immediately.

        Args:
            assessment_id: UUID of the assessment config
            session: Database session

        Returns:
            The IntakeSummaryConfigFile referenced by the assessment, or None if not found
        """
        # Load the assessment config (this cache is safe - keyed by immutable UUID)
        assessment = await cls.load_assessment_config(assessment_id, session)

        try:
            # Find the summary output code from the assessment's outputs.
            # Use the *active* output config for this code so we get the currently
            # activated version (e.g. utcccsummary v1), not an arbitrary inactive one.
            for output_code in assessment.outputs.codes:
                output_db = await get_active_output_config(session, output_code)
                if output_db and output_db.output_type == "intake_summary":
                    # Validate and parse YAML content
                    try:
                        validated = OutputFileLoader.validate_yaml_content(
                            output_db.config_yaml
                        )
                        logger.info(
                            f"Loaded output config: {output_db.code} v{output_db.version} ({output_db.id})"
                        )
                        if not isinstance(validated, IntakeSummaryConfigFile):
                            raise ValueError(
                                f"error loading summary config for {assessment_id}"
                            )
                        return validated
                    except Exception as e:
                        logger.error(
                            f"Failed to validate output config {output_db.id}: {e}"
                        )
                # No return here: try next output code (assessment may list multiple)

        except Exception:
            return None
        return None

    @classmethod
    async def load_plan_config(
        cls, assessment_id: UUID, session: AsyncSession
    ) -> Optional[ActionPlanConfigFile]:
        """Load the plan output config for a given assessment.

        Always queries the database for the currently active output config
        to ensure newly activated versions are picked up immediately.

        Args:
            assessment_id: UUID of the assessment config
            session: Database session

        Returns:
            The ActionPlanConfigFile referenced by the assessment, or None if not found
        """
        # Load the assessment config (this cache is safe - keyed by immutable UUID)
        assessment = await cls.load_assessment_config(assessment_id, session)

        # Find the plan output code from the assessment's outputs.
        for output_code in assessment.outputs.codes:
            output_db = await get_active_output_config(session, output_code)
            if output_db and output_db.output_type == "action_plan":
                # Validate and parse YAML content
                try:
                    validated = OutputFileLoader.validate_yaml_content(
                        output_db.config_yaml
                    )
                    logger.info(
                        f"Loaded output config: {output_db.code} v{output_db.version} ({output_db.id})"
                    )
                    if not isinstance(validated, ActionPlanConfigFile):
                        raise ValueError(
                            f"error loading plan config for {assessment_id}"
                        )
                    return validated
                except Exception as e:
                    logger.error(f"Failed to validate plan config {output_db.id}: {e}")
                    continue
        return None
