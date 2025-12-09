from typing import Dict, Optional
from uuid import UUID

import structlog
from sqlmodel import select

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
from app.models.assessment_config import AssessmentConfig
from app.models.output_config import OutputConfig
from app.utils.state_code import normalize_state_code
from app.utils.string_utils import normalize_code

logger = structlog.get_logger(__name__)
# Module-level caches (shared across application)
_assessment_cache: Dict[UUID, AssessmentConfigFile] = {}
# TODO phase 2: change this to support multiple same type output in one assessment
_summary_cache: Dict[UUID, IntakeSummaryConfigFile] = {}
_plan_cache: Dict[UUID, ActionPlanConfigFile] = {}


class ConfigLoader:
    """Loads and caches assessment and output configs from database."""

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
        # Normalize the code to match database storage format
        normalized_code = normalize_code(code)
        state_code = normalize_state_code(state_code)

        # Query for active config
        statement = (
            select(AssessmentConfig)
            .where(normalize_state_code(AssessmentConfig.state_code) == state_code)
            .where(AssessmentConfig.code == normalized_code)
            .where(AssessmentConfig.is_active)
        )
        result = await session.exec(statement)
        config = result.first()

        if config:
            logger.debug(
                f"Found active assessment config: {state_code}/{normalized_code} v{config.version}"
            )
        else:
            logger.warning(
                f"No active assessment config found for {state_code}/{normalized_code}"
            )

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
    async def get_active_assessment_config_by_state(
        cls, state_code: str, session: AsyncSession
    ) -> Optional[AssessmentConfig]:
        """Get the single active assessment config for a given state.

        Current assumption: One active config per state.
        Future: Will need disambiguation when multiple configs per state exist.

        Args:
            state_code: State code (e.g., "US_UT")
            session: Database session

        Returns:
            Active AssessmentConfig database model, or None if not found

        Raises:
            ValueError: If multiple active configs found for state (future-proofing)
        """
        state_code = normalize_state_code(state_code)
        statement = (
            select(AssessmentConfig)
            .where(AssessmentConfig.state_code == state_code)
            .where(AssessmentConfig.is_active)
        )
        result = await session.exec(statement)
        configs = result.all()

        if len(configs) == 0:
            logger.error(f"No active assessment config found for state {state_code}")
            return None
        elif len(configs) > 1:
            raise ValueError(
                f"Multiple active assessment configs found for state {state_code}. "
                f"Explicit config selection required."
            )

        return configs[0]

    @classmethod
    async def load_summary_config(
        cls, assessment_id: UUID, session: AsyncSession
    ) -> Optional[IntakeSummaryConfigFile]:
        """Load the summary output config for a given assessment.

        Args:
            assessment_id: UUID of the assessment config
            session: Database session

        Returns:
            The IntakeSummaryConfigFile referenced by the assessment, or None if not found
        """
        if assessment_id in _summary_cache:
            logger.debug(f"Assessment config cache hit: {assessment_id}")
            return _summary_cache[assessment_id]

        # Load the assessment config
        assessment = await cls.load_assessment_config(assessment_id, session)

        try:
            print(assessment)
            # Find the summary output code from the assessment's outputs
            for output_code in assessment.outputs.codes:
                # Need to find the output config by code (search database)
                # Query for output config matching this code
                statement = select(OutputConfig).where(
                    OutputConfig.code == normalize_code(output_code)
                )
                result = await session.exec(statement)
                output_db = result.first()
                print(output_db)
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
                                f"error loading plan congfig for {assessment_id}"
                            )
                        _summary_cache[assessment_id] = validated
                        return validated
                    except Exception as e:
                        logger.error(
                            f"Failed to validate assessment config {output_db.id}: {e}"
                        )
                return None

        except Exception:
            return None
        return None

    @classmethod
    async def load_plan_config(
        cls, assessment_id: UUID, session: AsyncSession
    ) -> Optional[ActionPlanConfigFile]:
        """Load the plan output config for a given assessment.

        Args:
            assessment_id: UUID of the assessment config
            session: Database session

        Returns:
            The ActionPlanConfigFile referenced by the assessment, or None if not found
        """

        if assessment_id in _plan_cache:
            logger.debug(f"Assessment config cache hit: {assessment_id}")
            return _plan_cache[assessment_id]
        # Load the assessment config
        assessment = await cls.load_assessment_config(assessment_id, session)
        print(assessment)
        # Find the plan output code from the assessment's outputs
        for output_code in assessment.outputs.codes:
            print(output_code)
            # Query for output config matching this code
            statement = select(OutputConfig).where(
                OutputConfig.code == normalize_code(output_code)
            )
            result = await session.exec(statement)
            output_db = result.first()
            print(output_db)
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
                            f"error loading plan congfig for {assessment_id}"
                        )
                    _plan_cache[assessment_id] = validated
                    return validated
                except Exception as e:
                    logger.error(f"Failed to validate plan config {output_db.id}: {e}")
                    continue
        return None
