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

// Shared helpers for the Typesense scoped-key endpoints.

import type { SystemId } from "~datatypes";

const VALID_SYSTEMS = [
  "SUPERVISION",
  "INCARCERATION",
  "ALL",
] as const satisfies readonly SystemId[];

export function isValidSystem(value: unknown): value is SystemId {
  return (
    typeof value === "string" &&
    (VALID_SYSTEMS as readonly string[]).includes(value)
  );
}

export function invalidSystemMessage(): string {
  return `system must be one of ${VALID_SYSTEMS.join(", ")}`;
}

// Firestore doc IDs in supervisionStaff / incarcerationStaff / userUpdates are
// composites of the lowercased stateCode + externalId (e.g. "us_tn_agonzalez123").
export function staffDocId(stateCode: string, externalId: string): string {
  return `${stateCode.toLowerCase()}_${externalId}`;
}
