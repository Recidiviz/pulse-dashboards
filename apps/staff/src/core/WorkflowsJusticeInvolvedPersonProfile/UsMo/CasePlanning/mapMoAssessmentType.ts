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

import { AssessmentTypeKey } from "~sentencing-client/components/OffenderAssessment/assessmentTypeUtils";

/**
 * Maps the raw US_MO ORAS `assessmentType` string (as delivered in the client
 * metadata) onto the `AssessmentTypeKey` understood by the SAR Builder's
 * assessment utilities (display names + max scores).
 *
 * Mirrors the import-side precedent in
 * `apps/@sentencing/import/src/utils/sar.ts`
 * (`EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE`). Unknown / null / undefined
 * values resolve to `null` so callers can fall back to an "Unknown" display.
 */
const MO_ASSESSMENT_TYPE_TO_KEY: Record<string, AssessmentTypeKey> = {
  ORAS_COMMUNITY_SUPERVISION: "ORAS_CST",
  ORAS_COMMUNITY_SUPERVISION_SCREENING: "Other",
  ORAS_PRISON_INTAKE: "ORAS_PIT",
  ORAS_PRISON_SCREENING: "Other",
  ORAS_REENTRY: "ORAS_RT",
  ORAS_SUPPLEMENTAL_REENTRY: "ORAS_SRT",
};

export function mapMoAssessmentType(
  type: string | null | undefined,
): AssessmentTypeKey | null {
  if (!type) return null;
  return MO_ASSESSMENT_TYPE_TO_KEY[type] ?? null;
}
