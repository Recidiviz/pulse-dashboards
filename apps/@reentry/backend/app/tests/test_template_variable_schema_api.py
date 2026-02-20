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

"""Tests for template variable schema API and service."""

import pytest

from app.schemas.config_management import TemplateVariableSchemaResponse
from app.services.config_management.validation import ValidationService


class TestTemplateVariableSchemaService:
    """Tests for the ValidationService.get_template_variable_schema method."""

    def test_get_action_plan_schema(self):
        """Test getting schema for action_plan output type."""
        result = ValidationService.get_template_variable_schema("action_plan")

        assert isinstance(result, TemplateVariableSchemaResponse)
        assert result.output_type == "action_plan"
        assert len(result.fields) > 0

        # Check that expected fields exist
        field_names = {f.field_name for f in result.fields}
        assert "data_template" in field_names
        assert "section_generation_with_resources" in field_names
        assert "edit_section_change" in field_names

    def test_get_intake_summary_schema(self):
        """Test getting schema for intake_summary output type."""
        result = ValidationService.get_template_variable_schema("intake_summary")

        assert isinstance(result, TemplateVariableSchemaResponse)
        assert result.output_type == "intake_summary"
        assert len(result.fields) > 0

        # Check that expected fields exist
        field_names = {f.field_name for f in result.fields}
        assert "system" in field_names
        assert "template" in field_names

    def test_invalid_output_type_raises_error(self):
        """Test that invalid output type raises ValueError."""
        with pytest.raises(ValueError, match="Unknown output_type"):
            ValidationService.get_template_variable_schema("invalid_type")

    def test_data_template_field_details(self):
        """Test that data_template field has correct variable information."""
        result = ValidationService.get_template_variable_schema("action_plan")

        # Find data_template field
        data_template = next(
            (f for f in result.fields if f.field_name == "data_template"), None
        )

        assert data_template is not None
        assert "client_data" in data_template.available_variables
        assert "address" in data_template.available_variables
        assert "decision_tree_statements" in data_template.available_variables
        assert "client_data" in data_template.required_variables
        assert data_template.description != ""

    def test_section_generation_with_resources_field_details(self):
        """Test that section_generation_with_resources has correct variables."""
        result = ValidationService.get_template_variable_schema("action_plan")

        # Find field
        field = next(
            (
                f
                for f in result.fields
                if f.field_name == "section_generation_with_resources"
            ),
            None,
        )

        assert field is not None
        assert "section" in field.available_variables
        assert "resources" in field.available_variables
        assert "section" in field.required_variables
        assert "resources" in field.required_variables

    def test_all_fields_have_descriptions(self):
        """Test that all fields have descriptions."""
        for output_type in ["action_plan", "intake_summary"]:
            result = ValidationService.get_template_variable_schema(output_type)

            for field in result.fields:
                assert field.description, f"Field {field.field_name} has no description"
                assert (
                    len(field.description) > 0
                ), f"Field {field.field_name} has empty description"

    def test_required_subset_of_available(self):
        """Test that required variables are always subset of available."""
        for output_type in ["action_plan", "intake_summary"]:
            result = ValidationService.get_template_variable_schema(output_type)

            for field in result.fields:
                available = set(field.available_variables)
                required = set(field.required_variables)

                assert required.issubset(available), (
                    f"Field {field.field_name}: required {required} "
                    f"not subset of available {available}"
                )

    def test_response_is_serializable(self):
        """Test that response can be serialized to JSON (for API)."""
        result = ValidationService.get_template_variable_schema("action_plan")

        # Should be able to convert to dict (Pydantic serialization)
        result_dict = result.model_dump()

        assert isinstance(result_dict, dict)
        assert "output_type" in result_dict
        assert "fields" in result_dict
        assert isinstance(result_dict["fields"], list)
