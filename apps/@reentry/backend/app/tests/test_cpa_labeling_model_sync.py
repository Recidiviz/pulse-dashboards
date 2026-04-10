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

"""
Tests to ensure that read-only enum copies in cpa-labeling stay in sync with the
source-of-truth definitions in the reentry app.

The cpa-labeling app reads directly from the reentry database, so any enum value
added here must also be added to the corresponding enum in:
  apps/@cpa-labeling/backend/app/models/intake.py

If one of these tests fails, add the missing value(s) there to prevent
SQLAlchemy LookupErrors at runtime (e.g. the 'processing' IntakeStatus incident).
"""

import ast
from pathlib import Path

REENTRY_MODELS_BASE = Path(__file__).parents[1] / "models" / "base.py"
CPA_LABELING_INTAKE_MODELS = (
    Path(__file__).parents[4]
    / "@cpa-labeling"
    / "backend"
    / "app"
    / "models"
    / "intake.py"
)


def _parse_str_enum_values(path: Path, class_name: str) -> set[str]:
    """Extract string values from a StrEnum class by parsing the AST of the file,
    without executing it. This avoids SQLAlchemy table registration conflicts when
    the file defines table models alongside the enums."""
    tree = ast.parse(path.read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            values = set()
            for item in node.body:
                if (
                    isinstance(item, ast.Assign)
                    and isinstance(item.value, ast.Constant)
                    and isinstance(item.value.value, str)
                ):
                    values.add(item.value.value)
            return values
    raise ValueError(f"Class '{class_name}' not found in {path}")


def test_intake_status_values_in_sync():
    """
    Every IntakeStatus value defined here (reentry) must also exist in cpa-labeling.
    cpa-labeling reads from the reentry database, so missing values cause
    SQLAlchemy LookupErrors at runtime.
    """
    reentry_values = _parse_str_enum_values(REENTRY_MODELS_BASE, "IntakeStatus")
    cpa_values = _parse_str_enum_values(CPA_LABELING_INTAKE_MODELS, "IntakeStatus")

    missing = reentry_values - cpa_values
    assert not missing, (
        f"IntakeStatus values present in reentry but missing from cpa-labeling: {missing}. "
        f"Add them to apps/@cpa-labeling/backend/app/models/intake.py."
    )


def test_intake_type_values_in_sync():
    """
    Every IntakeType value defined here (reentry) must also exist in cpa-labeling.
    """
    reentry_values = _parse_str_enum_values(REENTRY_MODELS_BASE, "IntakeType")
    cpa_values = _parse_str_enum_values(CPA_LABELING_INTAKE_MODELS, "IntakeType")

    missing = reentry_values - cpa_values
    assert not missing, (
        f"IntakeType values present in reentry but missing from cpa-labeling: {missing}. "
        f"Add them to apps/@cpa-labeling/backend/app/models/intake.py."
    )
