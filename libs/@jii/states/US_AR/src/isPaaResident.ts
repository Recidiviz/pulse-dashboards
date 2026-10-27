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

import { UsArResidentJiiData } from "~@jii/schemas";

/**
 * Returns whether the resident was sentenced under the Protect Arkansas Act
 * (PAA), the sentencing law that took effect January 1, 2025. AR sets
 * cohortCode to the sentencing law it used to calculate the eligibility date,
 * and code 4 is PAA. PAA residents have a Release Eligibility Date and earn
 * most of their credit through programming rather than good time.
 *
 * In our app, they see many features other residents do not see, such as a Protect Act
 * version of the Important Dates Learn More page and an Earned Release Credit
 * policy page.
 */
export function isPaaResident(metadata: UsArResidentJiiData): boolean {
  return metadata.cohortCode === "4";
}
