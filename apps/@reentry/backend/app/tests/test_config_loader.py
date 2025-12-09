from pathlib import Path
from uuid import uuid4

import pytest

from app.core.data_config.assessment_configs.assessment_config import (
    AssessmentConfigFile,
)
from app.core.data_config.output_configs.output_config import (
    ActionPlanConfigFile,
    IntakeSummaryConfigFile,
)
from app.core.db import AsyncSession
from app.models.assessment_config import AssessmentConfig
from app.utils.config_loader import (
    ConfigLoader,
    _assessment_cache,
    _plan_cache,
    _summary_cache,
)

# Path to test fixtures
TEST_FIXTURES_DIR = Path(__file__).parent / "test_fixtures"
ASSESSMENT_FIXTURES_DIR = TEST_FIXTURES_DIR / "assessment_configs"
OUTPUT_FIXTURES_DIR = TEST_FIXTURES_DIR / "output_configs"


def load_fixture_yaml(fixture_path: Path) -> str:
    """Load YAML content from a fixture file."""
    return fixture_path.read_text()


@pytest.fixture
def clear_caches():
    """Clear module-level caches before and after each test"""
    _assessment_cache.clear()
    _summary_cache.clear()
    _plan_cache.clear()

    yield
    _assessment_cache.clear()
    _summary_cache.clear()
    _plan_cache.clear()


@pytest.mark.asyncio
async def test_load_assessment_config(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading and validating assessment config from database"""
    # Get UUID for UT-CCCI-v0
    config_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # Load the config
    loaded = await ConfigLoader.load_assessment_config(config_id, async_session)

    # Verify it returns validated AssessmentConfigFile
    assert isinstance(loaded, AssessmentConfigFile)
    assert loaded.metadata.state_code == "US_UT"
    assert loaded.metadata.code == "CCCI"
    assert loaded.metadata.version == 0
    assert loaded.metadata.display_name == "Test CCCI v0"
    assert loaded.intake.intake_type == "conversation"
    assert loaded.intake.scoring == "lsir"
    assert len(loaded.intake.sections) == 1
    assert loaded.intake.sections[0].title == "Employment"
    assert loaded.outputs.codes == ["intake_summary_ccci", "action_plan_ccci"]


@pytest.mark.asyncio
async def test_load_assessment_config_caching(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test that assessment configs are cached after first load"""
    # Get UUID for UT-CCCI-v0
    config_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # First load - should query database
    loaded1 = await ConfigLoader.load_assessment_config(config_id, async_session)

    # Verify it's cached
    assert config_id in _assessment_cache

    # Second load - should use cache
    loaded2 = await ConfigLoader.load_assessment_config(config_id, async_session)

    # Both should be the same object from cache
    assert loaded1 is loaded2


@pytest.mark.asyncio
async def test_load_assessment_config_multiple_versions(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading multiple versions of the same assessment"""
    # Get UUIDs for different versions
    config_id_v0 = seed_configs["assessments"][("US_UT", "CCCI", 0)]
    config_id_v1 = seed_configs["assessments"][("US_UT", "CCCI", 1)]
    config_id_v2 = seed_configs["assessments"][("US_UT", "CCCI", 2)]

    # Load each version
    loaded_v0 = await ConfigLoader.load_assessment_config(config_id_v0, async_session)
    loaded_v1 = await ConfigLoader.load_assessment_config(config_id_v1, async_session)
    loaded_v2 = await ConfigLoader.load_assessment_config(config_id_v2, async_session)

    # Verify versions are correct
    assert loaded_v0.metadata.version == 0
    assert loaded_v1.metadata.version == 1
    assert loaded_v2.metadata.version == 2

    # Verify all three are cached separately
    assert config_id_v0 in _assessment_cache
    assert config_id_v1 in _assessment_cache
    assert config_id_v2 in _assessment_cache


@pytest.mark.asyncio
async def test_load_assessment_config_different_states(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading configs from different states"""
    # Get UUIDs for different states
    ut_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]
    ix_id = seed_configs["assessments"][("US_IX", "FACR", 0)]
    az_id = seed_configs["assessments"][("US_AZ", "default", 0)]

    # Load each config
    loaded_ut = await ConfigLoader.load_assessment_config(ut_id, async_session)
    loaded_ix = await ConfigLoader.load_assessment_config(ix_id, async_session)
    loaded_az = await ConfigLoader.load_assessment_config(az_id, async_session)

    # Verify state codes
    assert loaded_ut.metadata.state_code == "US_UT"
    assert loaded_ix.metadata.state_code == "US_IX"
    assert loaded_az.metadata.state_code == "US_AZ"

    # Verify codes
    assert loaded_ut.metadata.code == "CCCI"
    assert loaded_ix.metadata.code == "FACR"
    assert loaded_az.metadata.code == "default"


@pytest.mark.asyncio
async def test_load_assessment_config_not_found(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test that loading non-existent assessment raises ValueError"""
    fake_id = uuid4()

    with pytest.raises(ValueError, match=f"Assessment config not found: {fake_id}"):
        await ConfigLoader.load_assessment_config(fake_id, async_session)


@pytest.mark.asyncio
async def test_load_summary_config_by_assessment(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading intake summary config via assessment"""
    # Get UUID for UT-CCCI-v0 (references intake_summary_ccci)
    assessment_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # Load the summary config
    loaded = await ConfigLoader.load_summary_config(assessment_id, async_session)

    # Verify it returns validated IntakeSummaryConfigFile
    assert isinstance(loaded, IntakeSummaryConfigFile)
    assert loaded.metadata.code == "intake_summary_ccci"
    assert loaded.metadata.output_type == "intake_summary"
    assert loaded.metadata.version == 0
    assert loaded.prompts.system == "test"
    assert loaded.prompts.template == "test"


@pytest.mark.asyncio
async def test_load_plan_config_by_assessment(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading action plan config via assessment"""
    # Get UUID for UT-CCCI-v0 (references action_plan_ccci)
    assessment_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # Load the plan config
    loaded = await ConfigLoader.load_plan_config(assessment_id, async_session)

    # Verify it returns validated ActionPlanConfigFile
    assert isinstance(loaded, ActionPlanConfigFile)
    assert loaded.metadata.code == "action_plan_ccci"
    assert loaded.metadata.output_type == "action_plan"
    assert loaded.metadata.version == 0
    assert loaded.structure.timeline is False
    assert loaded.structure.milestones is False


@pytest.mark.asyncio
async def test_load_summary_config_caching(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test that summary configs are cached after first load"""
    # Get UUID for UT-CCCI-v0
    assessment_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # First load - should query database
    loaded1 = await ConfigLoader.load_summary_config(assessment_id, async_session)

    # Verify it's cached in the output cache
    assert assessment_id in _summary_cache

    # Second load - should use cache
    loaded2 = await ConfigLoader.load_summary_config(assessment_id, async_session)

    # Both should be the same object from cache
    assert loaded1 is loaded2


@pytest.mark.asyncio
async def test_load_summary_config_multiple_versions(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading summary configs from different assessment versions"""
    # Get UUIDs for different assessment versions
    assessment_id_v0 = seed_configs["assessments"][("US_UT", "CCCI", 0)]
    assessment_id_v1 = seed_configs["assessments"][("US_UT", "CCCI", 1)]

    # Load summary config for each version
    loaded_v0 = await ConfigLoader.load_summary_config(assessment_id_v0, async_session)
    loaded_v1 = await ConfigLoader.load_summary_config(assessment_id_v1, async_session)

    # Both should return valid summaries
    assert loaded_v0 is not None
    assert loaded_v1 is not None
    assert isinstance(loaded_v0, IntakeSummaryConfigFile)
    assert isinstance(loaded_v1, IntakeSummaryConfigFile)

    # Verify both are cached separately in output cache
    assert assessment_id_v0 in _summary_cache
    assert assessment_id_v1 in _summary_cache


@pytest.mark.asyncio
async def test_load_plan_config_caching(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test that plan configs are cached after first load"""
    # Get UUID for UT-CCCI-v0 (references action_plan_ccci)
    assessment_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # First load - should query database
    loaded1 = await ConfigLoader.load_plan_config(assessment_id, async_session)

    # Verify it's cached in the output cache
    assert assessment_id in _plan_cache

    # Second load - should use cache
    loaded2 = await ConfigLoader.load_plan_config(assessment_id, async_session)

    # Both should be the same object from cache
    assert loaded1 is loaded2


@pytest.mark.asyncio
async def test_list_assessment_configs(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test listing assessment configs by state code"""
    # List configs for US_UT (should have CCCI v0, v1, v2)
    ut_configs = await ConfigLoader.list_assessment_configs("US_UT", async_session)

    # Should return 3 configs for US_UT
    assert len(ut_configs) == 3
    assert all(isinstance(c, AssessmentConfig) for c in ut_configs)
    assert all(c.state_code == "US_UT" for c in ut_configs)
    assert all(c.code == "CCCI" for c in ut_configs)

    # List configs for US_IX (should have FACR v0)
    ix_configs = await ConfigLoader.list_assessment_configs("US_IX", async_session)

    # Should return 1 config for US_IX
    assert len(ix_configs) == 1
    assert ix_configs[0].state_code == "US_IX"
    assert ix_configs[0].code == "FACR"

    # List configs for US_AZ (should have default v0)
    az_configs = await ConfigLoader.list_assessment_configs("US_AZ", async_session)

    # Should return 1 config for US_AZ
    assert len(az_configs) == 1
    assert az_configs[0].state_code == "US_AZ"
    assert az_configs[0].code == "default"


@pytest.mark.asyncio
async def test_list_assessment_configs_empty(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test listing configs for state with no configs"""
    configs = await ConfigLoader.list_assessment_configs("US_CA", async_session)
    assert len(configs) == 0


@pytest.mark.asyncio
async def test_load_summary_config(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading summary config for an assessment"""
    # Get UUID for UT-CCCI-v0 (references intake_summary_ccci)
    assessment_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # Load summary config
    summary = await ConfigLoader.load_summary_config(assessment_id, async_session)

    # Should return the IntakeSummaryConfigFile
    assert summary is not None
    assert isinstance(summary, IntakeSummaryConfigFile)
    assert summary.metadata.code == "intake_summary_ccci"
    assert summary.metadata.output_type == "intake_summary"


@pytest.mark.asyncio
async def test_load_summary_config_not_found(async_session: AsyncSession, clear_caches):
    """Test loading summary config when output is not in database"""
    # Load YAML from fixture file
    yaml_content = load_fixture_yaml(
        ASSESSMENT_FIXTURES_DIR / "TEST-inexistant_output-v0.yaml"
    )

    assessment_config = AssessmentConfig(
        state_code="US_CA",
        code="inexistant_output",
        version=0,
        display_name="Test No Output",
        config_yaml=yaml_content,
    )
    async_session.add(assessment_config)
    await async_session.commit()
    await async_session.refresh(assessment_config)

    # Load summary config - should return None (output not in database)
    summary = await ConfigLoader.load_summary_config(
        assessment_config.id, async_session
    )
    assert summary is None


@pytest.mark.asyncio
async def test_load_plan_config_not_found(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading plan config when assessment has no plan output"""
    # UT-CCCI-v0 now references both intake_summary_ccci and action_plan_ccci
    # So we need to use an assessment that doesn't reference a plan output
    assessment_id = seed_configs["assessments"][("US_AZ", "default", 0)]

    # Load plan config - should return None (no plan output referenced)
    plan = await ConfigLoader.load_plan_config(assessment_id, async_session)
    assert plan is None


@pytest.mark.asyncio
async def test_load_summary_config_with_version(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test loading different versions of summary config"""
    # Get UUID for UT-CCCI-v1 (should reference intake_summary_ccci if it exists in fixture)
    assessment_id = seed_configs["assessments"][("US_UT", "CCCI", 1)]

    # Load summary config
    summary = await ConfigLoader.load_summary_config(assessment_id, async_session)

    assert summary is not None
    assert isinstance(summary, IntakeSummaryConfigFile)


# =============================================================================
# Tests for get_active_assessment_config_by_state() - Migration Support
# =============================================================================


@pytest.mark.asyncio
async def test_get_active_assessment_config_by_state_success(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test successfully getting active config by state code"""
    # UT-CCCI configs should be active
    config = await ConfigLoader.get_active_assessment_config_by_state(
        "US_UT", async_session
    )

    assert config is not None
    assert isinstance(config, AssessmentConfig)
    assert config.state_code == "US_UT"
    assert config.code == "CCCI"
    assert config.is_active is True


@pytest.mark.asyncio
async def test_get_active_assessment_config_by_state_multiple_states(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test getting active configs for different states"""
    # Test US_UT
    ut_config = await ConfigLoader.get_active_assessment_config_by_state(
        "US_UT", async_session
    )
    assert ut_config is not None
    assert ut_config.state_code == "US_UT"

    # Test US_IX
    ix_config = await ConfigLoader.get_active_assessment_config_by_state(
        "US_IX", async_session
    )
    assert ix_config is not None
    assert ix_config.state_code == "US_IX"

    # Test US_AZ
    az_config = await ConfigLoader.get_active_assessment_config_by_state(
        "US_AZ", async_session
    )
    assert az_config is not None
    assert az_config.state_code == "US_AZ"


@pytest.mark.asyncio
async def test_get_active_assessment_config_by_state_not_found(
    async_session: AsyncSession, clear_caches
):
    """Test that method returns None when no active config found for state"""
    config = await ConfigLoader.get_active_assessment_config_by_state(
        "US_CA", async_session
    )

    assert config is None


@pytest.mark.asyncio
async def test_get_active_assessment_config_by_state_multiple_active_error(
    async_session: AsyncSession, clear_caches
):
    """Test that method raises ValueError when multiple active configs found"""
    # Load YAML from existing fixture files
    yaml_content = load_fixture_yaml(ASSESSMENT_FIXTURES_DIR / "UT-CCCI-v0.yaml")

    config1 = AssessmentConfig(
        state_code="US_CA",
        code="CCCI",
        version=0,
        display_name="Config 1",
        config_yaml=yaml_content,
        is_active=True,
    )
    config2 = AssessmentConfig(
        state_code="US_CA",
        code="FACR",
        version=0,
        display_name="Config 2",
        config_yaml=yaml_content,
        is_active=True,
    )
    async_session.add(config1)
    async_session.add(config2)
    await async_session.commit()

    # Should raise ValueError for multiple active configs
    with pytest.raises(
        ValueError, match="Multiple active assessment configs found for state US_CA"
    ):
        await ConfigLoader.get_active_assessment_config_by_state("US_CA", async_session)


@pytest.mark.asyncio
async def test_database_has_one_active_config_per_state(
    async_session: AsyncSession, clear_caches
):
    """Test that the actual database (seeded by migrations) has exactly one active config per state.

    This test does NOT seed any configs - it validates the real database state after migrations.
    This is critical for the migration to work correctly - each state should have
    exactly one active assessment config at any given time.
    """
    from collections import Counter

    from sqlmodel import select

    # Query all active configs from the actual database
    result = await async_session.exec(
        select(AssessmentConfig).where(AssessmentConfig.is_active)
    )
    active_configs = result.all()

    # Count active configs per state
    states_count = Counter(config.state_code for config in active_configs)

    # Verify each state has exactly one active config
    for state, count in states_count.items():
        assert count == 1, (
            f"State {state} has {count} active configs, expected 1. "
            f"This violates the constraint that each state should have exactly one active config. "
            f"Check your migrations and config seeding logic."
        )

    # Note: We don't assert specific states exist here because the test DB might be empty initially.
    # The important invariant is: IF a state has active configs, it should have exactly one.


@pytest.mark.asyncio
async def test_seed_configs_maintains_one_active_per_state(
    async_session: AsyncSession, seed_configs, clear_caches
):
    """Test that seed_configs fixture maintains the one-active-per-state constraint.

    After seeding test configs, verify each state still has exactly one active config.
    """
    from collections import Counter

    from sqlmodel import select

    # Query all active configs after seeding
    result = await async_session.exec(
        select(AssessmentConfig).where(AssessmentConfig.is_active)
    )
    active_configs = result.all()

    # Count active configs per state
    states_count = Counter(config.state_code for config in active_configs)

    # Verify each state has exactly one active config
    for state, count in states_count.items():
        assert count == 1, (
            f"State {state} has {count} active configs after seeding, expected 1. "
            f"The seed_configs fixture should deactivate existing configs before seeding."
        )

    # Verify we have configs for the expected test states
    assert "US_UT" in states_count, "Expected US_UT to have an active config"
    assert "US_IX" in states_count, "Expected US_IX to have an active config"
    assert "US_AZ" in states_count, "Expected US_AZ to have an active config"


@pytest.mark.asyncio
async def test_get_active_assessment_config_by_state_ignores_inactive(
    async_session: AsyncSession, clear_caches, seed_configs
):
    """Test that method only returns active configs"""
    # Load YAML from existing fixture file
    yaml_content = load_fixture_yaml(ASSESSMENT_FIXTURES_DIR / "UT-CCCI-v2.yaml")

    # Create inactive config
    inactive_config = AssessmentConfig(
        state_code="TEST",
        code="ut_ccci",
        version=3,
        display_name="Inactive Config",
        config_yaml=yaml_content,
        is_active=False,
    )
    async_session.add(inactive_config)
    await async_session.commit()

    # Should return None (no active configs)
    config = await ConfigLoader.get_active_assessment_config_by_state(
        "TEST", async_session
    )
    assert config is None
