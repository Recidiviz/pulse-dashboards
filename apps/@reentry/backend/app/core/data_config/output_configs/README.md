# Output Configuration Files

This directory contains YAML configuration files that define output structures (summaries and action plans) for assessments.

## Models

- **File Models:** `IntakeSummaryConfigFile` and `ActionPlanConfigFile` - Pydantic models for validating YAML files (in `app/core/data_config/output_configs/`)
- **Database Model:** `OutputConfig` - SQLModel table for storing both types of configs (in `app/models/output_config.py`)

The database model stores metadata (state_code, code, version, display_name, description, config_type) in columns and the full YAML content in the `config_yaml` field.

## Loader

A `ConfigLoader` exists in `app/utils/config_loader.py` for loading and caching validated configurations from the database. The loader:
- Queries configs by UUID from the database
- Validates YAML content using `OutputFileLoader.validate_yaml_content()`
- Caches validated pydantic models for performance
- Returns `IntakeSummaryConfigFile` or `ActionPlanConfigFile` based on the config type

## File Naming Convention

Files should be named: `{TYPE}-{OUTPUT_CODE}-v{VERSION}.yaml`

Examples:
- `summary-CCCI-v0.yaml`
- `plan-CCCI-v0.yaml`

**Note:** Output codes are normalized when loaded (converted to lowercase and punctuation removed). This means `action_plan_ccci`, `ACTION_PLAN_CCCI`, `action-plan-ccci` are all treated as equivalent.

## YAML Structure

### Intake Summary Config Example

```yaml
metadata:
  code: str                    # Output identifier (e.g., "intake_summary_ccci")
  version: int                 # Version number (e.g., 0)
  output_type: "intake_summary"  # Must be "intake_summary" for summaries
  display_name: str            # Human-readable name
  description: str             # Optional description of the output

prompts:
  system: str                  # Optional system message for intake summary
                               # Variables: {Conversation}, {Assessments}
  template: str                # Optional summary generation prompt template
                               # Variables: {Conversation}, {assessment}

model:                         # LLM model configuration
  provider: str                # Model provider: 'openai', 'anthropic', or 'google'
  name: str                    # Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash')
  version: str                 # Optional model version (e.g., '2024-11-20', '20241022', 'exp-0205')
```

**Important:** All prompt fields are optional. If a prompt field is provided, it will **completely replace** the default prompt (not merge with it). See `summary-default-v0.yaml` for the complete default prompt values.

### Action Plan Config Example

```yaml
metadata:
  code: str                    # Output identifier (e.g., "action_plan_ccci")
  version: int                 # Version number (e.g., 0)
  output_type: "action_plan"   # Must be "action_plan" for plans
  display_name: str            # Human-readable name
  description: str             # Optional description of the output

inputs:
  - str                        # List of input types required (e.g., "intake_summary", "assessment")

prompts:
  # Initial setup
  system: str                  # Optional system message for action plan generation
  data_template: str           # Optional initial user prompt template
                               # Variables: {client_data}, {decision_tree_statements}

  # Reflexion phase
  reflexion_initial: str       # Optional initial reflexion prompt
  reflexion_with_previous_sections: str  # Optional reflexion with context
                                         # Variables: {previous_sections}

  # Area identification
  area_of_needs: str           # Optional prompt for compiling areas of needs/risk
  resources_options: str       # Optional prompt for identifying resource options

  # Section generation
  section_generation_with_resources: str     # Optional section generation with resources
                                             # Variables: {section}, {resources}
  section_generation_without_resources: str  # Optional section generation without resources
                                             # Variables: {section}
  section_annotations: str     # Optional prompt for section annotations
                               # Variables: {section}, {section_content}
  section_refinement: str      # Optional prompt for refining section content
                               # Variables: {section}

  # Timeline generation
  timeline_generation: str     # Optional timeline generation prompt
  timeline_format: str         # Optional timeline formatting prompt

  # Milestones generation
  milestones_generation: str   # Optional milestones generation prompt
  milestones_refinement: str   # Optional milestones refinement prompt
  milestones_format: str       # Optional milestones formatting prompt

  # Final assembly
  action_plan_generation: str  # Optional final action plan generation prompt

  # Edit-specific prompts
  edit_section_selection: str  # Optional section selection for editing
                               # Variables: {sections_titles}
  edit_section_change: str     # Optional section modification prompt
                               # Variables: {section}, {extra_instructions}, {clean_markdown_content}
  edit_timeline: str           # Optional timeline editing prompt
                               # Variables: {extra_instructions}
  edit_milestones: str         # Optional milestones editing prompt
                               # Variables: {extra_instructions}
  edit_action_plan_generation: str  # Optional final assembly during edit

structure:
  timeline: bool               # Whether to include timeline (default: false)
  milestones: bool             # Whether to include milestones (default: false)

model:                         # LLM model configuration for main operations
  provider: str                # Model provider: 'openai', 'anthropic', or 'google'
  name: str                    # Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash')
  version: str                 # Optional model version (e.g., '2024-11-20', '20241022', 'exp-0205')

small_model:                   # LLM model configuration for smaller/faster operations
  provider: str                # Model provider: 'openai', 'anthropic', or 'google'
  name: str                    # Model name
  version: str                 # Optional model version
```

**Important:** All prompt fields are optional. If a prompt field is provided, it will **completely replace** the default prompt (not merge with it). The prompts are organized in the order they are used during plan generation. See `plan-default-v0.yaml` for the complete default prompt values.

## Notes

- codes must be unique across all output configs (after normalization)
- The tuple (code, version) must be unique
- Output configs are referenced by assessments in the `outputs.codes` field
- Extra fields in the YAML are ignored
- The configuration is frozen once loaded (immutable)
- All fields are required unless specified
