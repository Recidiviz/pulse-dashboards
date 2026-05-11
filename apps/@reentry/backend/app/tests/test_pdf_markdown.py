# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
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

"""Unit tests for the markdown preprocessors used by PDF rendering."""

import pytest

from app.routes.plan_router import (
    _convert_unicode_bullets,
    _insert_blanks_before_lists,
    _insert_blanks_between_continuations,
    _preprocess_action_plan_markdown,
    _preprocess_markdown_common,
)


class TestXmlStripping:
    def test_strips_annotations_block(self):
        text = "## Section\n<annotations>some annotation</annotations>\nText"
        assert "<annotations>" not in _preprocess_action_plan_markdown(text)

    def test_strips_resources_block(self):
        text = "## Section\n<resources>resource data</resources>\nText"
        assert "<resources>" not in _preprocess_action_plan_markdown(text)

    def test_strips_notes_block(self):
        text = "## Section\n<notes>caseworker only</notes>\nText"
        assert "<notes>" not in _preprocess_action_plan_markdown(text)

    def test_strips_resource_bank_tag(self):
        text = 'Text <resourceBank id="123"/> more text'
        assert "<resourceBank" not in _preprocess_action_plan_markdown(text)

    def test_preserves_surrounding_content(self):
        text = "Before\n<annotations>ignored</annotations>\nAfter"
        result = _preprocess_action_plan_markdown(text)
        assert "Before" in result
        assert "After" in result


class TestReadonlyLinkConversion:
    def test_converts_to_markdown_link(self):
        text = '<readonlylink href="https://example.com">Click here</readonlylink>'
        result = _preprocess_action_plan_markdown(text)
        assert "[Click here](https://example.com)" in result
        assert "<readonlylink" not in result

    def test_converts_double_quoted_href(self):
        text = '<readonlylink href="https://example.com">Label</readonlylink>'
        assert "[Label](https://example.com)" in _preprocess_action_plan_markdown(text)

    def test_converts_single_quoted_href(self):
        text = "<readonlylink href='https://example.com'>Label</readonlylink>"
        assert "[Label](https://example.com)" in _preprocess_action_plan_markdown(text)


class TestBoldLabelNormalization:
    @pytest.mark.parametrize(
        "input_text",
        [
            "Goal: find housing",
            "**Goal:** find housing",
            "**Goal**: find housing",
            "Goal:** find housing",
        ],
    )
    def test_normalizes_all_goal_variants(self, input_text):
        result = _preprocess_action_plan_markdown(input_text)
        assert "**Goal:**" in result

    def test_no_duplicate_asterisks(self):
        # Regression: **Goal:** was previously producing **Goal:****
        result = _preprocess_action_plan_markdown("**Goal:** find housing")
        assert "****" not in result
        assert result.count("**") == 2

    def test_goal_label_preserved_in_context(self):
        text = "**Goal:** secure stable housing within 60 days"
        result = _preprocess_action_plan_markdown(text)
        assert "secure stable housing within 60 days" in result


class TestBulletConversion:
    def test_bullet_line_converted_to_list_item(self):
        text = "• Get ID documents"
        result = _preprocess_action_plan_markdown(text)
        assert "- Get ID documents" in result
        assert "•" not in result

    def test_indented_bullet_preserves_indentation(self):
        text = "  • Nested item"
        result = _preprocess_action_plan_markdown(text)
        assert "  - Nested item" in result

    def test_non_bullet_lines_unchanged(self):
        text = "Regular text line"
        result = _preprocess_action_plan_markdown(text)
        assert "Regular text line" in result

    def test_multiple_bullets_all_converted(self):
        text = "• Item one\n• Item two\n• Item three"
        result = _preprocess_action_plan_markdown(text)
        assert result.count("- ") == 3
        assert "•" not in result


class TestTrailingWhitespace:
    def test_trailing_spaces_stripped(self):
        text = "- list item  \n- another item  "
        result = _preprocess_action_plan_markdown(text)
        for line in result.splitlines():
            assert line == line.rstrip()


class TestDollarSignEscaping:
    def test_backslash_dollar_removed(self):
        assert _preprocess_markdown_common(r"saved \$400") == "saved $400"

    def test_multiple_occurrences_all_removed(self):
        result = _preprocess_markdown_common(r"owes \$4,000 and saved \$400")
        assert "$4,000" in result
        assert "$400" in result
        assert r"\$" not in result

    def test_plain_dollar_unchanged(self):
        assert _preprocess_markdown_common("saved $400") == "saved $400"

    def test_action_plan_inherits_dollar_fix(self):
        result = _preprocess_action_plan_markdown(r"saved \$400 from work-release")
        assert "$400" in result
        assert r"\$" not in result


class TestConvertUnicodeBullets:
    def test_bullet_converted_to_dash(self):
        assert _convert_unicode_bullets("• Get ID") == "- Get ID"

    def test_indentation_preserved(self):
        assert _convert_unicode_bullets("  • Nested") == "  - Nested"

    def test_four_space_indent_preserved(self):
        assert _convert_unicode_bullets("    • Deep") == "    - Deep"

    def test_multiple_bullets_all_converted(self):
        result = _convert_unicode_bullets("• One\n• Two\n• Three")
        assert result == "- One\n- Two\n- Three"

    def test_non_bullet_line_unchanged(self):
        assert _convert_unicode_bullets("Regular line") == "Regular line"

    def test_mixed_content_unchanged_lines_preserved(self):
        text = "Intro\n• Item\nTrailing"
        result = _convert_unicode_bullets(text)
        assert "Intro" in result
        assert "- Item" in result
        assert "Trailing" in result
        assert "•" not in result

    def test_leading_whitespace_after_bullet_stripped(self):
        # lstrip() on the content after • removes any extra whitespace between
        # the bullet character and the text, keeping the output clean.
        assert _convert_unicode_bullets("•  extra space") == "- extra space"


class TestInsertBlanksBeforeLists:
    def test_blank_inserted_after_paragraph(self):
        text = "Some intro text\n- list item"
        result = _insert_blanks_before_lists(text)
        lines = result.splitlines()
        list_idx = next(i for i, ln in enumerate(lines) if ln.startswith("- "))
        assert lines[list_idx - 1] == ""

    def test_no_blank_inserted_between_consecutive_list_items(self):
        text = "- first\n- second\n- third"
        result = _insert_blanks_before_lists(text)
        assert result.count("\n\n") == 0

    def test_no_blank_inserted_after_heading(self):
        text = "## Section Title\n- first item"
        result = _insert_blanks_before_lists(text)
        lines = result.splitlines()
        list_idx = next(i for i, ln in enumerate(lines) if ln.startswith("- "))
        assert lines[list_idx - 1] != ""

    def test_blank_inserted_when_dedenting_from_sublist(self):
        text = "- parent\n  - child\n- sibling"
        result = _insert_blanks_before_lists(text)
        lines = result.splitlines()
        sibling_idx = next(i for i, ln in enumerate(lines) if ln == "- sibling")
        assert lines[sibling_idx - 1] == ""

    def test_numbered_list_after_paragraph_gets_blank(self):
        text = "Intro paragraph\n1. first"
        result = _insert_blanks_before_lists(text)
        lines = result.splitlines()
        list_idx = next(i for i, ln in enumerate(lines) if ln.startswith("1."))
        assert lines[list_idx - 1] == ""

    def test_already_blank_line_not_doubled(self):
        text = "Paragraph\n\n- item"
        result = _insert_blanks_before_lists(text)
        assert "\n\n\n" not in result


class TestInsertBlanksBetweenContinuations:
    def test_blank_inserted_between_list_marker_and_first_continuation(self):
        text = "- **Focus Area:** Housing\n  **Goal:** Find shelter"
        result = _insert_blanks_between_continuations(text)
        lines = result.splitlines()
        cont_idx = next(i for i, ln in enumerate(lines) if "Goal" in ln)
        assert lines[cont_idx - 1] == ""

    def test_blank_inserted_between_consecutive_continuation_fields(self):
        text = "- **Focus Area:** Housing\n  **Goal:** Stable home\n  **Status:** In progress"
        result = _insert_blanks_between_continuations(text)
        lines = result.splitlines()
        status_idx = next(i for i, ln in enumerate(lines) if "Status" in ln)
        assert lines[status_idx - 1] == ""

    def test_non_continuation_lines_unaffected(self):
        text = "- top level\n- another top level"
        result = _insert_blanks_between_continuations(text)
        assert result.count("\n\n") == 0

    def test_existing_blank_not_doubled(self):
        text = "- item\n\n  **Goal:** value"
        result = _insert_blanks_between_continuations(text)
        assert "\n\n\n" not in result

    def test_focus_area_structure_end_to_end(self):
        text = (
            "- **Focus Area:** Employment\n"
            "  **Goal:** Get a job within 90 days\n"
            "  **Applicable Key(s):** Employment\n"
            "  **Action Steps:**\n"
            "  - Apply to three places per week"
        )
        result = _insert_blanks_between_continuations(text)
        lines = result.splitlines()
        for i, line in enumerate(lines):
            if line.startswith("  **") and i > 0:
                assert lines[i - 1] == "", f"Expected blank before: {line!r}"
