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

import {
  AssessmentTypeDisplayNames,
  AssessmentTypeKey,
  OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE,
} from "~sentencing-client/components/OffenderAssessment/assessmentTypeUtils";

/**
 * Maps the raw US_MO ORAS `assessmentType` string (as delivered in the client
 * metadata) onto the `AssessmentTypeKey` understood by the SAR Builder's
 * assessment utilities (display names + max scores). Only the four full ORAS
 * tools have a SAR key; the two screening tools (CSST/PST) and anything
 * unrecognized resolve to `null` and are handled MO-side below.
 *
 * Mirrors the import-side precedent in
 * `apps/@sentencing/import/src/utils/sar.ts`
 * (`EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE`).
 */
const MO_ASSESSMENT_TYPE_TO_KEY: Record<string, AssessmentTypeKey> = {
  ORAS_COMMUNITY_SUPERVISION: "ORAS_CST",
  ORAS_PRISON_INTAKE: "ORAS_PIT",
  ORAS_REENTRY: "ORAS_RT",
  ORAS_SUPPLEMENTAL_REENTRY: "ORAS_SRT",
};

export function mapMoAssessmentType(
  type: string | null | undefined,
): AssessmentTypeKey | null {
  if (!type) return null;
  return MO_ASSESSMENT_TYPE_TO_KEY[type] ?? null;
}

/**
 * MO-only display names for the two ORAS screening tools that the SAR
 * assessment utils don't model (they only cover the four full ORAS tools +
 * "Other"). These show real names in the client profile instead of collapsing
 * to "Other Assessment".
 */
const MO_DISPLAY_NAME_BY_TYPE: Record<string, string> = {
  ORAS_COMMUNITY_SUPERVISION_SCREENING:
    "Community Supervision Screening Tool (ORAS-CSST)",
  ORAS_PRISON_SCREENING: "Prison Screening Tool (ORAS-PST)",
};

/**
 * Resolves the "Assessment type" label for a raw US_MO ORAS type: the four full
 * ORAS tools reuse the SAR display names, the two screening tools use MO-only
 * names, and anything unrecognized falls back to "Other Assessment".
 */
export function getMoAssessmentDisplayName(
  type: string | null | undefined,
): string {
  const key = mapMoAssessmentType(type);
  if (key) return AssessmentTypeDisplayNames[key];
  if (type && MO_DISPLAY_NAME_BY_TYPE[type])
    return MO_DISPLAY_NAME_BY_TYPE[type];
  return AssessmentTypeDisplayNames.Other;
}

/**
 * Resolves the donut's max score (denominator) for a raw US_MO ORAS type. The
 * four full ORAS tools have configured maxes; the screening tools (CSST/PST)
 * and unrecognized types return `undefined` so the donut renders "X/--" with a
 * light ring until their guideline maxes are configured.
 *
 * TODO(OBT-37491): add CSST/PST max scores once the ORAS scoring guidelines are
 * confirmed.
 */
export function getMoAssessmentMaxScore(
  type: string | null | undefined,
): number | undefined {
  const key = mapMoAssessmentType(type);
  if (!key) return undefined;
  return OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE[key] ?? undefined;
}
