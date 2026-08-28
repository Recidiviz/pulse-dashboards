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

/**
 * Sections that apply when the defendant declined to participate: everything
 * except Key Considerations and Defendant's Version, which require
 * participation to complete. Recommendation is also excluded here (nothing
 * to fill out in the builder tool), but still needs to render in the actual
 * report with declined-fallback copy — that's handled as a report-only
 * override in `shouldShowSARSection` below, not by adding it back to this
 * list.
 *
 * Defined once here so `SARDetailsPresenter.SARSections` (drives the
 * builder's side nav) and the PDF template's `shouldShowSARSection` (which
 * also uses this) can't drift out of sync with each other.
 */
export const DECLINED_SAR_REPORT_SECTIONS = [
  SARSection.CASE_INFORMATION,
  SARSection.VICTIM_IMPACT,
  SARSection.OFFENDER_ASSESSMENT,
  SARSection.PRIOR_TREATMENT_HISTORY,
  SARSection.SUMMARY,
] as const;

// Autosave delay for all SAR form fields
export const SAR_AUTOSAVE_DELAY = 500; // 500ms

/** Sentence-type sort order for the donut/legend. */
export const DISPOSITION_TYPE_ORDER: Record<string, number> = {
  Deferred_prosecution: 0,
  Probation: 1,
  Treatment_in_prison: 2,
  Suspended: 3,
};

export const BUCKET_TO_RISK_CHIP: Record<number, string> = {
  0: "Low Risk Score",
  1: "Moderate Risk Score",
  2: "High Risk Score",
  3: "Very High Risk Score",
};

// Canonical set of disposition legend labels, shared by the DOM report's
// DISPOSITION_FILL (ReportDispositionPatterns.tsx) and the PDF report's
// GLYPH_BY_LABEL (SARPdfTemplate/blocks/HistoricalOutcomeBlock.tsx).
export const DISPOSITION_LEGEND_LABELS = [
  "Treatment Court/Deferred Prosecution",
  "Probation",
  "Court-Ordered Treatment",
  "Suspended Sentence",
  "< 1 Year Incarceration",
  "1-2 Years Incarceration",
  "3-5 Years Incarceration",
  "6+ Years Incarceration",
] as const;

export type DispositionLegendLabel = (typeof DISPOSITION_LEGEND_LABELS)[number];
