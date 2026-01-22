# Database-Backed Configuration System

This directory contains assessment and output configuration files that are stored in the database and used by the application at runtime.

## Overview

**Why database-backed configs?**
- **Version tracking:** Every config change creates a new version, allowing us to track evolution over time
- **Immutability:** Old intakes always reference their exact original config, ensuring reproducibility
- **Audit trail:** Can query which prompts, sections, and settings were used for any historical intake
- **Atomic deployment:** Code and configs deploy together in a single transaction, preventing sync issues

**How it works:**
1. **Developer edits** YAML files (version controlled, human-readable)
2. **Script generates** Alembic migration that validates YAML and embeds content
3. **Migration loads** full YAML content into database tables during deployment
4. **Application reads** from database at runtime (fast, cached, queryable)

**Key files:**
- [`app/utils/config_loader.py`](../../utils/config_loader.py) - Runtime API for loading configs
- [`app/models/assessment_config.py`](../../../models/assessment_config.py) - AssessmentConfig table model
- [`app/models/output_config.py`](../../../models/output_config.py) - OutputConfig table model
- [`app/manage/generate_assessment_migration.py`](../../manage/generate_assessment_migration.py) - Assessment migration generator
- [`app/manage/generate_output_migration.py`](../../manage/generate_output_migration.py) - Output migration generator

**Key principle:** YAML files remain in the codebase as the source of truth. The database stores copies for runtime use, versioning, and querying.

---

## Directory Structure

### Assessment Configs (`assessment_configs/`)
Intake conversation definitions with prompts, sections, and required information.
📖 See [assessment_configs/README.md](./assessment_configs/README.md) for YAML structure details

### Output Configs (`output_configs/`)
Summary and action plan templates for generating outputs.
📖 See [output_configs/README.md](./output_configs/README.md) for YAML structure details

**Note:** Action plan configs are optional. Assessment configs can reference only intake summary configs if action plan generation is not needed.

---

## Quick Start: Creating a New Config

### New Assessment Config

```bash
# 1. Copy and edit YAML
cp assessment_configs/UT-CCCI-v0.yaml assessment_configs/UT-CCCI-v1.yaml
vim assessment_configs/UT-CCCI-v1.yaml
# - Update metadata.version to 1
# - Make your changes (prompts, sections, etc.)

# 2. Generate migration (validates YAML, checks references, creates alembic migration)
uv run python -m app.manage generate-assessment-migration UT-CCCI-v1.yaml

# 3. Test locally
uv run alembic upgrade head
# ... test the intake with new config ...
uv run alembic downgrade -1  # rollback if needed

# 4. Commit both files together
git add assessment_configs/UT-CCCI-v1.yaml alembic/versions/*_add_ut_ccci_v1.py
git commit -m "Add UT-CCCI v1 with updated prompts"
git push
```

### New Output Config

```bash
# 1. Copy and edit YAML
cp output_configs/summary-default-v0.yaml output_configs/summary-ccci-v0.yaml
vim output_configs/summary-ccci-v0.yaml
# - Update metadata.code to match assessment reference
# - Update metadata.output_type (intake_summary or action_plan)
# - Customize prompts and formatting

# 2. Generate migration
uv run python -m app.manage generate-output-migration summary-CCCI-v0.yaml

# 3. Test and commit
uv run alembic upgrade head
git add output_configs/summary-ccci-v0.yaml alembic/versions/*
git commit -m "Add CCCI summary config"
```

**Assessment-only workflow:** To create an assessment config without action plan generation, reference only a summary config in the `outputs.codes` list. The plan creation workflow will automatically skip decision tree selection and plan generation when no action plan config is found.

---

## Using Configs in Code

```python
from app.utils.config_loader import ConfigLoader

# When creating intakes - get the active config
config = await ConfigLoader.get_active_assessment_config(
    state_code="US_UT",
    code="CCCI",  # Automatically normalized (CCCI → ccci)
    session=session
)

if not config:
    raise ValueError("No active config found")

intake = Intake(
    assessment_config_id=config.id,
    client_pseudo_id=client.id,
    ...
)

# During conversation - load validated config with full YAML content
config = await ConfigLoader.load_assessment_config(
    config_id=intake.assessment_config_id,
    session=session
)

# Access config data (fully validated Pydantic model)
prompts = config.intake.prompts
sections = config.intake.sections
for section in sections:
    print(f"{section.title}: {section.description}")

# Loading output configs referenced by assessment
summary_config = await ConfigLoader.load_summary_config(
    assessment_id=intake.assessment_config_id,
    session=session
)

plan_config = await ConfigLoader.load_plan_config(
    assessment_id=intake.assessment_config_id,
    session=session
)
```

**Full API documentation:** See [`app/utils/config_loader.py`](../../utils/config_loader.py) for all methods

**Caching:** ConfigLoader caches validated configs by UUID for performance (first load queries DB + validates, subsequent loads return cached models)

---

## Database Tables

Three tables store the configuration system:

### 1. `assessmentconfig`
Stores intake assessment configs (one per state + code + version)

**Key fields:** `id`, `state_code`, `code`, `version`, `config_yaml` (TEXT), `is_active`
**Constraints:** UNIQUE on `(state_code, code, version)`, only one version `is_active` at a time
**Model:** [`app/models/assessment_config.py`](../../../models/assessment_config.py)

### 2. `outputconfig`
Stores output templates (summaries, action plans)

**Key fields:** `id`, `output_type` (enum), `code`, `version`, `config_yaml` (TEXT), `is_active`
**Constraints:** UNIQUE on `(code, version)`
**Model:** [`app/models/output_config.py`](../../../models/output_config.py)

### 3. `intake.assessment_config_id`
Foreign key linking each intake to its assessment config

**Why store full YAML in database?**
- Immutability: Old intakes always reference their exact original config
- Auditability: Can query which config was used for any intake
- Performance: Application reads from database (cached), not files

---

## Key Rules

### ✅ DO

- **Create new versions** instead of editing existing ones (old intakes depend on old versions)
- **Use migration generator scripts** - they validate YAML and check references automatically
- **Commit YAML + migration together** in same commit (atomic deployment)
- **Test migrations locally** before deploying (`alembic upgrade head` then `downgrade -1`)
- **Keep YAML files in repo** - they're the source of truth, not just migration inputs

### ❌ DON'T

- **Never edit existing config versions** - breaks historical intakes (always create v1, v2, etc.)
- **Never edit configs directly in database** - breaks version control and audit trail
- **Don't write migrations manually** - use generators (they handle normalization, validation, activation)
- **Don't skip validation** - migration generators catch broken references and invalid YAML

---

## How Versioning Works

**Immutability:**
- Each version is frozen once created
- Old intakes always reference their original config version
- New intakes use the currently active version

**Version numbers:**
- Integers: 0, 1, 2, 3... (start at 0, increment for each change)
- Stored in database and YAML metadata

**Code normalization:**
- Codes are normalized to lowercase, punctuation removed
- "CCCI", "ccci", "C.C.C.I" all become "ccci" in database
- Queries work regardless of how you write the code

**Active versions:**
- Only one version per `(state_code, code)` can be `is_active=true`
- Migrations automatically deactivate old versions and activate new ones
- Use `ConfigLoader.get_active_assessment_config()` to get the current active version

**Migration process:**
1. Insert new config row with full YAML content
2. Set `is_active=false` on all other versions
3. Set `is_active=true` on new version

---

## Common Tasks

### Testing a Config Locally

```bash
# Create YAML file and generate migration
uv run python -m app.manage generate-assessment-migration UT-CCCI-v1.yaml

# Apply migration locally
uv run alembic upgrade head

# Test creating an intake with the new config
# ... run your tests ...

# Rollback if you need to make changes
uv run alembic downgrade -1

# Make changes to YAML, regenerate migration, try again
```

### Finding Which Config an Intake Used

```sql
SELECT ac.state_code, ac.code, ac.version, ac.display_name
FROM assessmentconfig ac
JOIN intake i ON i.assessment_config_id = ac.id
WHERE i.id = '<intake-id>';
```

Or in Python:
```python
intake = await session.get(Intake, intake_id)
config = await ConfigLoader.load_assessment_config(
    intake.assessment_config_id, session
)
print(f"Used config: {config.metadata.state_code}/{config.metadata.code} v{config.metadata.version}")
```

### Rolling Back a Config Deployment

Since deployment automatically runs `alembic upgrade head`, you can't simply downgrade. Instead, create a new migration to deactivate the problematic version:

**Option 1: Reactivate previous version (recommended)**
```python
# Create a new migration manually
uv run alembic revision -m "reactivate_ut_ccci_v0"

# In the migration file:
def upgrade() -> None:
    # Deactivate problematic version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 1
    """)

    # Reactivate previous version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 0
    """)

def downgrade() -> None:
    # Reverse the change
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 1
    """)

    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 0
    """)
```

**Option 2: Delete the version entirely (if never used)**
```python
def upgrade() -> None:
    # Only safe if no intakes reference this config!
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 1
    """)

    # Reactivate previous version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 0
    """)
```

**Then deploy normally:**
```bash
git add alembic/versions/*_reactivate_ut_ccci_v0.py
git commit -m "Reactivate UT-CCCI v0"
git push
```

**Result:** New intakes will use the reactivated version. Old intakes remain unaffected (still reference their config by UUID).

### Listing Available Configs

```python
# List all configs for a state
configs = await ConfigLoader.list_assessment_configs(
    state_code="US_UT",
    session=session
)

for config in configs:
    print(f"{config.code} v{config.version} - active: {config.is_active}")
```

---

## Testing and Evaluation Commands

### Testing Summary Generation

Use `evaluate-summary` to test intake summary generation with fake conversation and assessment data:

```bash
# With default data (recommended for quick testing)
uv run python -m app.manage evaluate-summary summary-default-v0.yaml

# With custom conversation and assessment JSON files
uv run python -m app.manage evaluate-summary summary-CCCI-v0.yaml \
  --conversation-file path/to/conversation.json \
  --assessment-file path/to/assessment.json
```

**What it does:**
- Loads an output config file by name
- Uses default conversation and assessment data (or loads from JSON files)
- Runs the summary generation pipeline
- Displays both assessment summary and client summary

**Default data includes:**
- Simple 6-message conversation covering education, employment, housing, family, and substance use
- Mock ORAS assessment with scores for key risk areas

### Testing Full Conversations

Use `headless-conversation-eval` to test complete intake conversations with AI-simulated clients:

```bash
# Test with a specific assessment config file
uv run python -m app.manage headless-conversation-eval UT-CCCI-v0.yaml
```

**What it does:**
- Loads an assessment config file by name
- Simulates complete intake conversations with AI-generated client responses
- Evaluates conversation quality (tone, repetition, coverage, flow)
- Saves detailed evaluation results with metrics and recommendations

### Interactive Conversation Testing

Use `test-conversation` to manually test intake conversations:

```bash
# Test with a specific assessment config file
uv run python -m app.manage test-conversation UT-CCCI-v0.yaml
```

**What it does:**
- Loads an assessment config file by name
- Starts an interactive conversation where you type client responses
- Tests the full intake flow with real conversation graph logic

**All commands now accept file names** (e.g., `UT-CCCI-v0.yaml`, `summary-default-v0.yaml`) instead of requiring database IDs.

---

## Architecture Notes

### Two-Layer Validation

1. **File models (Pydantic)** - Validate YAML structure and fields
   - `AssessmentConfigFile`, `IntakeSummaryConfigFile`, `ActionPlanConfigFile`
   - Located in `app/core/data_config/`

2. **Database models (SQLModel)** - Map to database tables
   - `AssessmentConfig`, `OutputConfig`
   - Located in `app/models/`

3. **ConfigLoader** - Bridges file and database models
   - Loads from database by UUID
   - Validates YAML content using file loaders
   - Caches validated Pydantic models
   - Located in `app/utils/config_loader.py`

### Migration Generation

**Scripts:**
- `app/manage/generate_assessment_migration.py` - Assessment configs
- `app/manage/generate_output_migration.py` - Output configs

**Templates:**
- `app/manage/templates/assessment_migration.py.tmpl`
- `app/manage/templates/output_migration.py.tmpl`

**What they do:**
1. Read and validate YAML file
2. Check that referenced output configs exist
3. Extract metadata and normalize codes
4. Generate migration file from template with SQL to insert config

---

## Deployment

Deployment is automatic with normal process:

```bash
# After git push, deployment process runs:
# 1. Pull new code (includes new YAML file)
# 2. Run: alembic upgrade head
#    - Migration reads YAML file from disk
#    - Migration inserts config into database
#    - Migration activates new version
# 3. Restart application
#    - ConfigLoader reads new config from database
```

**Result:** New intakes use new version, old intakes still reference their original version.

**Refresh configs in db:**
For iterating on a new config version before production deployment, use `uv run python -m app.manage refresh-configs` locally or *redeploy* and run the `refresh-configs` Cloud Run job to sync YAML changes to the database. Always create new versions via migrations for production deployments to maintain version immutability.
If you make breaking changes to the configs, you need to dereploy and use the refresh cloud run job to update the old configs.
see (apps/@reentry/backend/deploy/jobs/docs/REFRESH_CONFIGS_README.md)[apps/@reentry/backend/deploy/jobs/docs/REFRESH_CONFIGS_README.md]

---

## Summary

**The system provides:**
- ✅ Version tracking - every config change is versioned
- ✅ Immutability - old intakes always reference their original config
- ✅ Audit trail - can query which config was used for any intake
- ✅ Atomic deployment - YAML + migration deployed together
- ✅ Type safety - Pydantic validation for all configs
- ✅ Performance - cached configs loaded from database

**Key concepts:**
- YAML files = source of truth (edit these)
- Database = runtime storage (query from here)
- Migrations = bridge between them
- ConfigLoader = typed API with caching
- Versions = immutable and tracked
