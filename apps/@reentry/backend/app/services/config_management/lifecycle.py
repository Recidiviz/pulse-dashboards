"""Lifecycle service for config management.

This module provides functionality for managing config lifecycle transitions
(activate, deactivate).

Simplified lifecycle:
- DRAFT: Work in progress, editable
- ACTIVE: Currently in use (only one per config code)
- INACTIVE: Previously active, now replaced or deactivated
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

import structlog

from app.core.db import AsyncSession
from app.crud.config_management import (
    get_active_assessment_config,
    get_active_output_config,
    get_assessment_config_by_id,
    get_output_config_by_id,
    update_assessment_config,
    update_output_config,
)
from app.models.assessment_config import ConfigStatus
from app.models.config_audit_log import ConfigType
from app.schemas.config_management import ActivationResult
from app.services.config_management.audit import AuditService
from app.utils.config_loader import ConfigLoader

logger = structlog.get_logger(__name__)


class LifecycleService:
    """Service for managing config lifecycle transitions."""

    # =========================================================================
    # Assessment Config Lifecycle
    # =========================================================================

    @staticmethod
    async def activate_assessment_config(
        session: AsyncSession,
        config_id: UUID,
        performed_by_email: str,
        change_note: Optional[str] = None,
    ) -> ActivationResult:
        """
        Activate an assessment config, deactivating any previous active version.

        Can activate from DRAFT or INACTIVE status. When activating:
        - DRAFT -> ACTIVE
        - INACTIVE -> ACTIVE
        - Previous active version -> INACTIVE

        Args:
            session: Database session
            config_id: ID of the config to activate
            performed_by_email: Email of the user activating
            change_note: Optional note explaining why config is being activated

        Returns:
            ActivationResult with activation details

        Raises:
            ValueError: If config not found
        """
        config = await get_assessment_config_by_id(session, config_id)
        if not config:
            raise ValueError(f"Assessment config not found: {config_id}")

        if config.is_active:
            return ActivationResult(
                id=config_id,
                status=config.status,
                is_active=True,
                message="Config is already active.",
            )

        # Deactivate current active config (if any)
        previous_active = await get_active_assessment_config(
            session, config.state_code, config.code
        )
        previous_active_id = None

        if previous_active and previous_active.id != config_id:
            previous_active.is_active = False
            previous_active.status = ConfigStatus.INACTIVE.value
            await update_assessment_config(session, previous_active)
            previous_active_id = previous_active.id

            await AuditService.log_deactivated(
                session,
                ConfigType.ASSESSMENT,
                previous_active.id,
                performed_by_email,
                details={"reason": "superseded", "new_active_id": str(config_id)},
            )

        # Activate the new config
        config.is_active = True
        config.status = ConfigStatus.ACTIVE.value
        config.activated_at = datetime.utcnow()
        config.activated_by_email = performed_by_email
        await update_assessment_config(session, config)

        # Log the activation
        await AuditService.log_activated(
            session,
            ConfigType.ASSESSMENT,
            config_id,
            performed_by_email,
            previous_active_id,
            change_note=change_note,
        )

        # Invalidate assessment cache so the new config is picked up
        ConfigLoader.invalidate_assessment_cache()

        logger.info(
            "Assessment config activated",
            config_id=str(config_id),
            state_code=config.state_code,
            code=config.code,
            version=config.version,
            previous_active_id=str(previous_active_id) if previous_active_id else None,
        )

        message = f"Config v{config.version} is now active."
        if previous_active_id:
            message += " Previous version has been deactivated."

        return ActivationResult(
            id=config_id,
            status=config.status,
            is_active=True,
            previous_active_id=previous_active_id,
            message=message,
        )

    @staticmethod
    async def deactivate_assessment_config(
        session: AsyncSession,
        config_id: UUID,
        performed_by_email: str,
        change_note: Optional[str] = None,
    ) -> ActivationResult:
        """
        Deactivate an assessment config, setting its status to INACTIVE.

        Warning: This will leave no active config for this config code.
        Use with caution - typically used for emergency situations.

        Args:
            session: Database session
            config_id: ID of the config to deactivate
            performed_by_email: Email of the user deactivating
            change_note: Note explaining why config is being deactivated (required)

        Returns:
            ActivationResult with deactivation details

        Raises:
            ValueError: If config not found
        """
        config = await get_assessment_config_by_id(session, config_id)
        if not config:
            raise ValueError(f"Assessment config not found: {config_id}")

        if not config.is_active:
            return ActivationResult(
                id=config_id,
                status=config.status,
                is_active=False,
                message="Config is already inactive.",
            )

        # Deactivate and set to INACTIVE status
        config.is_active = False
        config.status = ConfigStatus.INACTIVE.value
        await update_assessment_config(session, config)

        # Log the action with change note
        await AuditService.log_deactivated(
            session,
            ConfigType.ASSESSMENT,
            config_id,
            performed_by_email,
            change_note=change_note,
            details={"reason": "manual_deactivation"},
        )

        # Invalidate assessment cache so deactivated config is no longer served
        ConfigLoader.invalidate_assessment_cache()

        logger.info(
            "Assessment config deactivated",
            config_id=str(config_id),
            state_code=config.state_code,
            code=config.code,
            version=config.version,
        )

        return ActivationResult(
            id=config_id,
            status=config.status,
            is_active=False,
            message=(
                f"Config v{config.version} has been deactivated. "
                f"Warning: No active config for {config.state_code}/{config.code}."
            ),
        )

    # =========================================================================
    # Output Config Lifecycle
    # =========================================================================

    @staticmethod
    async def activate_output_config(
        session: AsyncSession,
        config_id: UUID,
        performed_by_email: str,
        change_note: Optional[str] = None,
    ) -> ActivationResult:
        """
        Activate an output config, deactivating any previous active version.

        Can activate from DRAFT or INACTIVE status. When activating:
        - DRAFT -> ACTIVE
        - INACTIVE -> ACTIVE
        - Previous active version -> INACTIVE

        Args:
            session: Database session
            config_id: ID of the config to activate
            performed_by_email: Email of the user activating
            change_note: Optional note explaining why config is being activated

        Returns:
            ActivationResult with activation details

        Raises:
            ValueError: If config not found
        """
        config = await get_output_config_by_id(session, config_id)
        if not config:
            raise ValueError(f"Output config not found: {config_id}")

        if config.is_active:
            return ActivationResult(
                id=config_id,
                status=config.status,
                is_active=True,
                message="Config is already active.",
            )

        # Deactivate current active config (if any)
        previous_active = await get_active_output_config(session, config.code)
        previous_active_id = None

        if previous_active and previous_active.id != config_id:
            previous_active.is_active = False
            previous_active.status = ConfigStatus.INACTIVE.value
            await update_output_config(session, previous_active)
            previous_active_id = previous_active.id

            await AuditService.log_deactivated(
                session,
                ConfigType.OUTPUT,
                previous_active.id,
                performed_by_email,
                details={"reason": "superseded", "new_active_id": str(config_id)},
            )

        # Activate the new config
        config.is_active = True
        config.status = ConfigStatus.ACTIVE.value
        config.activated_at = datetime.utcnow()
        config.activated_by_email = performed_by_email
        await update_output_config(session, config)

        # Log the activation
        await AuditService.log_activated(
            session,
            ConfigType.OUTPUT,
            config_id,
            performed_by_email,
            previous_active_id,
            change_note=change_note,
        )

        # Output configs are always loaded fresh from DB (no cache), so no
        # explicit invalidation is needed. The next load_summary_config or
        # load_plan_config call will pick up the newly activated version.

        logger.info(
            "Output config activated",
            config_id=str(config_id),
            code=config.code,
            version=config.version,
            previous_active_id=str(previous_active_id) if previous_active_id else None,
        )

        message = f"Config v{config.version} is now active."
        if previous_active_id:
            message += " Previous version has been deactivated."

        return ActivationResult(
            id=config_id,
            status=config.status,
            is_active=True,
            previous_active_id=previous_active_id,
            message=message,
        )

    @staticmethod
    async def deactivate_output_config(
        session: AsyncSession,
        config_id: UUID,
        performed_by_email: str,
        change_note: Optional[str] = None,
    ) -> ActivationResult:
        """
        Deactivate an output config, setting its status to INACTIVE.

        Warning: This will leave no active config for this config code.
        Use with caution - typically used for emergency situations.

        Args:
            session: Database session
            config_id: ID of the config to deactivate
            performed_by_email: Email of the user deactivating
            change_note: Note explaining why config is being deactivated (required)

        Returns:
            ActivationResult with deactivation details

        Raises:
            ValueError: If config not found
        """
        config = await get_output_config_by_id(session, config_id)
        if not config:
            raise ValueError(f"Output config not found: {config_id}")

        if not config.is_active:
            return ActivationResult(
                id=config_id,
                status=config.status,
                is_active=False,
                message="Config is already inactive.",
            )

        # Deactivate and set to INACTIVE status
        config.is_active = False
        config.status = ConfigStatus.INACTIVE.value
        await update_output_config(session, config)

        # Log the action with change note
        await AuditService.log_deactivated(
            session,
            ConfigType.OUTPUT,
            config_id,
            performed_by_email,
            change_note=change_note,
            details={"reason": "manual_deactivation"},
        )

        # Output configs are always loaded fresh from DB (no cache), so no
        # explicit invalidation is needed.

        logger.info(
            "Output config deactivated",
            config_id=str(config_id),
            code=config.code,
            version=config.version,
        )

        return ActivationResult(
            id=config_id,
            status=config.status,
            is_active=False,
            message=f"Config v{config.version} has been deactivated. Warning: No active config for {config.code}.",
        )
