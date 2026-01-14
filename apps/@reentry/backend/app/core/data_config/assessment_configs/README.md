# Assessment Configuration Files

This directory contains YAML configuration files that define assessment structures for different states.

## Models

- **File Model:** `AssessmentConfigFile` - Pydantic model for validating YAML files (in `app/core/data_config/assessment_configs/`)
- **Database Model:** `AssessmentConfig` - SQLModel table for storing configs (in `app/models/assessment_config.py`)

The database model stores metadata (state_code, code, version, display_name, description) in columns and the full YAML content in the `config_yaml` field.

## Loader

A `ConfigLoader` exists in `app/utils/config_loader.py` for loading and caching validated configurations from the database. The loader:
- Queries configs by UUID from the database
- Validates YAML content using `AssessmentFileLoader.validate_yaml_content()`
- Caches validated pydantic models for performance
- Uses `list_assessment_configs(state_code, session)` to list configs by state

## File Naming Convention

Files should be named: `{STATE_CODE}-{ASSESSMENT_CODE}-v{VERSION}.yaml`

Example: `UT-CCCI-v0.yaml`

**Note:** Assessment codes are normalized when loaded (converted to lowercase and punctuation removed). This means `CCCI`, `ccci`, `C.C.C.I`, and `c-c-c-i` are all treated as equivalent.

## YAML Structure

### Complete Example

See `UT-CCCI-v0.yaml` for a complete working example.

### Schema

```yaml
metadata:
  state_code: str              # State code (e.g., "US_UT")
  code: str                    # Assessment identifier (e.g., "CCCI") -- doesn't need to be unique
  version: int                 # Version number (e.g., 0)
  metadata_type: "assessment"  # Type identifier (default: "assessment")
  display_name: str            # Human-readable name
  description: str             # Optional description of the assessment

  (tuple state_code, code, version should be unique)

intake:
  intake_type: str             # Type of intake ("transcription", "conversation" or"external" cf apps/@reentry/backend/app/models/intake.py), not enforced yet
  scoring: str                 # Assessment scoring type: "lsir", "oras_pit", or "oras_rt" (Updated Jan-8-2026:all assessment code related removed from the workflow )
  scoring_model:               # LLM model configuration for scoring
    provider: str              # Model provider: 'openai', 'anthropic', or 'google'
    name: str                  # Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash')
    version: str               # Optional model version (e.g., '2024-11-20', '20241022', 'exp-0205')
  chat_model:                  # Optional LLM model configuration for chat
    provider: str              # Model provider: 'openai', 'anthropic', or 'google'
    name: str                  # Model name
    version: str               # Optional model version
  prompts:                     # Optional bot prompts configuration
    role: str                  # Optional role for the bot
    tone: str                  # Optional tone for the bot
    system_message: str        # Optional system message
    opening_remarks: str       # Optional opening remarks
  sections:                    # Optional list of intake sections
    - title: str               # Section title
      description: str         # User-facing description of the section
      required_information: |  # Multi-line string describing what info to collect
        Information requirements go here...
        Can use multiple lines with formatting

    - title: str               # Additional sections...
      description: str
      required_information: |
        ...

outputs:
  codes:
  - output_code_1              # List of output codes (must be defined in output_configs)
  - output_code_2              # codes are also normalized (lowercase, no punctuation)
```

## Notes

- Extra fields in the YAML are ignored
- The configuration is frozen once loaded (immutable)
- All fields are required unless specified
- This replaces the deprecated /intakesections
