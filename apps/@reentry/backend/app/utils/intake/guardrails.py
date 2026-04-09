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

"""
Deterministic guardrails for the CPA chatbot.

These checks run on every incoming user message before it reaches the LLM —
zero latency, no model call, hard-coded behavior.

TODO: This entire module is a candidate for a shared library if other apps
(e.g. JII texting, future chat features) need the same guardrail checks.
"""

import logging

logger = logging.getLogger(__name__)

CHAR_LIMIT = 2500


def check_char_limit(text: str) -> bool:
    return len(text) > CHAR_LIMIT


def run_guardrails(text: str) -> list[str]:
    """Run all guardrail checks and return every triggered guardrail.

    Returns a list of triggered guardrail names, or an empty list if all pass.
    All checks run regardless of prior hits — a message can trigger multiple.
    """
    triggered = []
    if check_char_limit(text):
        triggered.append("char_limit")
    # TODO: add crisis and injection checks here
    return triggered
