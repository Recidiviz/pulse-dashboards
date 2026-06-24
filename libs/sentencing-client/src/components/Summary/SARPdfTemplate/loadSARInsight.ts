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

import type { APIClient } from "../../../api";
import { getAssessmentScoreBucket } from "../../OffenderAssessment/assessmentTypeUtils";
import type { SAR, SARInsight } from "./SARPdfTemplate.types";

/**
 * Fetches the Historical Outcome insight for a SAR without a presenter — a
 * standalone port of `SARDetailsPresenter.loadInsight` so callers that only
 * have a raw `SAR` (e.g. the client Full Profile's "Download Report") can build
 * the same PDF the SAR Summary page does. Returns `null` whenever the SAR lacks
 * the fields an insight is keyed on, or no matching insight exists.
 *
 * Intentionally duplicates the presenter's derivation rather than refactoring it
 * — the presenter stays untouched.
 */
export async function loadSARInsight(
  // Accept either the live or offline client — both expose `getSARInsight`.
  apiClient: Pick<APIClient, "getSARInsight">,
  sar: SAR,
): Promise<SARInsight | null> {
  if (!sar.assessmentDate) return null;

  const offense = sar.mostSevereOffenseName;
  const gender = sar.client?.gender;
  const score = sar.assessmentScore;
  const assessmentType = sar.assessmentType;

  if (!offense || !gender || score == null || assessmentType == null) {
    return null;
  }

  const scoreBucket = getAssessmentScoreBucket(assessmentType, score, gender);
  if (scoreBucket == null) return null;

  try {
    return await apiClient.getSARInsight(offense, gender, scoreBucket);
  } catch {
    return null;
  }
}
