"""Audit service for config management.

This module provides audit logging functionality for config operations.
"""

from typing import Optional
from uuid import UUID

import structlog

from app.core.db import AsyncSession
from app.crud.config_management import create_audit_log
from app.models.config_audit_log import ConfigAuditAction, ConfigAuditLog, ConfigType

logger = structlog.get_logger(__name__)


class AuditService:
    """Service for creating audit log entries."""

    @staticmethod
    async def log_config_action(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        action: ConfigAuditAction,
        performed_by_email: str,
        details: Optional[dict] = None,
    ) -> ConfigAuditLog:
        """
        Create an audit log entry for a config action.

        Args:
            session: Database session
            config_type: Type of config ('assessment' or 'output')
            config_id: ID of the config
            action: Action performed
            performed_by_email: Email of the user who performed the action
            details: Optional additional details

        Returns:
            Created ConfigAuditLog entry
        """
        audit_log = ConfigAuditLog(
            config_type=config_type.value,
            config_id=config_id,
            action=action.value,
            performed_by_email=performed_by_email,
            details=details,
        )

        created_log = await create_audit_log(session, audit_log)

        logger.info(
            "Config audit log created",
            config_type=config_type.value,
            config_id=str(config_id),
            action=action.value,
            performed_by=performed_by_email,
        )

        return created_log

    @staticmethod
    async def log_created(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        performed_by_email: str,
        details: Optional[dict] = None,
    ) -> ConfigAuditLog:
        """Log a config creation event."""
        return await AuditService.log_config_action(
            session,
            config_type,
            config_id,
            ConfigAuditAction.CREATED,
            performed_by_email,
            details,
        )

    @staticmethod
    async def log_updated(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        performed_by_email: str,
        details: Optional[dict] = None,
    ) -> ConfigAuditLog:
        """Log a config update event."""
        return await AuditService.log_config_action(
            session,
            config_type,
            config_id,
            ConfigAuditAction.UPDATED,
            performed_by_email,
            details,
        )

    @staticmethod
    async def log_activated(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        performed_by_email: str,
        previous_active_id: Optional[UUID] = None,
        change_note: Optional[str] = None,
    ) -> ConfigAuditLog:
        """Log a config activation event."""
        details = {}
        if previous_active_id:
            details["previous_active_id"] = str(previous_active_id)
        if change_note:
            details["message"] = change_note

        return await AuditService.log_config_action(
            session,
            config_type,
            config_id,
            ConfigAuditAction.ACTIVATED,
            performed_by_email,
            details if details else None,
        )

    @staticmethod
    async def log_deactivated(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        performed_by_email: str,
        change_note: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> ConfigAuditLog:
        """Log a config deactivation event."""
        final_details = details.copy() if details else {}
        if change_note:
            final_details["message"] = change_note

        return await AuditService.log_config_action(
            session,
            config_type,
            config_id,
            ConfigAuditAction.DEACTIVATED,
            performed_by_email,
            final_details if final_details else None,
        )

    @staticmethod
    async def log_imported(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        performed_by_email: str,
        source_env: Optional[str] = None,
        import_hash: Optional[str] = None,
        change_note: Optional[str] = None,
    ) -> ConfigAuditLog:
        """Log a config import event."""
        details = {}
        if source_env:
            details["source_env"] = source_env
        if import_hash:
            details["import_hash"] = import_hash
        if change_note:
            details["message"] = change_note

        return await AuditService.log_config_action(
            session,
            config_type,
            config_id,
            ConfigAuditAction.IMPORTED,
            performed_by_email,
            details if details else None,
        )

    @staticmethod
    async def log_exported(
        session: AsyncSession,
        config_type: ConfigType,
        config_id: UUID,
        performed_by_email: str,
        details: Optional[dict] = None,
    ) -> ConfigAuditLog:
        """Log a config export event."""
        return await AuditService.log_config_action(
            session,
            config_type,
            config_id,
            ConfigAuditAction.EXPORTED,
            performed_by_email,
            details,
        )
