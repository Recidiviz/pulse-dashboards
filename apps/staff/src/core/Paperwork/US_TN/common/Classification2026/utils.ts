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
  BLOCKED_DOWNLOAD_MISSING_FIELDS_TOOLTIP,
  BLOCKED_DOWNLOAD_MISSING_HEARING_DATE,
} from "./copy";

export const RCAF_V2_CUTOFF_DATE = new Date("2026-05-26");

export function cafBlockedDownloadTooltip(
  totalScore: number | undefined,
  hearingDate: string | undefined,
): string | undefined {
  if (totalScore === undefined) return BLOCKED_DOWNLOAD_MISSING_FIELDS_TOOLTIP;
  if (hearingDate === undefined) return BLOCKED_DOWNLOAD_MISSING_HEARING_DATE;
  return undefined;
}
