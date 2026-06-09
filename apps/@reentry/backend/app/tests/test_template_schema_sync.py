# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

"""Tests to ensure template variable schema declarations match actual code usage."""

import inspect

from app.core.data_config.output_configs.output_config import (
    ActionPlanPromptsConfig,
    IntakeSummaryPromptsConfig,
)
from app.utils.llm_agent_edit_plan_prompts import ActionPlanEditPrompts
from app.utils.llm_agent_gen_plan_prompts import ActionPlanPrompts


class TestActionPlanSchemaSync:
    """Tests for ActionPlanPromptsConfig schema synchronization."""

    def test_data_template_schema_matches_code(self):
        """Ensure data_template schema matches get_initial_user_prompt signature."""
        field_info = ActionPlanPromptsConfig.model_fields["data_template"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        # Check against actual method signature
        method = ActionPlanPrompts.get_initial_user_prompt
        sig = inspect.signature(method)
        # Get parameters excluding 'self'
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        # Schema should declare all variables that the method accepts
        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_section_generation_with_resources_schema_matches_code(self):
        """Ensure section_generation_with_resources schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields[
            "section_generation_with_resources"
        ]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanPrompts.get_section_generation_prompt_with_resources
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_section_generation_without_resources_schema_matches_code(self):
        """Ensure section_generation_without_resources schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields[
            "section_generation_without_resources"
        ]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanPrompts.get_section_generation_prompt_without_resources
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_section_annotations_schema_matches_code(self):
        """Ensure section_annotations schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields["section_annotations"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanPrompts.get_section_annotations_prompt
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_section_refinement_schema_matches_code(self):
        """Ensure section_refinement schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields["section_refinement"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanPrompts.get_section_refinement_prompt
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_reflexion_with_previous_sections_schema_matches_code(self):
        """Ensure reflexion_with_previous_sections schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields[
            "reflexion_with_previous_sections"
        ]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanPrompts.get_reflexion_prompt_with_previous_sections
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_edit_section_selection_schema_matches_code(self):
        """Ensure edit_section_selection schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields["edit_section_selection"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanEditPrompts.get_section_selection_prompt
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_edit_section_change_schema_matches_code(self):
        """Ensure edit_section_change schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields["edit_section_change"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanEditPrompts.get_section_change_prompt
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_edit_timeline_schema_matches_code(self):
        """Ensure edit_timeline schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields["edit_timeline"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanEditPrompts.get_timeline_edit_prompt
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_edit_milestones_schema_matches_code(self):
        """Ensure edit_milestones schema matches method signature."""
        field_info = ActionPlanPromptsConfig.model_fields["edit_milestones"]
        schema_vars = set(field_info.json_schema_extra["available_variables"])

        method = ActionPlanEditPrompts.get_milestones_edit_prompt
        sig = inspect.signature(method)
        method_params = {p.name for p in sig.parameters.values() if p.name != "self"}

        assert (
            schema_vars == method_params
        ), f"Schema declares {schema_vars} but method accepts {method_params}"

    def test_all_fields_have_schema_extra(self):
        """Ensure all ActionPlanPromptsConfig fields have json_schema_extra defined."""
        missing = []
        for field_name, field_info in ActionPlanPromptsConfig.model_fields.items():
            if not field_info.json_schema_extra:
                missing.append(field_name)

        assert not missing, f"These fields lack json_schema_extra: {missing}"

    def test_required_vars_subset_of_available(self):
        """Ensure required_variables are always a subset of available_variables."""
        for field_name, field_info in ActionPlanPromptsConfig.model_fields.items():
            if not field_info.json_schema_extra:
                continue

            available = set(field_info.json_schema_extra.get("available_variables", []))
            required = set(field_info.json_schema_extra.get("required_variables", []))

            invalid = required - available
            assert not invalid, f"Field '{field_name}' has required variables not in available: {invalid}"


class TestIntakeSummarySchemaSync:
    """Tests for IntakeSummaryPromptsConfig schema synchronization."""

    def test_all_fields_have_schema_extra(self):
        """Ensure all IntakeSummaryPromptsConfig fields have json_schema_extra defined."""
        missing = []
        for field_name, field_info in IntakeSummaryPromptsConfig.model_fields.items():
            if not field_info.json_schema_extra:
                missing.append(field_name)

        assert not missing, f"These fields lack json_schema_extra: {missing}"

    def test_required_vars_subset_of_available(self):
        """Ensure required_variables are always a subset of available_variables."""
        for field_name, field_info in IntakeSummaryPromptsConfig.model_fields.items():
            if not field_info.json_schema_extra:
                continue

            available = set(field_info.json_schema_extra.get("available_variables", []))
            required = set(field_info.json_schema_extra.get("required_variables", []))

            invalid = required - available
            assert not invalid, f"Field '{field_name}' has required variables not in available: {invalid}"


class TestSchemaValidationIntegration:
    """Tests for the schema validation method integration."""

    def test_undeclared_variable_detected(self):
        """Test that undeclared variables in templates are detected."""
        from app.services.config_management.validation import ValidationService

        yaml_content = """
metadata:
  code: test_plan
  version: 1
  display_name: Test Plan
  output_type: action_plan

prompts:
  system: "You are a helpful assistant"
  data_template: "Create plan for {client_data} with {typo_field}"
  reflexion_initial: "Reflect"
  reflexion_with_previous_sections: "Sections: {previous_sections}"
  area_of_needs: "Areas"
  resources_options: "Resources"
  section_generation_with_resources: "Section {section} with {resources}"
  section_generation_without_resources: "Section {section}"
  section_annotations: "Annotations for {section}: {section_content}"
  section_refinement: "Refine {section}"
  timeline_generation: "Timeline"
  timeline_format: "Format"
  milestones_generation: "Milestones"
  milestones_refinement: "Refine milestones"
  milestones_format: "Format milestones"
  action_plan_generation: "Generate"
  edit_section_selection: "Select from {sections_titles}"
  edit_section_change: "Change {section} with {extra_instructions} and {clean_markdown_content}"
  edit_timeline: "Edit timeline {extra_instructions}"
  edit_milestones: "Edit milestones {extra_instructions}"
  edit_action_plan_generation: "Generate edited plan"
  unified_section_generation: "Generate"

structure:
  timeline: false
  milestones: false

model:
  provider: openai
  name: gpt-4o
  version: "2024-11-20"

small_model:
  provider: openai
  name: gpt-4o-mini

external_api:
  resources_pipeline_enabled: false
"""

        result = ValidationService.validate_output_yaml(yaml_content)

        assert result.valid
        # Check for warning about undeclared variable
        assert any(
            "typo_field" in warning and "undeclared" in warning
            for warning in result.warnings
        ), f"Expected warning about undeclared variable, got: {result.warnings}"

    def test_missing_required_variable_detected(self):
        """Test that missing required variables are detected."""
        from app.services.config_management.validation import ValidationService

        yaml_content = """
metadata:
  code: test_plan
  version: 1
  display_name: Test Plan
  output_type: action_plan

prompts:
  system: "You are a helpful assistant"
  data_template: "Create plan"
  reflexion_initial: "Reflect"
  reflexion_with_previous_sections: "Reflect"
  area_of_needs: "Areas"
  resources_options: "Resources"
  section_generation_with_resources: "Section with resources"
  section_generation_without_resources: "Section {section}"
  section_annotations: "Annotations for {section}: {section_content}"
  section_refinement: "Refine {section}"
  timeline_generation: "Timeline"
  timeline_format: "Format"
  milestones_generation: "Milestones"
  milestones_refinement: "Refine milestones"
  milestones_format: "Format milestones"
  action_plan_generation: "Generate"
  edit_section_selection: "Select from {sections_titles}"
  edit_section_change: "Change {section} with {extra_instructions} and {clean_markdown_content}"
  edit_timeline: "Edit timeline {extra_instructions}"
  edit_milestones: "Edit milestones {extra_instructions}"
  edit_action_plan_generation: "Generate edited plan"
  unified_section_generation: "Generate"

structure:
  timeline: false
  milestones: false

model:
  provider: openai
  name: gpt-4o
  version: "2024-11-20"

small_model:
  provider: openai
  name: gpt-4o-mini

external_api:
  resources_pipeline_enabled: false
"""

        result = ValidationService.validate_output_yaml(yaml_content)

        assert result.valid
        # Check for warnings about missing required variables
        warnings_text = " ".join(result.warnings)
        assert "missing required variables" in warnings_text.lower()
        # data_template requires client_data
        assert "client_data" in warnings_text
        # section_generation_with_resources requires section and resources
        assert (
            "section_generation_with_resources" in warnings_text
            or "section" in warnings_text
        )

    def test_unused_optional_variables_detected(self):
        """Test that unused optional variables are flagged with info messages."""
        from app.services.config_management.validation import ValidationService

        yaml_content = """
metadata:
  code: test_plan
  version: 1
  display_name: Test Plan
  output_type: action_plan

prompts:
  system: "You are a helpful assistant"
  data_template: "Create plan for {client_data}"
  reflexion_initial: "Reflect"
  reflexion_with_previous_sections: "Sections: {previous_sections}"
  area_of_needs: "Areas"
  resources_options: "Resources"
  section_generation_with_resources: "Section {section} with {resources}"
  section_generation_without_resources: "Section {section}"
  section_annotations: "Annotations for {section}: {section_content}"
  section_refinement: "Refine {section}"
  timeline_generation: "Timeline"
  timeline_format: "Format"
  milestones_generation: "Milestones"
  milestones_refinement: "Refine milestones"
  milestones_format: "Format milestones"
  action_plan_generation: "Generate"
  edit_section_selection: "Select from {sections_titles}"
  edit_section_change: "Change {section} with {extra_instructions} and {clean_markdown_content}"
  edit_timeline: "Edit timeline {extra_instructions}"
  edit_milestones: "Edit milestones {extra_instructions}"
  edit_action_plan_generation: "Generate edited plan"
  unified_section_generation: "Generate"

structure:
  timeline: false
  milestones: false

model:
  provider: openai
  name: gpt-4o
  version: "2024-11-20"

small_model:
  provider: openai
  name: gpt-4o-mini

external_api:
  resources_pipeline_enabled: false
"""

        result = ValidationService.validate_output_yaml(yaml_content)

        assert result.valid
        # Check for info message about unused optional variables
        # data_template has optional variables: address, decision_tree_statements
        warnings_text = " ".join(result.warnings)
        assert "optional variables available but not used" in warnings_text.lower()
        # Should mention the specific unused optional variables
        assert "address" in warnings_text or "decision_tree_statements" in warnings_text
