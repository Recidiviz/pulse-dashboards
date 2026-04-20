"""API tests for Config Management router endpoints."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.assessment_config import AssessmentConfig, ConfigStatus
from app.models.output_config import OutputConfig, OutputType
from main import app as fastapi_app

# Sample YAML content for testing (matches actual schema requirements)
VALID_ASSESSMENT_YAML = """
metadata:
  state_code: US_UT
  code: TEST_API
  version: 1
  display_name: Test API Assessment Config
  description: A test assessment configuration for API tests

intake:
  intake_type: transcription
  transcription_post_processing_model:
    provider: openai
    name: gpt-4o
    version: "2024-11-20"

outputs:
  codes:
    - intake_summary_default
    - plan_default
"""

# Sample YAML content for testing (matches actual schema requirements)
VALID_ASSESSMENT_YAML_UPDATED = """
metadata:
  state_code: US_UT
  code: TEST_API
  version: 1
  display_name: Updated Name
  description: A test assessment configuration for API tests

intake:
  intake_type: transcription
  transcription_post_processing_model:
    provider: openai
    name: gpt-4o
    version: "2024-11-20"

outputs:
  codes:
    - intake_summary_default
    - plan_default
"""

VALID_OUTPUT_YAML = """
metadata:
  output_type: intake_summary
  code: test_api_summary
  version: 1
  display_name: Test API Summary Output
  description: A test summary output configuration for API tests

model:
  provider: openai
  name: gpt-4o
  version: "2024-11-20"

prompts:
  system: You are a skilled summarizer.
  template: |
    Summarize the following conversation: {Conversation}
"""

INVALID_YAML = """
invalid yaml content
  - missing proper structure
    this: will fail
"""


# =============================================================================
# Config Management Client Fixture
# This specialized client shares the session with test fixtures to ensure
# data created in fixtures is visible to route handlers.
# =============================================================================


@pytest.fixture
async def config_client(async_session: AsyncSession):
    """Test client that shares async_session with route handlers."""
    from app.auth.auth_core import get_auth_user_context, get_pseudonymized_id
    from app.core.db import get_session
    from app.routes.config_management_router import require_internal_user

    original_dependencies = fastapi_app.dependency_overrides.copy()

    mock_auth_context = {
        "email": "test@recidiviz.org",
        "pseudonymized_id": "test_pseudonymized_id",
        "is_zero_caseload_user": False,
        "is_read_only_user": False,
        "cpa_client_locations": [],
    }

    async def mock_get_pseudonymized_id():
        return "test_pseudonymized_id"

    async def mock_get_auth_user_context():
        return mock_auth_context

    async def mock_require_internal_user():
        """Bypass password gate for unit tests; return mock auth context."""
        return mock_auth_context

    async def mock_get_session():
        yield async_session

    fastapi_app.dependency_overrides[get_pseudonymized_id] = mock_get_pseudonymized_id
    fastapi_app.dependency_overrides[get_auth_user_context] = mock_get_auth_user_context
    fastapi_app.dependency_overrides[get_session] = mock_get_session
    fastapi_app.dependency_overrides[require_internal_user] = mock_require_internal_user

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as client:
        yield client

    fastapi_app.dependency_overrides = original_dependencies


# =============================================================================
# Fixtures
# =============================================================================


@pytest_asyncio.fixture
async def draft_assessment_config(async_session: AsyncSession):
    """Create a draft assessment config for testing."""
    config = AssessmentConfig(
        state_code="US_UT",
        code="apitest",
        version=1,
        display_name="API Test Config",
        description="Test config for API tests",
        config_yaml=VALID_ASSESSMENT_YAML,
        status=ConfigStatus.DRAFT.value,
        is_active=False,
        created_by_email="test@recidiviz.org",
    )
    async_session.add(config)
    await async_session.commit()
    await async_session.refresh(config)
    return config


@pytest_asyncio.fixture
async def active_assessment_config(async_session: AsyncSession):
    """Create an active assessment config for testing."""
    config = AssessmentConfig(
        state_code="US_UT",
        code="apiactive",
        version=1,
        display_name="API Active Config",
        description="Active config for API tests",
        config_yaml=VALID_ASSESSMENT_YAML,
        status=ConfigStatus.ACTIVE.value,
        is_active=True,
        created_by_email="test@recidiviz.org",
    )
    async_session.add(config)
    await async_session.commit()
    await async_session.refresh(config)
    return config


@pytest_asyncio.fixture
async def draft_output_config(async_session: AsyncSession):
    """Create a draft output config for testing."""
    config = OutputConfig(
        output_type=OutputType.intake_summary,
        code="apitestoutput",
        version=1,
        display_name="API Test Output Config",
        description="Test output config for API tests",
        config_yaml=VALID_OUTPUT_YAML,
        status=ConfigStatus.DRAFT.value,
        is_active=False,
        created_by_email="test@recidiviz.org",
    )
    async_session.add(config)
    await async_session.commit()
    await async_session.refresh(config)
    return config


# =============================================================================
# Tests for Assessment Config Endpoints
# =============================================================================


class TestListAssessmentConfigs:
    """Tests for GET /config-management/assessments."""

    @pytest.mark.asyncio
    async def test_list_assessment_configs_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully listing assessment configs."""
        response = await config_client.get("/config-management/assessments")

        assert response.status_code == 200
        data = response.json()

        # Paginated response
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert len(data["items"]) >= 1

    @pytest.mark.asyncio
    async def test_list_assessment_configs_filter_by_state(
        self, config_client: AsyncClient, async_session: AsyncSession
    ):
        """Test filtering assessment configs by state code."""
        # Create configs for different states
        config_ut = AssessmentConfig(
            state_code="US_UT",
            code="filtertestut",
            version=1,
            display_name="Utah Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        config_id = AssessmentConfig(
            state_code="US_ID",
            code="filtertestid",
            version=1,
            display_name="Idaho Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        async_session.add_all([config_ut, config_id])
        await async_session.commit()

        response = await config_client.get(
            "/config-management/assessments?state_code=US_UT"
        )

        assert response.status_code == 200
        data = response.json()

        # All returned configs should be for US_UT
        for item in data["items"]:
            assert item["state_code"] == "US_UT"

    @pytest.mark.asyncio
    async def test_list_assessment_configs_filter_by_status(
        self,
        config_client: AsyncClient,
        draft_assessment_config,
        active_assessment_config,
    ):
        """Test filtering assessment configs by status."""
        response = await config_client.get(
            "/config-management/assessments?status=active"
        )

        assert response.status_code == 200
        data = response.json()

        # All returned configs should be active
        for item in data["items"]:
            assert item["status"] == "active"


class TestGetAssessmentConfig:
    """Tests for GET /config-management/assessments/{config_id}."""

    @pytest.mark.asyncio
    async def test_get_assessment_config_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully getting a single assessment config."""
        response = await config_client.get(
            f"/config-management/assessments/{draft_assessment_config.id}"
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == str(draft_assessment_config.id)
        assert data["code"] == "apitest"
        assert data["display_name"] == "API Test Config"
        assert "config_yaml" in data  # Detail response includes YAML

    @pytest.mark.asyncio
    async def test_get_assessment_config_not_found(self, config_client: AsyncClient):
        """Test 404 when config doesn't exist."""
        import uuid

        fake_id = uuid.uuid4()
        response = await config_client.get(f"/config-management/assessments/{fake_id}")

        assert response.status_code == 404


class TestCreateAssessmentConfig:
    """Tests for POST /config-management/assessments."""

    @pytest.mark.asyncio
    async def test_create_assessment_config_success(self, config_client: AsyncClient):
        """Test successfully creating an assessment config draft."""
        request_data = {
            "state_code": "US_AZ",
            "code": "NEW_CONFIG",
            "config_yaml": VALID_ASSESSMENT_YAML,
        }

        response = await config_client.post(
            "/config-management/assessments", json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        assert data["state_code"] == "US_AZ"
        assert data["code"] == "NEW_CONFIG"
        assert data["status"] == "draft"
        assert data["is_active"] is False

    @pytest.mark.asyncio
    async def test_create_assessment_config_invalid_yaml(
        self, config_client: AsyncClient
    ):
        """Test 400 when YAML is invalid."""
        request_data = {
            "state_code": "US_AZ",
            "code": "INVALID",
            "display_name": "Invalid Config",
            "config_yaml": INVALID_YAML,
        }

        response = await config_client.post(
            "/config-management/assessments", json=request_data
        )

        assert response.status_code == 400
        assert "Invalid YAML" in response.json()["detail"]


class TestUpdateAssessmentConfig:
    """Tests for PATCH /config-management/assessments/{config_id}."""

    @pytest.mark.asyncio
    async def test_update_assessment_config_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully updating a draft config."""
        request_data = {
            "config_yaml": VALID_ASSESSMENT_YAML_UPDATED,
            "change_note": "Updated the display name for testing",
        }

        response = await config_client.patch(
            f"/config-management/assessments/{draft_assessment_config.id}",
            json=request_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_assessment_config_non_draft_fails(
        self, config_client: AsyncClient, active_assessment_config
    ):
        """Test that updating a non-draft config fails."""
        request_data = {
            "display_name": "Should Fail",
            "change_note": "This should fail",
        }

        response = await config_client.patch(
            f"/config-management/assessments/{active_assessment_config.id}",
            json=request_data,
        )

        assert response.status_code == 400
        assert "draft" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_assessment_config_requires_change_note(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test that change_note is required for updates."""
        request_data = {
            "display_name": "Updated Name",
            # Missing change_note
        }

        response = await config_client.patch(
            f"/config-management/assessments/{draft_assessment_config.id}",
            json=request_data,
        )

        assert response.status_code == 422  # Validation error


class TestDeleteAssessmentConfig:
    """Tests for DELETE /config-management/assessments/{config_id}."""

    @pytest.mark.asyncio
    async def test_delete_assessment_config_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully deleting a draft config."""
        response = await config_client.delete(
            f"/config-management/assessments/{draft_assessment_config.id}"
        )

        assert response.status_code == 200

        # Verify it's deleted
        get_response = await config_client.get(
            f"/config-management/assessments/{draft_assessment_config.id}"
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_active_config_fails(
        self, config_client: AsyncClient, active_assessment_config
    ):
        """Test that deleting an active config fails."""
        response = await config_client.delete(
            f"/config-management/assessments/{active_assessment_config.id}"
        )

        assert response.status_code == 400


class TestActivateAssessmentConfig:
    """Tests for POST /config-management/assessments/{config_id}/activate."""

    @pytest.mark.asyncio
    async def test_activate_assessment_config_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully activating a draft config."""
        response = await config_client.post(
            f"/config-management/assessments/{draft_assessment_config.id}/activate",
            json={},  # change_note is optional for activate
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_activate_with_change_note(
        self, config_client: AsyncClient, async_session: AsyncSession
    ):
        """Test activating with an optional change note."""
        config = AssessmentConfig(
            state_code="US_UT",
            code="activatenotetest",
            version=1,
            display_name="Activate Note Test",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        async_session.add(config)
        await async_session.commit()
        await async_session.refresh(config)

        response = await config_client.post(
            f"/config-management/assessments/{config.id}/activate",
            json={"change_note": "Approved by PM for production"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True


class TestDeactivateAssessmentConfig:
    """Tests for POST /config-management/assessments/{config_id}/deactivate."""

    @pytest.mark.asyncio
    async def test_deactivate_assessment_config_success(
        self, config_client: AsyncClient, active_assessment_config
    ):
        """Test successfully deactivating an active config."""
        response = await config_client.post(
            f"/config-management/assessments/{active_assessment_config.id}/deactivate",
            json={"change_note": "Emergency: found bug in scoring logic"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False
        assert data["status"] == "inactive"

    @pytest.mark.asyncio
    async def test_deactivate_requires_change_note(
        self, config_client: AsyncClient, active_assessment_config
    ):
        """Test that change_note is required for deactivation."""
        response = await config_client.post(
            f"/config-management/assessments/{active_assessment_config.id}/deactivate",
            json={},  # Missing change_note
        )

        assert response.status_code == 422  # Validation error


class TestValidateAssessmentYaml:
    """Tests for POST /config-management/assessments/validate."""

    @pytest.mark.asyncio
    async def test_validate_valid_yaml(self, config_client: AsyncClient):
        """Test validating valid YAML returns success."""
        response = await config_client.post(
            "/config-management/assessments/validate",
            json={"yaml_content": VALID_ASSESSMENT_YAML},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0

    @pytest.mark.asyncio
    async def test_validate_invalid_yaml(self, config_client: AsyncClient):
        """Test validating invalid YAML returns errors."""
        response = await config_client.post(
            "/config-management/assessments/validate",
            json={"yaml_content": INVALID_YAML},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0


class TestExportAssessmentConfig:
    """Tests for GET /config-management/assessments/{config_id}/export."""

    @pytest.mark.asyncio
    async def test_export_assessment_config_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully exporting a config as YAML."""
        response = await config_client.get(
            f"/config-management/assessments/{draft_assessment_config.id}/export"
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/x-yaml"
        assert "content-disposition" in response.headers
        assert ".yaml" in response.headers["content-disposition"]


class TestNewVersionAssessmentConfig:
    """Tests for POST /config-management/assessments/{config_id}/new-version."""

    @pytest.mark.asyncio
    async def test_create_new_version_success(
        self, config_client: AsyncClient, active_assessment_config
    ):
        """Test successfully creating a new version from an existing config."""
        response = await config_client.post(
            f"/config-management/assessments/{active_assessment_config.id}/new-version",
            json={"change_note": "Creating new version with updated questions"},
        )

        assert response.status_code == 200
        data = response.json()

        # New version should be a draft
        assert data["status"] == "draft"
        assert data["is_active"] is False
        # Version should be incremented
        assert data["version"] == active_assessment_config.version + 1

    @pytest.mark.asyncio
    async def test_create_new_version_requires_change_note(
        self, config_client: AsyncClient, active_assessment_config
    ):
        """Test that change_note is required for new version."""
        response = await config_client.post(
            f"/config-management/assessments/{active_assessment_config.id}/new-version",
            json={},  # Missing change_note
        )

        assert response.status_code == 422


# =============================================================================
# Tests for Output Config Endpoints
# =============================================================================


class TestListOutputConfigs:
    """Tests for GET /config-management/outputs."""

    @pytest.mark.asyncio
    async def test_list_output_configs_success(
        self, config_client: AsyncClient, draft_output_config
    ):
        """Test successfully listing output configs."""
        response = await config_client.get("/config-management/outputs")

        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 1


class TestGetOutputConfig:
    """Tests for GET /config-management/outputs/{config_id}."""

    @pytest.mark.asyncio
    async def test_get_output_config_success(
        self, config_client: AsyncClient, draft_output_config
    ):
        """Test successfully getting a single output config."""
        response = await config_client.get(
            f"/config-management/outputs/{draft_output_config.id}"
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == str(draft_output_config.id)
        assert data["code"] == "apitestoutput"
        assert "config_yaml" in data


class TestValidateOutputYaml:
    """Tests for POST /config-management/outputs/validate."""

    @pytest.mark.asyncio
    async def test_validate_valid_output_yaml(self, config_client: AsyncClient):
        """Test validating valid output YAML returns success."""
        response = await config_client.post(
            "/config-management/outputs/validate",
            json={"yaml_content": VALID_OUTPUT_YAML},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True


# =============================================================================
# Tests for Audit Log Endpoints
# =============================================================================


class TestListAuditLogs:
    """Tests for GET /config-management/audit."""

    @pytest.mark.asyncio
    async def test_list_audit_logs_success(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test successfully listing audit logs."""
        # First, create some audit activity by updating the config
        await config_client.patch(
            f"/config-management/assessments/{draft_assessment_config.id}",
            json={
                "display_name": "Audit Test",
                "change_note": "Testing audit logs",
            },
        )

        response = await config_client.get("/config-management/audit")

        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        assert "total" in data

    @pytest.mark.asyncio
    async def test_list_audit_logs_filter_by_config_id(
        self, config_client: AsyncClient, draft_assessment_config
    ):
        """Test filtering audit logs by config ID."""
        response = await config_client.get(
            f"/config-management/audit?config_id={draft_assessment_config.id}"
        )

        assert response.status_code == 200
        data = response.json()

        # All logs should be for the specified config
        for item in data["items"]:
            assert item["config_id"] == str(draft_assessment_config.id)


# =============================================================================
# Tests for Authorization
# =============================================================================


class TestAuthorization:
    """Tests for authorization checks on config management endpoints."""

    @pytest.mark.asyncio
    async def test_non_internal_user_forbidden(self, async_session: AsyncSession):
        """Test that non-internal users are forbidden from accessing config management."""
        from httpx import ASGITransport, AsyncClient

        # Create a client with external user override
        from app.auth.auth_core import get_auth_user_context, get_pseudonymized_id
        from main import app as fastapi_app

        async def mock_external_user():
            return {
                "email": "external@example.com",  # Not an internal domain
                "pseudonymized_id": "external_user",
            }

        async def mock_get_pseudonymized_id():
            return "external_user"

        original_overrides = fastapi_app.dependency_overrides.copy()
        # Must override both dependencies since require_internal_user depends on both
        fastapi_app.dependency_overrides[get_pseudonymized_id] = (
            mock_get_pseudonymized_id
        )
        fastapi_app.dependency_overrides[get_auth_user_context] = mock_external_user

        try:
            async with AsyncClient(
                transport=ASGITransport(app=fastapi_app), base_url="http://test"
            ) as external_client:
                response = await external_client.get("/config-management/assessments")

                assert response.status_code == 403
                assert "Recidiviz staff" in response.json()["detail"]
        finally:
            fastapi_app.dependency_overrides = original_overrides
