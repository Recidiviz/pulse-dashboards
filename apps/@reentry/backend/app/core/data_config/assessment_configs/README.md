# Assessment Configuration Schema

This directory contains the Pydantic models and loaders for assessment configurations.

> **Note:** Assessment configs are now managed via the **Config Management UI**.
> See [`docs/CONFIG_MANAGEMENT_USER_GUIDE.md`](../../../../docs/CONFIG_MANAGEMENT_USER_GUIDE.md) for usage instructions.

## Files

- `assessment_config.py` - Pydantic model defining the YAML schema
- `loader.py` - Validates and parses assessment config YAML content

## YAML Schema

```yaml
metadata:
  state_code: str              # State code (e.g., "US_UT")
  code: str                    # Assessment identifier (e.g., "CCCI")
  version: int                 # Version number (e.g., 0)
  metadata_type: "assessment"  # Type identifier (default: "assessment")
  display_name: str            # Human-readable name
  description: str             # Optional description

  (tuple state_code, code, version should be unique)

intake:
  intake_type: str             # Type: "transcription", "conversation", or "external"
  transcription_post_processing_model:
    provider: str              # Model provider: 'openai', 'anthropic', or 'google'
    name: str                  # Model name
    version: str               # Optional model version
  chat_model:                  # Optional LLM model for chat
    provider: str
    name: str
    version: str
  prompts:                     # Optional bot prompts
    role: str
    tone: str
    system_message: str
    opening_remarks: str
  sections:                    # Optional intake sections
    - title: str
      description: str
      required_information: |
        Multi-line description of required info...

outputs:
  codes:
    - output_code_1            # List of output config codes to use
    - output_code_2
```

## Code Normalization

Codes are normalized when stored (lowercase, punctuation removed):
- `CCCI`, `ccci`, `C.C.C.I` → `ccci`

## Using the Loader

```python
from app.core.data_config.assessment_configs.loader import AssessmentFileLoader

# Validate YAML content
config = AssessmentFileLoader.validate_yaml_content(yaml_string)

# Access validated data
print(config.metadata.state_code)
print(config.intake.prompts.role)
for section in config.intake.sections:
    print(section.title)
```
