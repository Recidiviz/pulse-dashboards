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

"""Unit tests for deterministic guardrails."""

from app.utils.intake.guardrails import CHAR_LIMIT, check_char_limit, run_guardrails


class TestCheckCharLimit:
    def test_under_limit(self):
        assert check_char_limit("a" * (CHAR_LIMIT - 1)) is False

    def test_at_limit(self):
        assert check_char_limit("a" * CHAR_LIMIT) is False

    def test_over_limit(self):
        assert check_char_limit("a" * (CHAR_LIMIT + 1)) is True

    def test_empty_string(self):
        assert check_char_limit("") is False


class TestRunGuardrails:
    def test_clean_message(self):
        assert run_guardrails("I need help finding housing") == []

    def test_char_limit_over(self):
        assert run_guardrails("a" * (CHAR_LIMIT + 1)) == ["char_limit"]

    def test_char_limit_at(self):
        assert run_guardrails("a" * CHAR_LIMIT) == []

    def test_char_limit_under(self):
        assert run_guardrails("a" * (CHAR_LIMIT - 1)) == []

    def test_empty_string(self):
        assert run_guardrails("") == []
