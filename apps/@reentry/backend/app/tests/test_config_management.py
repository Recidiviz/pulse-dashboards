"""Tests for Config Management module."""

import pytest
import pytest_asyncio

from app.crud.config_management import (
    create_assessment_config,
    create_audit_log,
    create_output_config,
    delete_assessment_config,
    get_assessment_config_by_id,
    get_assessment_configs,
    get_audit_logs,
    get_latest_assessment_config_version,
    get_output_config_by_id,
    update_assessment_config,
)
from app.models.assessment_config import AssessmentConfig, ConfigStatus
from app.models.config_audit_log import ConfigAuditAction, ConfigAuditLog, ConfigType
from app.models.output_config import OutputConfig, OutputType
from app.services.config_management.validation import ValidationService

# Sample YAML content for testing
VALID_ASSESSMENT_YAML = """
metadata:
  state_code: US_UT
  code: TEST
  version: 1
  display_name: Test Assessment Config
  description: A test assessment configuration

intake:
  intake_type: conversation
  prompts:
    role: |
      You are a helpful assistant.
    tone: Professional and friendly
    opening_remarks: Hello! Welcome to the assessment.
  sections:
    - title: Introduction
      topics:
        - greeting
        - overview
outputs:
  codes:
    - summary-default
    - plan-default
"""

INVALID_YAML = """
invalid yaml content
  - missing proper structure
    this: will fail
"""

VALID_OUTPUT_YAML = """
metadata:
  output_type: intake_summary
  code: test-summary
  version: 1
  display_name: Test Summary Output
  description: A test summary output configuration

summary:
  model:
    name: gpt-4
    temperature: 0.7
  prompts:
    system: You are a summarizer.
    user: Please summarize the following conversation.
"""


class TestValidationService:
    """Tests for ValidationService."""

    def test_validate_assessment_yaml_invalid_syntax(self):
        """Test validation fails for invalid YAML syntax."""
        result = ValidationService.validate_assessment_yaml(INVALID_YAML)
        assert result.valid is False
        assert len(result.errors) > 0

    def test_validate_assessment_yaml_empty(self):
        """Test validation fails for empty YAML."""
        result = ValidationService.validate_assessment_yaml("")
        assert result.valid is False

    def test_validate_output_yaml_invalid_syntax(self):
        """Test validation fails for invalid output YAML syntax."""
        result = ValidationService.validate_output_yaml(INVALID_YAML)
        assert result.valid is False
        assert len(result.errors) > 0


class TestAssessmentConfigCRUD:
    """Tests for Assessment Config CRUD operations."""

    @pytest_asyncio.fixture
    async def sample_assessment_config(self, async_session):
        """Create a sample assessment config for testing."""
        config = AssessmentConfig(
            state_code="US_UT",
            code="test",
            version=0,
            display_name="Test Config",
            description="Test description",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
            created_by_email="test@recidiviz.org",
        )
        created = await create_assessment_config(async_session, config)
        return created

    @pytest.mark.asyncio
    async def test_create_assessment_config(self, async_session):
        """Test creating a new assessment config."""
        config = AssessmentConfig(
            state_code="US_UT",
            code="new",
            version=0,
            display_name="New Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        created = await create_assessment_config(async_session, config)

        assert created.id is not None
        assert created.state_code == "US_UT"
        assert created.code == "new"
        assert created.version == 0
        assert created.status == ConfigStatus.DRAFT.value

    @pytest.mark.asyncio
    async def test_get_assessment_config_by_id(
        self, async_session, sample_assessment_config
    ):
        """Test retrieving assessment config by ID."""
        config = await get_assessment_config_by_id(
            async_session, sample_assessment_config.id
        )

        assert config is not None
        assert config.id == sample_assessment_config.id
        assert config.display_name == "Test Config"

    @pytest.mark.asyncio
    async def test_get_assessment_config_by_id_not_found(self, async_session):
        """Test retrieving non-existent assessment config."""
        import uuid

        config = await get_assessment_config_by_id(async_session, uuid.uuid4())
        assert config is None

    @pytest.mark.asyncio
    async def test_get_assessment_configs_with_filters(
        self, async_session, sample_assessment_config
    ):
        """Test listing assessment configs with filters."""
        # Create another config with different state
        config2 = AssessmentConfig(
            state_code="US_ID",
            code="other",
            version=0,
            display_name="Other Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        await create_assessment_config(async_session, config2)

        # Filter by state code
        configs = await get_assessment_configs(async_session, state_code="US_UT")
        assert len(configs) == 1
        assert configs[0].state_code == "US_UT"

    @pytest.mark.asyncio
    async def test_get_latest_assessment_config_version(
        self, async_session, sample_assessment_config
    ):
        """Test getting latest version number."""
        # Create another version
        config2 = AssessmentConfig(
            state_code="US_UT",
            code="test",
            version=1,
            display_name="Test Config v1",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        await create_assessment_config(async_session, config2)

        latest = await get_latest_assessment_config_version(
            async_session, "US_UT", "test"
        )
        assert latest == 1

    @pytest.mark.asyncio
    async def test_update_assessment_config(
        self, async_session, sample_assessment_config
    ):
        """Test updating assessment config."""
        sample_assessment_config.display_name = "Updated Name"
        updated = await update_assessment_config(
            async_session, sample_assessment_config
        )

        assert updated.display_name == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_assessment_config_draft(
        self, async_session, sample_assessment_config
    ):
        """Test deleting a draft assessment config."""
        result = await delete_assessment_config(
            async_session, sample_assessment_config.id
        )
        assert result is True

        # Verify deleted
        config = await get_assessment_config_by_id(
            async_session, sample_assessment_config.id
        )
        assert config is None

    @pytest.mark.asyncio
    async def test_delete_assessment_config_non_draft_fails(self, async_session):
        """Test that deleting a non-draft config fails."""
        config = AssessmentConfig(
            state_code="US_UT",
            code="active",
            version=0,
            display_name="Active Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.ACTIVE.value,
            is_active=True,
        )
        created = await create_assessment_config(async_session, config)

        with pytest.raises(ValueError, match="Only draft configs can be deleted"):
            await delete_assessment_config(async_session, created.id)


class TestOutputConfigCRUD:
    """Tests for Output Config CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_output_config(self, async_session):
        """Test creating a new output config."""
        config = OutputConfig(
            output_type=OutputType.intake_summary,
            code="test-summary",
            version=0,
            display_name="Test Summary",
            config_yaml=VALID_OUTPUT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        created = await create_output_config(async_session, config)

        assert created.id is not None
        assert created.output_type == OutputType.intake_summary
        assert created.code == "test-summary"

    @pytest.mark.asyncio
    async def test_get_output_config_by_id(self, async_session):
        """Test retrieving output config by ID."""
        config = OutputConfig(
            output_type=OutputType.action_plan,
            code="test-plan",
            version=0,
            display_name="Test Plan",
            config_yaml=VALID_OUTPUT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        created = await create_output_config(async_session, config)

        retrieved = await get_output_config_by_id(async_session, created.id)
        assert retrieved is not None
        assert retrieved.id == created.id


class TestAuditLogCRUD:
    """Tests for Audit Log CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_audit_log(self, async_session):
        """Test creating an audit log entry."""
        import uuid

        log = ConfigAuditLog(
            config_type=ConfigType.ASSESSMENT.value,
            config_id=uuid.uuid4(),
            action=ConfigAuditAction.CREATED.value,
            performed_by_email="test@recidiviz.org",
            details={"version": 1},
        )
        created = await create_audit_log(async_session, log)

        assert created.id is not None
        assert created.action == ConfigAuditAction.CREATED.value

    @pytest.mark.asyncio
    async def test_get_audit_logs_with_filters(self, async_session):
        """Test retrieving audit logs with filters."""
        import uuid

        config_id = uuid.uuid4()

        # Create multiple logs
        for action in [
            ConfigAuditAction.CREATED,
            ConfigAuditAction.UPDATED,
            ConfigAuditAction.ACTIVATED,
        ]:
            log = ConfigAuditLog(
                config_type=ConfigType.ASSESSMENT.value,
                config_id=config_id,
                action=action.value,
                performed_by_email="test@recidiviz.org",
            )
            await create_audit_log(async_session, log)

        # Filter by config_id
        logs = await get_audit_logs(async_session, config_id=config_id)
        assert len(logs) == 3

        # Filter by action
        logs = await get_audit_logs(
            async_session, action=ConfigAuditAction.ACTIVATED.value
        )
        assert len(logs) == 1
        assert logs[0].action == ConfigAuditAction.ACTIVATED.value


class TestConfigLifecycle:
    """Tests for config lifecycle transitions (simplified model: DRAFT -> ACTIVE -> INACTIVE)."""

    @pytest_asyncio.fixture
    async def draft_assessment_config(self, async_session):
        """Create a draft assessment config for testing."""
        config = AssessmentConfig(
            state_code="US_UT",
            code="lifecycle",
            version=0,
            display_name="Lifecycle Test Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
            created_by_email="test@recidiviz.org",
        )
        return await create_assessment_config(async_session, config)

    @pytest.mark.asyncio
    async def test_activate_draft_config(self, async_session, draft_assessment_config):
        """Test activating a draft config directly (no publish step needed)."""
        from app.services.config_management.lifecycle import LifecycleService

        result = await LifecycleService.activate_assessment_config(
            async_session, draft_assessment_config.id, "test@recidiviz.org"
        )

        assert result.status == ConfigStatus.ACTIVE.value
        assert result.is_active is True

        # Verify the config was updated
        config = await get_assessment_config_by_id(
            async_session, draft_assessment_config.id
        )
        assert config.status == ConfigStatus.ACTIVE.value
        assert config.is_active is True
        assert config.activated_at is not None

    @pytest.mark.asyncio
    async def test_activate_inactive_config(self, async_session):
        """Test reactivating an inactive config."""
        from app.services.config_management.lifecycle import LifecycleService

        config = AssessmentConfig(
            state_code="US_UT",
            code="reactivate",
            version=0,
            display_name="Reactivate Test Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.INACTIVE.value,
            is_active=False,
        )
        created = await create_assessment_config(async_session, config)

        result = await LifecycleService.activate_assessment_config(
            async_session, created.id, "test@recidiviz.org"
        )

        assert result.is_active is True
        assert result.status == ConfigStatus.ACTIVE.value

        # Verify the config was updated
        updated = await get_assessment_config_by_id(async_session, created.id)
        assert updated.is_active is True
        assert updated.status == ConfigStatus.ACTIVE.value

    @pytest.mark.asyncio
    async def test_activate_deactivates_previous(self, async_session):
        """Test that activating a new config deactivates the previous one."""
        from app.services.config_management.lifecycle import LifecycleService

        # Create and set first config as active
        config1 = AssessmentConfig(
            state_code="US_UT",
            code="deactivate",
            version=0,
            display_name="First Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.ACTIVE.value,
            is_active=True,
        )
        created1 = await create_assessment_config(async_session, config1)

        # Create second config as draft
        config2 = AssessmentConfig(
            state_code="US_UT",
            code="deactivate",
            version=1,
            display_name="Second Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
        )
        created2 = await create_assessment_config(async_session, config2)

        result = await LifecycleService.activate_assessment_config(
            async_session, created2.id, "test@recidiviz.org"
        )

        assert result.is_active is True
        assert result.status == ConfigStatus.ACTIVE.value
        assert result.previous_active_id == created1.id

        # Verify first config is now inactive
        config1_updated = await get_assessment_config_by_id(async_session, created1.id)
        assert config1_updated.is_active is False
        assert config1_updated.status == ConfigStatus.INACTIVE.value

    @pytest.mark.asyncio
    async def test_deactivate_active_config(self, async_session):
        """Test deactivating an active config."""
        from app.services.config_management.lifecycle import LifecycleService

        config = AssessmentConfig(
            state_code="US_UT",
            code="deactivate-test",
            version=0,
            display_name="Deactivate Test Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.ACTIVE.value,
            is_active=True,
        )
        created = await create_assessment_config(async_session, config)

        result = await LifecycleService.deactivate_assessment_config(
            async_session, created.id, "test@recidiviz.org"
        )

        assert result.status == ConfigStatus.INACTIVE.value
        assert result.is_active is False

        # Verify the config was updated
        updated = await get_assessment_config_by_id(async_session, created.id)
        assert updated.status == ConfigStatus.INACTIVE.value
        assert updated.is_active is False

    @pytest.mark.asyncio
    async def test_deactivate_already_inactive_is_noop(self, async_session):
        """Test that deactivating an already inactive config is a no-op."""
        from app.services.config_management.lifecycle import LifecycleService

        config = AssessmentConfig(
            state_code="US_UT",
            code="already-inactive",
            version=0,
            display_name="Already Inactive Config",
            config_yaml=VALID_ASSESSMENT_YAML,
            status=ConfigStatus.INACTIVE.value,
            is_active=False,
        )
        created = await create_assessment_config(async_session, config)

        result = await LifecycleService.deactivate_assessment_config(
            async_session, created.id, "test@recidiviz.org"
        )

        assert result.is_active is False
        assert "already inactive" in result.message.lower()
