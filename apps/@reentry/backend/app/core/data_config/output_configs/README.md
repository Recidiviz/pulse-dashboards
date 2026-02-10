# Output Configuration Schema

This directory contains the Pydantic models and loaders for output configurations (summaries and action plans).

> **Note:** Output configs are now managed via the **Config Management UI**.
> See [`docs/CONFIG_MANAGEMENT_USER_GUIDE.md`](../../../../docs/CONFIG_MANAGEMENT_USER_GUIDE.md) for usage instructions.

## Files

- `output_config.py` - Pydantic models for summary and action plan configs
- `loader.py` - Validates and parses output config YAML content

## Output Types

| Type | Purpose |
|------|---------|
| `intake_summary` | Generates summaries from intake conversations |
| `action_plan` | Generates action plans with timelines and milestones |

## Intake Summary Schema

```yaml
metadata:
  code: str                    # Output identifier
  version: int                 # Version number
  output_type: "intake_summary"
  display_name: str
  description: str             # Optional

prompts:
  system: str                  # System message (vars: {Conversation}, {Assessments})
  template: str                # Generation template (vars: {Conversation}, {assessment})

model:
  provider: str                # 'openai', 'anthropic', or 'google'
  name: str                    # Model name
  version: str                 # Optional version
```

## Action Plan Schema

```yaml
metadata:
  code: str
  version: int
  output_type: "action_plan"
  display_name: str
  description: str             # Optional

prompts:
  system: str                  # System message
  data_template: str           # Initial prompt (vars: {client_data}, {decision_tree_statements})
  reflexion_initial: str
  reflexion_with_previous_sections: str
  area_of_needs: str
  resources_options: str
  section_generation_with_resources: str
  section_generation_without_resources: str
  section_annotations: str
  section_refinement: str
  timeline_generation: str
  timeline_format: str
  milestones_generation: str
  milestones_refinement: str
  milestones_format: str
  action_plan_generation: str
  edit_section_selection: str
  edit_section_change: str
  edit_timeline: str
  edit_milestones: str
  edit_action_plan_generation: str

structure:
  timeline: bool               # Include timeline (default: false)
  milestones: bool             # Include milestones (default: false)

model:
  provider: str
  name: str
  version: str

small_model:                   # For smaller/faster operations
  provider: str
  name: str
  version: str
```

## Code Normalization

Codes are normalized when stored (lowercase, punctuation removed):
- `CCC_AP`, `ccc_ap`, `CCCAP` → `cccap`

## Using the Loader

```python
from app.core.data_config.output_configs.loader import OutputFileLoader

# Validate YAML content
config = OutputFileLoader.validate_yaml_content(yaml_string)

# Returns IntakeSummaryConfigFile or ActionPlanConfigFile
print(config.metadata.output_type)
print(config.prompts.system)
```
