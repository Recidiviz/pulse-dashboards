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

import re

import pytest

from app.pdf.action_plan import (
    ResourceForPDF,
    _convert_unicode_bullets,
    _insert_blanks_before_lists,
    _insert_blanks_between_continuations,
    _promote_highlighted_field_continuations,
    preprocess_action_plan_markdown,
    preprocess_markdown_common,
)


class TestResourceForPDFColorValidation:
    @pytest.mark.parametrize("color", ["#e0f2f1", "#003331", "#fff", "#1a2b3c4d"])
    def test_accepts_valid_hex_colors(self, color):
        r = ResourceForPDF(name="X", chip_bg=color, chip_text=color)
        assert r.chip_bg == color

    @pytest.mark.parametrize(
        "color",
        [
            "red",
            "rgb(255,0,0)",
            "#e0f2f1; background-image: url(http://evil.com/)",
            'red" style="color:blue',
        ],
    )
    def test_rejects_non_hex_colors(self, color):
        with pytest.raises(Exception):
            ResourceForPDF(name="X", chip_bg=color)

    def test_accepts_none(self):
        r = ResourceForPDF(name="X", chip_bg=None, chip_text=None)
        assert r.chip_bg is None


class TestXmlStripping:
    def test_strips_annotations_block(self):
        text = "## Section\n<annotations>some annotation</annotations>\nText"
        assert "<annotations>" not in preprocess_action_plan_markdown(text)

    def test_strips_resources_block(self):
        text = "## Section\n<resources>resource data</resources>\nText"
        assert "<resources>" not in preprocess_action_plan_markdown(text)

    def test_strips_notes_block(self):
        text = "## Section\n<notes>caseworker only</notes>\nText"
        assert "<notes>" not in preprocess_action_plan_markdown(text)

    def test_strips_resource_bank_tag(self):
        text = 'Text <resourceBank section_title="Housing"/> more text'
        assert "<resourceBank" not in preprocess_action_plan_markdown(text)

    def test_injects_resources_for_matching_section(self):
        text = '<resourceBank section_title="Housing"/>'
        resources = [ResourceForPDF(name="Safe Haven", address="123 Main St")]
        result = preprocess_action_plan_markdown(
            text, resources_by_section={"Housing": resources}
        )
        assert "<resourceBank" not in result
        assert "Safe Haven" in result
        assert "123 Main St" in result

    def test_strips_resource_bank_when_no_resources_for_section(self):
        text = '<resourceBank section_title="Employment"/>'
        result = preprocess_action_plan_markdown(
            text, resources_by_section={"Housing": []}
        )
        assert "<resourceBank" not in result
        assert "resource-card" not in result

    def test_strips_resource_bank_when_resources_by_section_is_none(self):
        text = '<resourceBank section_title="Housing"/>'
        result = preprocess_action_plan_markdown(text, resources_by_section=None)
        assert "<resourceBank" not in result
        assert "resource-card" not in result

    def test_matches_lowercase_resourcebank_from_template(self):
        # Jinja template emits lowercase <resourcebank> to match the MDX editor component name
        text = '<resourcebank section_title="Housing"/>'
        resources = [ResourceForPDF(name="Safe Haven", address="123 Main St")]
        result = preprocess_action_plan_markdown(
            text, resources_by_section={"Housing": resources}
        )
        assert "<resourcebank" not in result
        assert "Safe Haven" in result

    def test_escapes_html_in_resource_fields(self):
        text = '<resourceBank section_title="Housing"/>'
        resources = [
            ResourceForPDF(name="<b>Shelter</b>", phone="<script>alert(1)</script>")
        ]
        result = preprocess_action_plan_markdown(
            text, resources_by_section={"Housing": resources}
        )
        assert "<b>Shelter</b>" not in result
        assert "&lt;b&gt;Shelter&lt;/b&gt;" in result
        assert "<script>" not in result

    def test_preserves_surrounding_content(self):
        text = "Before\n<annotations>ignored</annotations>\nAfter"
        result = preprocess_action_plan_markdown(text)
        assert "Before" in result
        assert "After" in result


class TestReadonlyLinkConversion:
    def test_converts_to_markdown_link(self):
        text = '<readonlylink href="https://example.com">Click here</readonlylink>'
        result = preprocess_action_plan_markdown(text)
        assert "[Click here](https://example.com)" in result
        assert "<readonlylink" not in result

    def test_converts_double_quoted_href(self):
        text = '<readonlylink href="https://example.com">Label</readonlylink>'
        assert "[Label](https://example.com)" in preprocess_action_plan_markdown(text)

    def test_converts_single_quoted_href(self):
        text = "<readonlylink href='https://example.com'>Label</readonlylink>"
        assert "[Label](https://example.com)" in preprocess_action_plan_markdown(text)


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
        result = preprocess_action_plan_markdown(input_text)
        assert "**Goal:**" in result

    def test_no_duplicate_asterisks(self):
        # Regression: **Goal:** was previously producing **Goal:****
        result = preprocess_action_plan_markdown("**Goal:** find housing")
        assert "****" not in result
        assert result.count("**") == 2

    def test_goal_label_preserved_in_context(self):
        text = "**Goal:** secure stable housing within 60 days"
        result = preprocess_action_plan_markdown(text)
        assert "secure stable housing within 60 days" in result


class TestBulletConversion:
    def test_bullet_line_converted_to_list_item(self):
        text = "• Get ID documents"
        result = preprocess_action_plan_markdown(text)
        assert "- Get ID documents" in result
        assert "•" not in result

    def test_indented_bullet_preserves_indentation(self):
        text = "  • Nested item"
        result = preprocess_action_plan_markdown(text)
        assert "  - Nested item" in result

    def test_non_bullet_lines_unchanged(self):
        text = "Regular text line"
        result = preprocess_action_plan_markdown(text)
        assert "Regular text line" in result

    def test_multiple_bullets_all_converted(self):
        text = "• Item one\n• Item two\n• Item three"
        result = preprocess_action_plan_markdown(text)
        assert result.count("- ") == 3
        assert "•" not in result


class TestTrailingWhitespace:
    def test_trailing_spaces_stripped(self):
        text = "- list item  \n- another item  "
        result = preprocess_action_plan_markdown(text)
        for line in result.splitlines():
            assert line == line.rstrip()


class TestDollarSignEscaping:
    def test_backslash_dollar_removed(self):
        assert preprocess_markdown_common(r"saved \$400") == "saved $400"

    def test_multiple_occurrences_all_removed(self):
        result = preprocess_markdown_common(r"owes \$4,000 and saved \$400")
        assert "$4,000" in result
        assert "$400" in result
        assert r"\$" not in result

    def test_plain_dollar_unchanged(self):
        assert preprocess_markdown_common("saved $400") == "saved $400"

    def test_action_plan_inherits_dollar_fix(self):
        result = preprocess_action_plan_markdown(r"saved \$400 from work-release")
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


class TestPromoteHighlightedFieldContinuations:
    def test_bare_goal_continuation_becomes_bullet(self):
        # LLM emits "     Goal: ..." (no * prefix) — rendered inline without this fix
        text = "   * Contact Chef Mark\n     Goal: By end of Week 1"
        result = _promote_highlighted_field_continuations(text)
        lines = result.splitlines()
        assert any(ln.lstrip().startswith("* Goal:") for ln in lines)

    def test_already_a_bullet_is_unchanged(self):
        text = "   * Contact Chef Mark\n   * **Goal:** By end of Week 1"
        result = _promote_highlighted_field_continuations(text)
        assert result == text

    def test_bold_goal_continuation_also_promoted(self):
        text = "   * Do the thing\n     **Goal:** Finish it"
        result = _promote_highlighted_field_continuations(text)
        lines = result.splitlines()
        assert any(re.match(r"\s*[*\-+]\s", ln) and "Goal" in ln for ln in lines)

    def test_top_level_goal_line_unchanged(self):
        # A non-indented "Goal:" line is not a continuation — leave it alone
        text = "Goal: Find housing"
        result = _promote_highlighted_field_continuations(text)
        assert result == text

    def test_unrelated_indented_lines_unchanged(self):
        text = "   * Item\n     Some continuation text"
        result = _promote_highlighted_field_continuations(text)
        assert result == text

    def test_end_to_end_in_preprocess(self):
        # Full pipeline: continuation promoted → bold-label step normalizes Goal:
        text = "   * Contact employer\n     Goal: Get a job within 90 days"
        result = preprocess_action_plan_markdown(text)
        assert "**Goal:**" in result
        # Goal should now be on its own bullet line, not a bare continuation
        lines = result.splitlines()
        assert any(re.match(r"\s*[*\-+]\s", ln) and "Goal" in ln for ln in lines)


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
