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

import type { Prisma, PrismaClient } from "~@idaho-th/prisma/client";

/**
 * Narrowest select that can answer "does a row exist?", so the authorization
 * path cannot drift into reading a staff member's email back out.
 */
export const HOUSING_STAFF_EXISTENCE_SELECT = {
  id: true,
} as const satisfies Prisma.HousingStaffSelect;

/** Returns the comparable form of `email`, or undefined if it cannot be one. */
function normalizeStaffEmail(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : undefined;
}

/**
 * Whether a `HousingStaff` row has been provisioned for this address.
 *
 * This is the grant for a Recidiviz address arriving on the passwordless
 * connection: rows are created ahead of time in the Admin Panel, so the table
 * answers for the person rather than the domain answering for everyone who
 * holds a mailbox on it.
 *
 * Case-insensitive on purpose. `HousingStaff.email` is a plain unique column
 * rather than the `lower("email")` expression index `HousingProviderUser` uses,
 * so a row provisioned with different casing would otherwise be invisible here
 * and deny a login that was genuinely granted. The address itself arrives
 * already normalized from the Action, so this can widen a match but never
 * invent one.
 */
export async function isProvisionedStaffEmail(
  prisma: PrismaClient,
  email: string,
): Promise<boolean> {
  const normalizedEmail = normalizeStaffEmail(email);
  if (!normalizedEmail) return false;

  const match = await prisma.housingStaff.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: HOUSING_STAFF_EXISTENCE_SELECT,
  });
  return match !== null;
}
