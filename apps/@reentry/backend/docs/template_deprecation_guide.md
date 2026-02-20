# Template Variable Management Guide

This guide explains how to manage template variables in config files, including adding new variables and deprecating old ones without breaking existing configs.

## Overview

The reentry backend uses a config system where prompt templates contain `{variable}` placeholders that get interpolated at runtime. As the system evolves, we may need to:

1. **Add new template variables** - New features may require new data to be passed to prompts
2. **Remove template variables** - Variables that are no longer needed should be removed from the schema

The challenge is doing this without breaking old configs that may still reference old variables or not yet use new ones.
We also need these values to be visible to the persons managing the configs so they can validate and evolve the configs.

## Solution: Two-Layer Validation System

We've implemented a comprehensive system with two validation layers:

### Layer 1: Schema-Based Validation (Config Load Time)
- **Purpose**: Guide users and catch errors early
- **When**: When configs are created, updated, or validated
- **What**: Checks templates against declared available/required variables in Pydantic schema
- **Result**: Immediate warnings about typos, undeclared variables, or missing required variables

### Layer 2: SafeTemplateFormatter (Runtime)
- **Purpose**: Prevent crashes and ensure graceful degradation
- **When**: Every time a template is formatted in production
- **What**: Handles missing variables and edge cases
- **Result**: System never crashes, logs warnings for monitoring

### Benefits

- ✅ **Forward compatible**: Old configs work even when new variables are added (missing variables use empty strings)
- ✅ **Backward compatible**: Old configs that reference removed variables continue working (they get empty strings)
- ✅ **User guidance**: Validation API shows clear warnings about issues before deployment
- ✅ **Type safety**: Available variables are declared in Pydantic schema
- ✅ **Auto-sync**: Tests ensure schema declarations match actual code
- ✅ **Visibility**: Logs show when missing variables are used, aiding migration

## Architecture

### Components

1. **Pydantic Schema with Variable Declarations** (`app/core/data_config/output_configs/output_config.py`)
   - Each prompt field declares `available_variables` and `required_variables` in `json_schema_extra`
   - Single source of truth for what variables exist
   - Automatically generates API documentation
   - Example:
   ```python
   data_template: str = Field(
       description="Initial user prompt template",
       json_schema_extra={
           "available_variables": ["client_data", "address", "decision_tree_statements"],
           "required_variables": ["client_data"],
       },
   )
   ```

2. **Validation Service** (`app/services/config_management/validation.py`)
   - Validates configs at load time against schema declarations
   - Checks for undeclared variables (possible typos)
   - Checks for missing required variables
   - Warns about deprecated variable usage
   - Helps track which configs need updating

3. **`SafeTemplateFormatter`** (`app/utils/template_formatter.py`)
   - Safely formats templates at runtime with graceful handling of missing variables
   - Logs warnings for debugging and migration tracking
   - Replaces direct `.format()` calls throughout the codebase

4. **Schema Sync Tests** (`app/tests/test_template_schema_sync.py`)
   - Ensures schema declarations match actual code method signatures
   - Fails if code changes without updating schema (or vice versa)
   - Prevents schema from becoming stale

## How It Works

## How to Remove a Variable

When you want to remove a template variable that's no longer needed:

### Step 1: Update Pydantic Schema

Remove the variable from the schema's `available_variables`:

```python
# app/core/data_config/output_configs/output_config.py

# Before
data_template: str = Field(
    description="Initial user prompt template",
    json_schema_extra={
        "available_variables": ["client_data", "address", "assessment"],
        "required_variables": ["client_data"],
    },
)

# After
data_template: str = Field(
    description="Initial user prompt template",
    json_schema_extra={
        "available_variables": ["client_data", "address"],  # assessment removed
        "required_variables": ["client_data"],
    },
)
```

**Why this matters**:
- Frontend gets variable list from this schema
- Validation checks against this schema
- Tests will fail if schema doesn't match code

### Step 2: Remove from Current Code

Remove the variable from all prompt method calls:

```python
# Before
content = self.formatter.format(
    self.config.data_template,
    client_data=client_data,
    assessment=assessment_data,  # Remove this
)

# After
content = self.formatter.format(
    self.config.data_template,
    client_data=client_data,
)
```

### Step 3: Run Tests

The schema sync tests will verify your changes are correct:

```bash
uv run pytest app/tests/test_template_schema_sync.py -v
```

If you forgot to update the schema, the test will fail with a clear message.

### Step 4: Update Configs

Work with config owners to update old configs to remove the obsolete variables. Old configs will continue to work (variables that are no longer passed will be replaced with empty strings at runtime), but the validation endpoint will show warnings:

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Field 'prompts.data_template' uses undeclared variables: assessment. Available variables: client_data, address. This might be a typo or the schema may need updating."
  ]
}
```

## How to Add a New Variable

When adding a new template variable to prompts:

### Step 1: Update Prompt Methods

Add the new variable to all relevant format calls:

```python
content = self.formatter.format(
    self.config.data_template,
    client_data=client_data,
    decision_tree_statements=statements,
    new_field=new_data,  # Add new variable
)
```

### Step 2: Update Schema Declaration

Add the new variable to the Pydantic schema (`output_config.py`):

```python
data_template: str = Field(
    description="Initial user prompt template",
    json_schema_extra={
        "available_variables": ["client_data", "decision_tree_statements", "new_field"],
        "required_variables": ["client_data"],  # Only if new_field is required
    },
)
```

### Step 3: Run Tests

The schema sync tests will verify your changes are correct:

```bash
uv run pytest app/tests/test_template_schema_sync.py::TestActionPlanSchemaSync::test_data_template_schema_matches_code -v
```

If the test fails, it means the schema doesn't match the method signature.

### Step 4: No Breaking Changes!

Old configs that don't use `{new_field}` will continue working - the extra variable is simply ignored. This is the beauty of the SafeTemplateFormatter!


### Validation Checks

The validation performs two checks on template variables:

1. **Schema compliance**: Ensures templates only use variables declared in schema
2. **Required variables**: Warns if required variables are missing from template

### Example Validation Warnings

**Undeclared variable (possible typo or removed variable)**:
```
Field 'prompts.data_template' uses undeclared variables: cleint_data.
Available variables: client_data, address, decision_tree_statements.
This might be a typo or the schema may need updating.
```

**Missing required variable**:
```
Field 'prompts.section_generation_with_resources' is missing required variables: resources.
The template may not work correctly at runtime.
```

**Note**: Variables that have been removed from the schema but are still referenced in old configs will show up as "undeclared variables". At runtime, these will be replaced with empty strings and a warning will be logged.
