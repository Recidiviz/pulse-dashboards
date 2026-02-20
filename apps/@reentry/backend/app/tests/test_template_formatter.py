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

"""Tests for SafeTemplateFormatter."""

import pytest

from app.utils.template_formatter import (
    SafeTemplateFormatter,
    extract_template_variables,
)


class TestExtractTemplateVariables:
    """Tests for the extract_template_variables function."""

    def test_extracts_simple_variables(self):
        """Test extracting simple variable placeholders."""
        template = "Hello {name}, welcome to {place}!"
        variables = extract_template_variables(template)
        assert variables == {"name", "place"}

    def test_extracts_variables_with_format_specs(self):
        """Test extracting variables that have format specifications."""
        template = "Value: {amount:.2f}, Count: {count:d}"
        variables = extract_template_variables(template)
        assert variables == {"amount", "count"}

    def test_ignores_escaped_braces(self):
        """Test that escaped braces are ignored."""
        template = "Use {{double braces}} for literal, but {variable} for placeholder"
        variables = extract_template_variables(template)
        assert variables == {"variable"}

    def test_handles_empty_template(self):
        """Test handling of templates with no variables."""
        template = "No variables here!"
        variables = extract_template_variables(template)
        assert variables == set()

    def test_handles_multiple_occurrences(self):
        """Test that duplicate variables are only counted once."""
        template = "{name} said hello to {name} and {other}"
        variables = extract_template_variables(template)
        assert variables == {"name", "other"}


class TestSafeTemplateFormatter:
    """Tests for the SafeTemplateFormatter class."""

    def test_format_with_all_variables_provided(self):
        """Test formatting when all variables are provided."""
        formatter = SafeTemplateFormatter()
        template = "Hello {name}, you are {age} years old."
        result = formatter.format(template, name="Alice", age=30)
        assert result == "Hello Alice, you are 30 years old."

    def test_format_with_missing_variables(self, caplog):
        """Test formatting when some variables are missing (should use empty string)."""
        formatter = SafeTemplateFormatter()
        template = "Hello {name}, welcome to {place}!"
        result = formatter.format(template, name="Bob")
        assert result == "Hello Bob, welcome to !"
        # Check that a warning was logged
        assert "template_variables_missing" in caplog.text

    def test_format_with_extra_variables(self):
        """Test formatting when extra variables are provided (should be ignored)."""
        formatter = SafeTemplateFormatter()
        template = "Hello {name}!"
        result = formatter.format(template, name="Charlie", age=25, city="NYC")
        assert result == "Hello Charlie!"

    def test_format_with_multiple_missing_variables(self, caplog):
        """Test formatting when template uses multiple missing variables."""
        formatter = SafeTemplateFormatter()

        template = "Hello {name}, old field: {old_field}"
        result = formatter.format(template, name="David")

        assert result == "Hello David, old field: "
        # Check that a missing variables warning was logged
        assert "template_variables_missing" in caplog.text
        assert "old_field" in caplog.text

    def test_format_with_provided_variable_no_warning(self, caplog):
        """Test that no warnings are logged when all variables are provided."""
        formatter = SafeTemplateFormatter()

        template = "Value: {field}"
        result = formatter.format(template, field="custom")

        assert result == "Value: custom"
        # Should not log warning when value is explicitly provided
        assert "template_variables_missing" not in caplog.text

    def test_format_with_mixed_scenarios(self, caplog):
        """Test formatting with a mix of provided and missing variables."""
        formatter = SafeTemplateFormatter()

        template = "Provided: {provided}, Missing1: {missing1}, Missing2: {missing2}"
        result = formatter.format(template, provided="value")

        assert result == "Provided: value, Missing1: , Missing2: "
        assert "template_variables_missing" in caplog.text

    def test_format_with_no_variables(self):
        """Test formatting a template with no variables."""
        formatter = SafeTemplateFormatter()
        template = "This is a static template."
        result = formatter.format(template)
        assert result == "This is a static template."

    def test_format_with_format_specs(self):
        """Test that format specifications work correctly."""
        formatter = SafeTemplateFormatter()
        template = "Price: ${price:.2f}"
        result = formatter.format(template, price=19.99)
        assert result == "Price: $19.99"

    def test_format_error_handling(self):
        """Test that actual formatting errors are still raised."""
        formatter = SafeTemplateFormatter()
        # Invalid format spec should raise an error
        template = "Bad format: {value:invalid}"
        with pytest.raises(ValueError):
            formatter.format(template, value=123)

    def test_multiple_missing_variables_logged(self, caplog):
        """Test that multiple missing variables are all logged."""
        formatter = SafeTemplateFormatter()

        template = "V1: {old_var1}, V2: {old_var2}, V3: {old_var3}"
        result = formatter.format(template)

        assert result == "V1: , V2: , V3: "
        # All three should be logged as missing
        assert "template_variables_missing" in caplog.text
        assert "old_var1" in caplog.text
        assert "old_var2" in caplog.text
        assert "old_var3" in caplog.text

    def test_long_template_truncation_in_logs(self, caplog):
        """Test that very long templates are truncated in log messages."""
        formatter = SafeTemplateFormatter()
        # Create a template longer than 100 characters
        long_template = "x" * 150 + " {missing}"
        formatter.format(long_template)

        # Log should contain truncated version with "..."
        assert "..." in caplog.text
