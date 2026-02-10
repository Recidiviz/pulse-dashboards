# Database-Backed Configuration System

This directory contains the schema definitions and loaders for assessment and output configurations that are stored in the database.

## Config Management UI

**Configs are now managed via the Config Management UI** in the Reentry dashboard.

- **Access:** Log in with a Recidiviz account → Click "Config" in navigation
- **Documentation:** See [`docs/CONFIG_MANAGEMENT_USER_GUIDE.md`](../../../docs/CONFIG_MANAGEMENT_USER_GUIDE.md)
- **Technical Design:** See [`docs/design/CONFIG_MANAGEMENT_UI_DESIGN.md`](../../../docs/design/CONFIG_MANAGEMENT_UI_DESIGN.md)

## Directory Structure

### Assessment Configs (`assessment_configs/`)
- `assessment_config.py` - Pydantic model defining the YAML schema
- `loader.py` - Validates and parses assessment config YAML

### Output Configs (`output_configs/`)
- `output_config.py` - Pydantic models for summary and action plan configs
- `loader.py` - Validates and parses output config YAML

### Decision Trees (`decisiontrees/`)
- Mermaid diagrams and text files for decision tree visualizations

## How It Works

1. **Users create/edit configs** via the Config Management UI
2. **Configs are stored** in the database (`assessmentconfig`, `outputconfig` tables)
3. **Loaders validate** YAML content using Pydantic models
4. **ConfigLoader** provides runtime API for accessing configs

## Key Principles

- **Immutability:** Each version is frozen once created
- **Version tracking:** Every change creates a new version
- **Audit trail:** All actions are logged with user email and timestamp
- **Active version control:** Only one version per config code can be active

## Using Configs in Code

```python
from app.utils.config_loader import ConfigLoader

# Get the active config for a state/code
config = await ConfigLoader.get_active_assessment_config(
    state_code="US_UT",
    code="CCCI",
    session=session
)

# Load a specific config by ID
config = await ConfigLoader.load_assessment_config(
    config_id=intake.assessment_config_id,
    session=session
)

# Access config data (validated Pydantic model)
prompts = config.intake.prompts
sections = config.intake.sections
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `assessmentconfig` | Stores intake assessment configs |
| `outputconfig` | Stores summary and action plan configs |
| `config_audit_log` | Tracks all config operations |

## Migration from CLI Workflow

The previous CLI-based workflow (`generate-assessment-migration`, `generate-output-migration`) has been deprecated. Use the Config Management UI instead:

1. **Import existing YAML:** Config → Import YAML → Upload file
2. **Create new configs:** Config → New Config or "Create New Version"
3. **Move between environments:** Export YAML → Import in target environment
