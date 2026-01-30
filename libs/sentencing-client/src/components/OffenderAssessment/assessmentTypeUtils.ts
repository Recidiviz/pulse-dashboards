// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// Keys = DB values (from Prisma enum), Values = UI display names
export const AssessmentTypeDisplayNames = {
  ORAS_CST: "Community Supervision Tool (ORAS-CST)",
  ORAS_SRT: "Supplemental Reentry Tool (ORAS-SRT)",
  ORAS_PIT: "Prison Intake Tool (ORAS-PIT)",
  ORAS_RT: "Reentry Tool (ORAS-RT)",
  Other: "Other Assessment",
} as const;

export type AssessmentTypeKey = keyof typeof AssessmentTypeDisplayNames;

export function getAssessmentTypeDisplayName(
  dbValue: AssessmentTypeKey | null | undefined,
): string {
  if (!dbValue) return "Unknown";
  return AssessmentTypeDisplayNames[dbValue];
}
