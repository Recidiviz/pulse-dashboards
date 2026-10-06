// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import type { StatusTone } from "~@meetings/app/admin/ui/StatusBadge";

export type GradeDisplay = { label: string; tone: StatusTone };

const GRADES: Record<string, GradeDisplay> = {
  GOOD: { label: "Good", tone: "good" },
  PARTIAL: { label: "Partial", tone: "partial" },
  BAD: { label: "Bad", tone: "bad" },
  "N/A": { label: "N/A", tone: "neutral" },
};

export const NO_GRADE: GradeDisplay = { label: "—", tone: "neutral" };

export function gradeDisplay(grade: string | null | undefined): GradeDisplay {
  return (grade && GRADES[grade]) || NO_GRADE;
}
