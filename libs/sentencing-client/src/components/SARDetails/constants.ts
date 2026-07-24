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

export enum SARSection {
  CASE_INFORMATION = "Case Information",
  KEY_CONSIDERATIONS = "Key Considerations",
  DEFENDANTS_VERSION = "Defendant's Version",
  VICTIM_IMPACT = "Victim Impact",
  OFFENDER_ASSESSMENT = "Offender Assessment",
  PRIOR_TREATMENT_HISTORY = "Prior Treatment History",
  RECOMMENDATION = "Recommendation",
  SUMMARY = "Summary",
}

export const SAR_REPORT_SECTIONS = [
  SARSection.CASE_INFORMATION,
  SARSection.KEY_CONSIDERATIONS,
  SARSection.DEFENDANTS_VERSION,
  SARSection.VICTIM_IMPACT,
  SARSection.OFFENDER_ASSESSMENT,
  SARSection.PRIOR_TREATMENT_HISTORY,
  SARSection.RECOMMENDATION,
  SARSection.SUMMARY,
] as const;

export type SARSectionName = (typeof SAR_REPORT_SECTIONS)[number];

// Autosave delay for all SAR form fields
export const SAR_AUTOSAVE_DELAY = 500; // 500ms
