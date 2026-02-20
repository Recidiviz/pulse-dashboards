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

"""Safe template formatting with support for missing variables."""

import re
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class SafeTemplateFormatter:
    """
    Handles template formatting with graceful degradation for missing/extra variables.

    Features:
    - Handles missing variables (uses empty string by default)
    - Ignores extra variables gracefully
    - Logs warnings for debugging and migration tracking
    """

    def format(self, template: str, **kwargs: Any) -> str:
        """
        Format template with provided kwargs, handling missing variables.

        Args:
            template: Template string with {variable} placeholders
            **kwargs: Variables to substitute into the template

        Returns:
            Formatted string with all variables substituted

        Example:
            >>> formatter = SafeTemplateFormatter()
            >>> formatter.format("Hello {name}, {missing}", name="World")
            "Hello World, "
        """
        # Find all variables in the template
        template_vars = self._extract_template_variables(template)

        # Find missing variables (in template but not in kwargs)
        missing_vars = template_vars - set(kwargs.keys())
        if missing_vars:
            logger.warning(
                "template_variables_missing",
                missing_variables=list(missing_vars),
                provided_variables=list(kwargs.keys()),
                template_preview=template[:100]
                + ("..." if len(template) > 100 else ""),
            )

        # Build complete vars dict with empty strings for missing variables
        all_vars = kwargs.copy()
        for var in missing_vars:
            all_vars[var] = ""

        try:
            return template.format(**all_vars)
        except (KeyError, ValueError) as e:
            logger.error(
                "template_formatting_error",
                error=str(e),
                template_preview=template[:100]
                + ("..." if len(template) > 100 else ""),
                provided_variables=list(kwargs.keys()),
            )
            raise

    @staticmethod
    def _extract_template_variables(template: str) -> set[str]:
        """
        Extract all {variable} placeholders from a template string.

        Args:
            template: Template string to analyze

        Returns:
            Set of variable names found in the template
        """
        # Find all {variable} patterns, excluding {{escaped}} and format specs like {var:.2f}
        pattern = r"\{([a-zA-Z_][a-zA-Z0-9_]*?)(?:[:.!].*?)?\}"
        matches = re.findall(pattern, template)
        return set(matches)


def extract_template_variables(template: str) -> set[str]:
    """
    Utility function to extract template variables from a string.

    Args:
        template: Template string to analyze

    Returns:
        Set of variable names found in the template
    """
    return SafeTemplateFormatter._extract_template_variables(template)
