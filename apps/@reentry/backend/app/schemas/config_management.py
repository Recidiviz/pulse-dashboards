"""Pydantic schemas for Config Management API."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.config_audit_log import ConfigAuditAction, ConfigType
from app.models.output_config import OutputType
from app.routes.base import ORMResponse

# ============================================================================
# Assessment Config Schemas
# ============================================================================


class AssessmentConfigBase(BaseModel):
    """Base schema for assessment config fields."""

    state_code: str = Field(description="State code (e.g., 'US_UT')")
    code: str = Field(description="Config code (e.g., 'CCCI')")
    display_name: str = Field(description="Human-readable name")
    description: Optional[str] = Field(default=None, description="Optional description")


class AssessmentConfigCreate(AssessmentConfigBase):
    """Schema for creating a new assessment config draft."""

    config_yaml: str = Field(description="YAML configuration content")


class AssessmentConfigUpdate(BaseModel):
    """Schema for updating an existing draft assessment config."""

    display_name: Optional[str] = Field(default=None, description="Human-readable name")
    description: Optional[str] = Field(default=None, description="Optional description")
    config_yaml: Optional[str] = Field(
        default=None, description="YAML configuration content"
    )
    change_note: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Note describing what was changed (required, max 500 chars)",
    )


class AssessmentConfigResponse(ORMResponse):
    """Response schema for assessment config."""

    state_code: str
    code: str
    version: int
    display_name: str
    description: Optional[str] = None
    status: str
    is_active: bool
    created_by_email: Optional[str] = None
    activated_at: Optional[datetime] = None
    activated_by_email: Optional[str] = None
    imported_from_env: Optional[str] = None
    import_hash: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentConfigDetailResponse(AssessmentConfigResponse):
    """Detailed response schema for assessment config including YAML content."""

    config_yaml: str

    class Config:
        from_attributes = True


# ============================================================================
# Output Config Schemas
# ============================================================================


class OutputConfigBase(BaseModel):
    """Base schema for output config fields."""

    output_type: OutputType = Field(
        description="Type of output (intake_summary or action_plan)"
    )
    code: str = Field(description="Config code")
    display_name: str = Field(description="Human-readable name")
    description: Optional[str] = Field(default=None, description="Optional description")


class OutputConfigCreate(OutputConfigBase):
    """Schema for creating a new output config draft."""

    config_yaml: str = Field(description="YAML configuration content")


class OutputConfigUpdate(BaseModel):
    """Schema for updating an existing draft output config."""

    display_name: Optional[str] = Field(default=None, description="Human-readable name")
    description: Optional[str] = Field(default=None, description="Optional description")
    config_yaml: Optional[str] = Field(
        default=None, description="YAML configuration content"
    )
    change_note: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Note describing what was changed (required, max 500 chars)",
    )


class OutputConfigResponse(ORMResponse):
    """Response schema for output config."""

    output_type: OutputType
    code: str
    version: int
    display_name: str
    description: Optional[str] = None
    status: str
    is_active: bool
    created_by_email: Optional[str] = None
    activated_at: Optional[datetime] = None
    activated_by_email: Optional[str] = None
    imported_from_env: Optional[str] = None
    import_hash: Optional[str] = None

    class Config:
        from_attributes = True


class OutputConfigDetailResponse(OutputConfigResponse):
    """Detailed response schema for output config including YAML content."""

    config_yaml: str

    class Config:
        from_attributes = True


# ============================================================================
# Import/Export Schemas
# ============================================================================


class ImportValidationResult(BaseModel):
    """Result of validating an imported YAML file."""

    valid: bool = Field(description="Whether the YAML is valid")
    parsed_config: Optional[dict] = Field(
        default=None, description="Parsed config metadata if valid"
    )
    existing_version: Optional[int] = Field(
        default=None, description="Existing version number if config family exists"
    )
    warnings: list[str] = Field(default_factory=list, description="Validation warnings")
    errors: list[str] = Field(default_factory=list, description="Validation errors")


class ImportResult(BaseModel):
    """Result of importing a config."""

    id: UUID = Field(description="ID of the created config")
    state_code: Optional[str] = Field(
        default=None, description="State code (for assessment configs)"
    )
    code: str = Field(description="Config code")
    version: int = Field(description="Version number")
    status: str = Field(description="Config status after import")
    is_active: bool = Field(description="Whether the config is active")
    previous_active_version: Optional[int] = Field(
        default=None, description="Previous active version if auto-activated"
    )
    message: str = Field(description="Human-readable result message")


class ValidateYamlRequest(BaseModel):
    """Request schema for validating YAML content."""

    yaml_content: str = Field(description="YAML content to validate")


class ValidationResult(BaseModel):
    """Result of validating YAML content."""

    valid: bool = Field(description="Whether the YAML is valid")
    errors: list[str] = Field(default_factory=list, description="Validation errors")
    warnings: list[str] = Field(default_factory=list, description="Validation warnings")


class NewVersionRequest(BaseModel):
    """Request schema for creating a new version from an existing config."""

    config_yaml: Optional[str] = Field(
        default=None,
        description="Optional YAML content; if not provided, copies from source",
    )
    change_note: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Note describing why a new version is being created (required, max 500 chars)",
    )


class ActivateRequest(BaseModel):
    """Request schema for activating a config."""

    change_note: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional note about why this config is being activated",
    )


class DeactivateRequest(BaseModel):
    """Request schema for deactivating a config."""

    change_note: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Note explaining why the config is being deactivated (required, max 500 chars)",
    )


class ImportRequest(BaseModel):
    """Request schema for import metadata."""

    change_note: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Note describing the purpose of this import (required, max 500 chars)",
    )
    source_env: Optional[str] = Field(
        default=None,
        description="Optional source environment name",
    )


# ============================================================================
# Audit Log Schemas
# ============================================================================


class AuditLogResponse(ORMResponse):
    """Response schema for audit log entries."""

    config_type: str
    config_id: UUID
    action: str
    performed_by_email: str
    details: Optional[dict] = None

    class Config:
        from_attributes = True


class AuditLogFilter(BaseModel):
    """Filter options for querying audit logs."""

    config_type: Optional[ConfigType] = Field(
        default=None, description="Filter by config type"
    )
    config_id: Optional[UUID] = Field(default=None, description="Filter by config ID")
    action: Optional[ConfigAuditAction] = Field(
        default=None, description="Filter by action"
    )
    from_date: Optional[datetime] = Field(
        default=None, description="Filter from date (inclusive)"
    )
    to_date: Optional[datetime] = Field(
        default=None, description="Filter to date (inclusive)"
    )


# ============================================================================
# Config Lifecycle Schemas
# ============================================================================


class ActivationResult(BaseModel):
    """Result of activating or deactivating a config."""

    id: UUID
    status: str
    is_active: bool
    previous_active_id: Optional[UUID] = Field(
        default=None, description="ID of the previously active config (if any)"
    )
    message: str
