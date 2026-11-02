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

import { UsIaEarlyDischargeCharge } from "~datatypes";

/**
 * Returns the line that identifies a charge, such as "POLK · FECR002891 · Count 1".
 * Jurisdictions get no " Co." suffix because out-of-state charges carry a state
 * name instead of a county.
 */
export function chargeMetaLine(
  charge: Pick<
    UsIaEarlyDischargeCharge,
    "jurisdiction" | "causeNumber" | "counts"
  >,
): string {
  return `${charge.jurisdiction} · ${charge.causeNumber} · Count ${charge.counts}`;
}
