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
import type { SAR, SARInsight } from "./SARPdfTemplate.types";

/**
 * Fetches the Historical Outcome insight for a SAR without a presenter, so
 * callers that only have a raw SAR (e.g. the client Full Profile's "Download
 * Report") can build the same PDF the SAR Summary page does. Returns null when
 * no insight exists for the SAR or the request fails.
 */
export async function loadSARInsight(
  // Accept either the live or offline client — both expose getSARInsight.
  apiClient: Pick<APIClient, "getSARInsight">,
  sar: SAR,
): Promise<SARInsight | null> {
  try {
    return (await apiClient.getSARInsight(sar.id)) ?? null;
  } catch {
    return null;
  }
}
