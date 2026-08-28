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

import type { SAR } from "../../api";
import {
  DECLINED_SAR_REPORT_SECTIONS,
  SAR_REPORT_SECTIONS,
  SARSection,
  type SARSectionName,
} from "./constants";

/** True when this officer is assigned only the Victim Impact section. */
export const isPSRVictimImpactOnly = (
  isVictimImpactOnly: SAR["isVictimImpactOnly"],
  investigationType: SAR["investigationType"] | undefined,
): boolean => isVictimImpactOnly === true && investigationType === "PSR";

/** True when this officer is assigned everything other than the Victim
 * Impact section. */
export const isPSRAllExceptVictimImpact = (
  isVictimImpactOnly: SAR["isVictimImpactOnly"],
  investigationType: SAR["investigationType"] | undefined,
): boolean => isVictimImpactOnly === false && investigationType === "PSR";

/**
 * Whether a section's data should render for this officer, in both the DOM
 * report/Summary page and the PDF report. The single source of truth for
 * this logic — `SARDetailsPresenter.shouldShowInSummary` (DOM) and
 * `SARPdfTemplate/derive.ts`'s `shouldShowInReport` (PDF) both call this
 * directly instead of each maintaining their own hand-synced copy, since the
 * PDF has no presenter to share an implementation with otherwise.
 *
 * Two adjustments in opposite directions:
 * - Victim Impact stays in the base section list for the all-except-
 *   victim-impact split so its nav tab remains visible, but it shouldn't
 *   appear in this officer's report.
 * - Recommendation is deliberately excluded from the base section list when
 *   declined (nothing to fill out in the builder tool), but the report still
 *   needs to show it with declined-fallback copy, so it's surfaced here even
 *   though it's not in the base list.
 */
export const shouldShowSARSection = (
  section: SARSectionName,
  isVictimImpactOnly: SAR["isVictimImpactOnly"],
  investigationType: SAR["investigationType"] | undefined,
  defendantDeclinedToParticipate: SAR["defendantDeclinedToParticipate"],
): boolean => {
  if (
    section === SARSection.VICTIM_IMPACT &&
    isPSRAllExceptVictimImpact(isVictimImpactOnly, investigationType)
  ) {
    return false;
  }
  if (
    section === SARSection.RECOMMENDATION &&
    defendantDeclinedToParticipate &&
    !isPSRVictimImpactOnly(isVictimImpactOnly, investigationType)
  ) {
    return true;
  }

  let sections: SARSectionName[];
  if (isPSRVictimImpactOnly(isVictimImpactOnly, investigationType)) {
    sections = [SARSection.VICTIM_IMPACT, SARSection.SUMMARY];
  } else if (defendantDeclinedToParticipate === false) {
    sections = [...SAR_REPORT_SECTIONS];
  } else {
    sections = [...DECLINED_SAR_REPORT_SECTIONS];
  }
  return sections.includes(section);
};
