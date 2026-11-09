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

// Date.now() has 13 decimal digits until the year 2286.
const TIME_WIDTH = 13;

/**
 * Returns a new id for a report row the PHI adds, such as
 * "phi_1793890800000_4f9c2a1e". It is the time in milliseconds, padded to a
 * fixed width, then a random suffix, so two tabs that add a row in the same
 * millisecond don't collide. resolveSection sorts the rows the PHI added by
 * id, and the fixed width makes that the order they were added in. The phi_
 * prefix keeps these ids apart from the Atlas ids that key a section's other
 * rows.
 */
export function newPhiRowId(): string {
  const time = String(Date.now()).padStart(TIME_WIDTH, "0");
  const suffix = crypto.randomUUID().slice(0, 8);
  return `phi_${time}_${suffix}`;
}
