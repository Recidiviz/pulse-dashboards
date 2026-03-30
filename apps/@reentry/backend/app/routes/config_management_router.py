"""Config Management API Router.

This module provides API endpoints for managing assessment and output configurations,
including CRUD operations, lifecycle management, and import/export functionality.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.default import Params as DefaultParams
from fastapi_pagination.ext.sqlmodel import paginate
from pydantic import Field
from sqlmodel import select

from app.auth.auth_core import (
    get_auth_user_context,
    get_pseudonymized_id,
    is_internal_user,
)
from app.auth.config_access import (
    create_config_access_token,
    is_password_gate_enabled,
    verify_config_password,
)
from app.auth.dependencies import require_internal_user
from app.core.db import AsyncSession, get_session
from app.crud.config_management import (
    create_assessment_config,
    create_output_config,
    delete_assessment_config,
    delete_output_config,
    get_assessment_config_by_id,
    get_assessment_configs,
    get_audit_logs,
    get_latest_assessment_config_version,
    get_latest_output_config_version,
    get_output_config_by_id,
    get_output_configs,
    update_assessment_config,
    update_output_config,
)
from app.models.assessment_config import AssessmentConfig, ConfigStatus
from app.models.config_audit_log import ConfigType
from app.models.output_config import OutputConfig, OutputType
from app.routes.base import DeletionResponse, DeletionStatus
from app.schemas.config_management import (
    ActivateRequest,
    ActivationResult,
    AssessmentConfigCreate,
    AssessmentConfigDetailResponse,
    AssessmentConfigResponse,
    AssessmentConfigUpdate,
    AuditLogResponse,
    DeactivateRequest,
    ImportResult,
    ImportValidationResult,
    NewVersionRequest,
    OutputConfigCreate,
    OutputConfigDetailResponse,
    OutputConfigResponse,
    OutputConfigUpdate,
    PasswordGateStatusResponse,
    TemplateVariableSchemaResponse,
    ValidateYamlRequest,
    ValidationResult,
    VerifyPasswordRequest,
    VerifyPasswordResponse,
)
from app.services.config_management.audit import AuditService
from app.services.config_management.import_export import ImportExportService
from app.services.config_management.lifecycle import LifecycleService
from app.services.config_management.validation import ValidationService
from app.utils.string_utils import normalize_state_code_format


class BigPageParams(DefaultParams):
    size: int = Field(1000, ge=1, le=1000)


router = APIRouter()
logger = structlog.get_logger(__name__)

# Maximum file size for YAML imports (1MB should be more than enough for config files)
MAX_IMPORT_FILE_SIZE = 1 * 1024 * 1024  # 1MB in bytes


async def validate_file_size(
    file: UploadFile, max_size: int = MAX_IMPORT_FILE_SIZE
) -> bytes:
    """Read and validate file size, raising HTTPException if too large."""
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {max_size // 1024}KB.",
        )
    return content


def get_email_from_context(auth_user_context: dict) -> str:
    """Extract email from auth context with fallback to empty string."""
    return auth_user_context.get("email") or ""


# =============================================================================
# Password Gate Endpoints
# =============================================================================


@router.get(
    "/auth/password-gate-status",
    response_model=PasswordGateStatusResponse,
    summary="Check Password Gate Status",
    description="Check if password protection is enabled for config management.",
    tags=["Config Auth"],
)
async def get_password_gate_status():
    """Returns whether the password gate is enabled in this environment."""
    return PasswordGateStatusResponse(enabled=is_password_gate_enabled())


@router.post(
    "/auth/verify-password",
    response_model=VerifyPasswordResponse,
    summary="Verify Config Management Password",
    description="Verify the password and receive a short-lived access token.",
    tags=["Config Auth"],
)
async def verify_password(
    request: VerifyPasswordRequest,
    pseudonymized_id: str = Depends(get_pseudonymized_id),  # noqa: ARG001
    auth_user_context=Depends(get_auth_user_context),
):
    """Verify the config management password and return a short-lived JWT.

    Requires the user to be authenticated (Auth0) and from an internal domain.
    """
    email = auth_user_context.get("email") or ""
    if not is_internal_user(email):
        raise HTTPException(
            status_code=403,
            detail="Config management is only available to Recidiviz staff",
        )

    if not is_password_gate_enabled():
        raise HTTPException(
            status_code=400,
            detail="Password gate is not enabled in this environment.",
        )

    if not verify_config_password(request.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password.",
        )

    from app.core.config import settings

    token = create_config_access_token(email)
    logger.info(
        "Config access token issued",
        email=email,
        expiry_minutes=settings.CONFIG_ACCESS_TOKEN_EXPIRY_MINUTES,
    )

    return VerifyPasswordResponse(
        token=token,
        expires_in_minutes=settings.CONFIG_ACCESS_TOKEN_EXPIRY_MINUTES,
    )


# =============================================================================
# Assessment Config Endpoints
# =============================================================================


@router.get(
    "/assessments",
    response_model=Page[AssessmentConfigResponse],
    summary="List Assessment Configs",
    description="Retrieve a paginated list of assessment configs with optional filters.",
    tags=["Assessment Configs"],
)
async def list_assessment_configs(
    state_code: Optional[str] = Query(None, description="Filter by state code"),
    code: Optional[str] = Query(None, description="Filter by config code"),
    status: Optional[List[str]] = Query(
        None, description="Filter by status (draft, active, inactive)"
    ),
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    query = await get_assessment_configs(
        session,
        state_code=normalize_state_code_format(state_code) if state_code else None,
        code=code,
        status=status,
        query_only=True,
    )
    return await paginate(session, query, params=BigPageParams())


@router.get(
    "/assessments/available-states",
    response_model=list[str],
    summary="List States with Assessment Configs",
    description="Returns distinct state codes that have assessment configs",
    tags=["Assessment Configs"],
)
async def list_states_for_assessment_configs(
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    result = await session.exec(select(AssessmentConfig.state_code).distinct())
    return sorted(result.all())


@router.get(
    "/assessments/{config_id}",
    response_model=AssessmentConfigDetailResponse,
    summary="Get Assessment Config",
    description="Retrieve a specific assessment config by its ID, including YAML content.",
    tags=["Assessment Configs"],
)
async def get_assessment_config(
    config_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    config = await get_assessment_config_by_id(session, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Assessment config not found")
    return config


@router.post(
    "/assessments",
    response_model=AssessmentConfigDetailResponse,
    summary="Create Assessment Config Draft",
    description="Create a new assessment config as a draft.",
    tags=["Assessment Configs"],
)
async def create_assessment_config_draft(
    request: AssessmentConfigCreate,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    # Validate YAML content
    validation = ValidationService.validate_assessment_yaml(request.config_yaml)
    if not validation.valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid YAML: {'; '.join(validation.errors)}",
        )

    state_code = normalize_state_code_format(request.state_code)
    code = request.code

    # Get next version number
    latest_version = await get_latest_assessment_config_version(
        session, state_code, code
    )
    next_version = latest_version + 1

    # Create the config
    config = AssessmentConfig(
        state_code=state_code,
        code=code,
        version=next_version,
        display_name=request.display_name,
        description=request.description,
        config_yaml=request.config_yaml,
        status=ConfigStatus.DRAFT.value,
        is_active=False,
        created_by_email=email,
    )

    created_config = await create_assessment_config(session, config)

    # Log the action
    await AuditService.log_created(
        session,
        ConfigType.ASSESSMENT,
        created_config.id,
        email,
        {"version": next_version},
    )

    logger.info(
        "Assessment config draft created",
        config_id=str(created_config.id),
        state_code=state_code,
        code=code,
        version=next_version,
    )

    return created_config


@router.patch(
    "/assessments/{config_id}",
    response_model=AssessmentConfigDetailResponse,
    summary="Update Assessment Config Draft",
    description="Update an existing draft assessment config. Only drafts can be updated.",
    tags=["Assessment Configs"],
)
async def update_assessment_config_draft(
    config_id: UUID,
    request: AssessmentConfigUpdate,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    config = await get_assessment_config_by_id(session, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Assessment config not found")

    if config.status != ConfigStatus.DRAFT.value:
        raise HTTPException(
            status_code=400,
            detail="Only draft configs can be updated",
        )

    # Validate YAML if provided
    if request.config_yaml:
        validation = ValidationService.validate_assessment_yaml(request.config_yaml)
        if not validation.valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid YAML: {'; '.join(validation.errors)}",
            )
        config.config_yaml = request.config_yaml

    if request.display_name is not None:
        config.display_name = request.display_name
    if request.description is not None:
        config.description = request.description

    updated_config = await update_assessment_config(session, config)

    # Log the action with change note
    await AuditService.log_updated(
        session,
        ConfigType.ASSESSMENT,
        config_id,
        email,
        details={"message": request.change_note},
    )

    return updated_config


@router.delete(
    "/assessments/{config_id}",
    response_model=DeletionResponse,
    summary="Delete Assessment Config Draft",
    description="Delete a draft assessment config. Only drafts can be deleted.",
    tags=["Assessment Configs"],
)
async def delete_assessment_config_endpoint(
    config_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    try:
        deleted = await delete_assessment_config(session, config_id)
        status = DeletionStatus.SUCCESS if deleted else DeletionStatus.FAILED
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DeletionResponse(status=status)


@router.post(
    "/assessments/{config_id}/new-version",
    response_model=AssessmentConfigDetailResponse,
    summary="Create New Version",
    description="Create a new draft version from an existing config.",
    tags=["Assessment Configs"],
)
async def create_new_assessment_version(
    config_id: UUID,
    request: NewVersionRequest,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    source_config = await get_assessment_config_by_id(session, config_id)
    if not source_config:
        raise HTTPException(status_code=404, detail="Assessment config not found")

    # Use provided YAML or copy from source
    config_yaml = request.config_yaml or source_config.config_yaml

    # Validate YAML content
    validation = ValidationService.validate_assessment_yaml(config_yaml)
    if not validation.valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid YAML: {'; '.join(validation.errors)}",
        )

    # Get next version number
    latest_version = await get_latest_assessment_config_version(
        session, source_config.state_code, source_config.code
    )
    next_version = latest_version + 1

    # Update the version in the YAML content to match the new version
    updated_yaml = ImportExportService.update_yaml_version(config_yaml, next_version)

    # Create the new version
    new_config = AssessmentConfig(
        state_code=source_config.state_code,
        code=source_config.code,
        version=next_version,
        display_name=source_config.display_name,
        description=source_config.description,
        config_yaml=updated_yaml,
        status=ConfigStatus.DRAFT.value,
        is_active=False,
        created_by_email=email,
    )

    created_config = await create_assessment_config(session, new_config)

    # Log the action with change note
    await AuditService.log_created(
        session,
        ConfigType.ASSESSMENT,
        created_config.id,
        email,
        {
            "version": next_version,
            "source_config_id": str(config_id),
            "message": request.change_note,
        },
    )

    logger.info(
        "New assessment config version created",
        config_id=str(created_config.id),
        source_config_id=str(config_id),
        version=next_version,
    )

    return created_config


@router.post(
    "/assessments/validate",
    response_model=ValidationResult,
    summary="Validate Assessment YAML",
    description="Validate assessment config YAML content without saving.",
    tags=["Assessment Configs"],
)
async def validate_assessment_yaml(
    request: ValidateYamlRequest,
    _: dict = Depends(require_internal_user),
):
    return ValidationService.validate_assessment_yaml(request.yaml_content)


@router.post(
    "/assessments/{config_id}/activate",
    response_model=ActivationResult,
    summary="Activate Assessment Config",
    description="Activate a config (from draft or inactive), making it the active version for its state/code. Previous active version becomes inactive.",
    tags=["Assessment Configs"],
)
async def activate_assessment_config(
    config_id: UUID,
    request: ActivateRequest = None,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)
    change_note = request.change_note if request else None
    try:
        return await LifecycleService.activate_assessment_config(
            session, config_id, email, change_note=change_note
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/assessments/{config_id}/deactivate",
    response_model=ActivationResult,
    summary="Deactivate Assessment Config",
    description="Deactivate an active config. Warning: This will leave no active config for this state/code.",
    tags=["Assessment Configs"],
)
async def deactivate_assessment_config(
    config_id: UUID,
    request: DeactivateRequest,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)
    try:
        return await LifecycleService.deactivate_assessment_config(
            session, config_id, email, change_note=request.change_note
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/assessments/{config_id}/export",
    summary="Export Assessment Config",
    description="Export an assessment config as a YAML file download.",
    tags=["Assessment Configs"],
)
async def export_assessment_config(
    config_id: UUID,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    config = await get_assessment_config_by_id(session, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Assessment config not found")

    # Generate filename
    filename = ImportExportService.generate_export_filename(
        "assessment", config.state_code, config.code, config.version
    )

    # Log the export
    await AuditService.log_exported(
        session,
        ConfigType.ASSESSMENT,
        config_id,
        email,
    )

    return Response(
        content=config.config_yaml,
        media_type="application/x-yaml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/assessments/import/validate",
    response_model=ImportValidationResult,
    summary="Validate Assessment Import",
    description="Validate a YAML file for import without creating a config.",
    tags=["Assessment Configs"],
)
async def validate_assessment_import(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    content = await validate_file_size(file)
    yaml_content = content.decode("utf-8")
    return await ImportExportService.validate_assessment_import(session, yaml_content)


@router.post(
    "/assessments/import",
    response_model=ImportResult,
    summary="Import Assessment Config",
    description="Import an assessment config from a YAML file.",
    tags=["Assessment Configs"],
)
async def import_assessment_config(
    file: UploadFile = File(...),
    change_note: str = Query(
        ...,
        min_length=1,
        max_length=500,
        description="Note describing the purpose of this import (required)",
    ),
    auto_activate: bool = Query(
        False, description="Automatically publish and activate the imported config"
    ),
    source_env: Optional[str] = Query(
        None, description="Source environment name (for audit purposes)"
    ),
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    content = await validate_file_size(file)
    yaml_content = content.decode("utf-8")

    try:
        result = await ImportExportService.import_assessment_config(
            session,
            yaml_content,
            email,
            source_env=source_env,
            auto_activate=auto_activate,
        )

        # Log the import with change note
        await AuditService.log_imported(
            session,
            ConfigType.ASSESSMENT,
            result.id,
            email,
            source_env=source_env,
            import_hash=ImportExportService.compute_yaml_hash(yaml_content),
            change_note=change_note,
        )

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# Output Config Endpoints
# =============================================================================


@router.get(
    "/outputs",
    response_model=Page[OutputConfigResponse],
    summary="List Output Configs",
    description="Retrieve a paginated list of output configs with optional filters.",
    tags=["Output Configs"],
)
async def list_output_configs(
    output_type: Optional[OutputType] = Query(
        None, description="Filter by output type"
    ),
    code: Optional[str] = Query(None, description="Filter by config code"),
    status: Optional[List[str]] = Query(
        None, description="Filter by status (draft, active, inactive)"
    ),
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    query = await get_output_configs(
        session,
        output_type=output_type,
        code=code,
        status=status,
        query_only=True,
    )
    return await paginate(session, query, params=BigPageParams())


@router.get(
    "/outputs/{config_id}",
    response_model=OutputConfigDetailResponse,
    summary="Get Output Config",
    description="Retrieve a specific output config by its ID, including YAML content.",
    tags=["Output Configs"],
)
async def get_output_config(
    config_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    config = await get_output_config_by_id(session, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Output config not found")
    return config


@router.post(
    "/outputs",
    response_model=OutputConfigDetailResponse,
    summary="Create Output Config Draft",
    description="Create a new output config as a draft.",
    tags=["Output Configs"],
)
async def create_output_config_draft(
    request: OutputConfigCreate,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    # Validate YAML content
    validation = ValidationService.validate_output_yaml(request.config_yaml)
    if not validation.valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid YAML: {'; '.join(validation.errors)}",
        )

    code = request.code

    # Get next version number
    latest_version = await get_latest_output_config_version(session, code)
    next_version = latest_version + 1

    # Create the config
    config = OutputConfig(
        output_type=request.output_type,
        code=code,
        version=next_version,
        display_name=request.display_name,
        description=request.description,
        config_yaml=request.config_yaml,
        status=ConfigStatus.DRAFT.value,
        is_active=False,
        created_by_email=email,
    )

    created_config = await create_output_config(session, config)

    # Log the action
    await AuditService.log_created(
        session,
        ConfigType.OUTPUT,
        created_config.id,
        email,
        {"version": next_version},
    )

    logger.info(
        "Output config draft created",
        config_id=str(created_config.id),
        code=code,
        version=next_version,
    )

    return created_config


@router.patch(
    "/outputs/{config_id}",
    response_model=OutputConfigDetailResponse,
    summary="Update Output Config Draft",
    description="Update an existing draft output config. Only drafts can be updated.",
    tags=["Output Configs"],
)
async def update_output_config_draft(
    config_id: UUID,
    request: OutputConfigUpdate,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    config = await get_output_config_by_id(session, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Output config not found")

    if config.status != ConfigStatus.DRAFT.value:
        raise HTTPException(
            status_code=400,
            detail="Only draft configs can be updated",
        )

    # Validate YAML if provided
    if request.config_yaml:
        validation = ValidationService.validate_output_yaml(request.config_yaml)
        if not validation.valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid YAML: {'; '.join(validation.errors)}",
            )
        config.config_yaml = request.config_yaml

    if request.display_name is not None:
        config.display_name = request.display_name
    if request.description is not None:
        config.description = request.description

    updated_config = await update_output_config(session, config)

    # Log the action with change note
    await AuditService.log_updated(
        session,
        ConfigType.OUTPUT,
        config_id,
        email,
        details={"message": request.change_note},
    )

    return updated_config


@router.delete(
    "/outputs/{config_id}",
    response_model=DeletionResponse,
    summary="Delete Output Config Draft",
    description="Delete a draft output config. Only drafts can be deleted.",
    tags=["Output Configs"],
)
async def delete_output_config_endpoint(
    config_id: UUID,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    try:
        deleted = await delete_output_config(session, config_id)
        status = DeletionStatus.SUCCESS if deleted else DeletionStatus.FAILED
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DeletionResponse(status=status)


@router.post(
    "/outputs/{config_id}/new-version",
    response_model=OutputConfigDetailResponse,
    summary="Create New Output Version",
    description="Create a new draft version from an existing output config.",
    tags=["Output Configs"],
)
async def create_new_output_version(
    config_id: UUID,
    request: NewVersionRequest,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    source_config = await get_output_config_by_id(session, config_id)
    if not source_config:
        raise HTTPException(status_code=404, detail="Output config not found")

    # Use provided YAML or copy from source
    config_yaml = request.config_yaml or source_config.config_yaml

    # Validate YAML content
    validation = ValidationService.validate_output_yaml(config_yaml)
    if not validation.valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid YAML: {'; '.join(validation.errors)}",
        )

    # Get next version number
    latest_version = await get_latest_output_config_version(session, source_config.code)
    next_version = latest_version + 1

    # Update the version in the YAML content to match the new version
    updated_yaml = ImportExportService.update_yaml_version(config_yaml, next_version)

    # Create the new version
    new_config = OutputConfig(
        output_type=source_config.output_type,
        code=source_config.code,
        version=next_version,
        display_name=source_config.display_name,
        description=source_config.description,
        config_yaml=updated_yaml,
        status=ConfigStatus.DRAFT.value,
        is_active=False,
        created_by_email=email,
    )

    created_config = await create_output_config(session, new_config)

    # Log the action with change note
    await AuditService.log_created(
        session,
        ConfigType.OUTPUT,
        created_config.id,
        email,
        {
            "version": next_version,
            "source_config_id": str(config_id),
            "message": request.change_note,
        },
    )

    logger.info(
        "New output config version created",
        config_id=str(created_config.id),
        source_config_id=str(config_id),
        version=next_version,
    )

    return created_config


@router.post(
    "/outputs/validate",
    response_model=ValidationResult,
    summary="Validate Output YAML",
    description="Validate output config YAML content without saving.",
    tags=["Output Configs"],
)
async def validate_output_yaml(
    request: ValidateYamlRequest,
    _: dict = Depends(require_internal_user),
):
    return ValidationService.validate_output_yaml(request.yaml_content)


@router.get(
    "/outputs/template-schema",
    response_model=TemplateVariableSchemaResponse,
    summary="Get Template Variable Schema",
    description="Get the complete schema of available and required template variables for an output type. This helps users know which variables they can use in their config templates.",
    tags=["Output Configs"],
)
async def get_template_variable_schema(
    output_type: OutputType = Query(
        ..., description="Output type (action_plan or intake_summary)"
    ),
    _: dict = Depends(require_internal_user),
):
    try:
        return ValidationService.get_template_variable_schema(output_type.value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/outputs/{config_id}/activate",
    response_model=ActivationResult,
    summary="Activate Output Config",
    description="Activate a config (from draft or inactive), making it the active version for its code. Previous active version becomes inactive.",
    tags=["Output Configs"],
)
async def activate_output_config(
    config_id: UUID,
    request: ActivateRequest = None,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)
    change_note = request.change_note if request else None
    try:
        return await LifecycleService.activate_output_config(
            session, config_id, email, change_note=change_note
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/outputs/{config_id}/deactivate",
    response_model=ActivationResult,
    summary="Deactivate Output Config",
    description="Deactivate an active config. Warning: This will leave no active config for this code.",
    tags=["Output Configs"],
)
async def deactivate_output_config(
    config_id: UUID,
    request: DeactivateRequest,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)
    try:
        return await LifecycleService.deactivate_output_config(
            session, config_id, email, change_note=request.change_note
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/outputs/{config_id}/export",
    summary="Export Output Config",
    description="Export an output config as a YAML file download.",
    tags=["Output Configs"],
)
async def export_output_config(
    config_id: UUID,
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    config = await get_output_config_by_id(session, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Output config not found")

    # Generate filename
    filename = ImportExportService.generate_export_filename(
        "output", None, config.code, config.version
    )

    # Log the export
    await AuditService.log_exported(
        session,
        ConfigType.OUTPUT,
        config_id,
        email,
    )

    return Response(
        content=config.config_yaml,
        media_type="application/x-yaml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/outputs/import/validate",
    response_model=ImportValidationResult,
    summary="Validate Output Import",
    description="Validate a YAML file for import without creating a config.",
    tags=["Output Configs"],
)
async def validate_output_import(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    content = await validate_file_size(file)
    yaml_content = content.decode("utf-8")
    return await ImportExportService.validate_output_import(session, yaml_content)


@router.post(
    "/outputs/import",
    response_model=ImportResult,
    summary="Import Output Config",
    description="Import an output config from a YAML file.",
    tags=["Output Configs"],
)
async def import_output_config(
    file: UploadFile = File(...),
    change_note: str = Query(
        ...,
        min_length=1,
        max_length=500,
        description="Note describing the purpose of this import (required)",
    ),
    auto_activate: bool = Query(
        False, description="Automatically publish and activate the imported config"
    ),
    source_env: Optional[str] = Query(
        None, description="Source environment name (for audit purposes)"
    ),
    session: AsyncSession = Depends(get_session),
    auth_user_context: dict = Depends(require_internal_user),
):
    email = get_email_from_context(auth_user_context)

    content = await validate_file_size(file)
    yaml_content = content.decode("utf-8")

    try:
        result = await ImportExportService.import_output_config(
            session,
            yaml_content,
            email,
            source_env=source_env,
            auto_activate=auto_activate,
        )

        # Log the import with change note
        await AuditService.log_imported(
            session,
            ConfigType.OUTPUT,
            result.id,
            email,
            source_env=source_env,
            import_hash=ImportExportService.compute_yaml_hash(yaml_content),
            change_note=change_note,
        )

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# Audit Log Endpoints
# =============================================================================


@router.get(
    "/audit",
    response_model=Page[AuditLogResponse],
    summary="List Audit Logs",
    description="Retrieve a paginated list of audit log entries with optional filters.",
    tags=["Audit"],
)
async def list_audit_logs(
    config_type: Optional[str] = Query(
        None, description="Filter by config type (assessment or output)"
    ),
    config_id: Optional[UUID] = Query(None, description="Filter by config ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    from_date: Optional[datetime] = Query(
        None, description="Filter from date (inclusive)"
    ),
    to_date: Optional[datetime] = Query(None, description="Filter to date (inclusive)"),
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_internal_user),
):
    query = await get_audit_logs(
        session,
        config_type=config_type,
        config_id=config_id,
        action=action,
        from_date=from_date,
        to_date=to_date,
        query_only=True,
    )
    return await paginate(session, query)
