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
  reportType: SAR["reportType"] | undefined,
): boolean => isVictimImpactOnly === true && reportType === "PSR";

/** True when this officer is assigned everything other than the Victim
 * Impact section. */
export const isPSRAllExceptVictimImpact = (
  isVictimImpactOnly: SAR["isVictimImpactOnly"],
  reportType: SAR["reportType"] | undefined,
): boolean => isVictimImpactOnly === false && reportType === "PSR";

/** The SAR fields that decide which sections this officer covers. Both a SAR
 * and SARDetailsPresenter satisfy this shape. */
export type SARSectionScope = {
  isVictimImpactOnly: SAR["isVictimImpactOnly"];
  reportType: SAR["reportType"] | undefined;
  defendantDeclinedToParticipate: SAR["defendantDeclinedToParticipate"];
};

/**
 * Returns the sections in the builder's side nav, in order. A PSR officer
 * assigned only Victim Impact gets Victim Impact and Summary; a declined
 * defendant drops the sections that need their participation (see
 * DECLINED_SAR_REPORT_SECTIONS).
 *
 * A PSR officer assigned everything except Victim Impact still gets the
 * Victim Impact tab, which shows a banner saying the originating officer will
 * complete it. shouldShowInSARSummary drops it from their Summary page and
 * report.
 */
export const getSARSections = ({
  isVictimImpactOnly,
  reportType,
  defendantDeclinedToParticipate,
}: SARSectionScope): SARSectionName[] => {
  if (isPSRVictimImpactOnly(isVictimImpactOnly, reportType)) {
    return [SARSection.VICTIM_IMPACT, SARSection.SUMMARY];
  }
  return defendantDeclinedToParticipate === false
    ? [...SAR_REPORT_SECTIONS]
    : [...DECLINED_SAR_REPORT_SECTIONS];
};

/**
 * Whether a section's data should render on the builder's Summary page.
 *
 * This is the builder's section list minus Victim Impact for a PSR officer
 * assigned everything except Victim Impact. That officer keeps the Victim
 * Impact nav tab, but another officer writes its content.
 */
export const shouldShowInSARSummary = (
  section: SARSectionName,
  scope: SARSectionScope,
): boolean => {
  if (
    section === SARSection.VICTIM_IMPACT &&
    isPSRAllExceptVictimImpact(scope.isVictimImpactOnly, scope.reportType)
  ) {
    return false;
  }
  return getSARSections(scope).includes(section);
};

/**
 * Whether a section should render in the report.
 *
 * The report shows everything the Summary page does, plus Recommendation when
 * the defendant declined. The builder has no Recommendation form in that
 * case, but the report still prints a fallback line saying the officer could
 * not complete it.
 */
export const shouldShowInSARReport = (
  section: SARSectionName,
  scope: SARSectionScope,
): boolean => {
  if (
    section === SARSection.RECOMMENDATION &&
    scope.defendantDeclinedToParticipate === true &&
    !isPSRVictimImpactOnly(scope.isVictimImpactOnly, scope.reportType)
  ) {
    return true;
  }
  return shouldShowInSARSummary(section, scope);
};
