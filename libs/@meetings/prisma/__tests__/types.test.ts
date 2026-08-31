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

import { describe, expect, test } from "vitest";

import { Client, Resident } from "~@meetings/prisma/client";
import { isResident, Person } from "~@meetings/prisma/types";

describe("isResident", () => {
  const mockClient: Client = {
    personId: BigInt(12345),
    stablePersonExternalId: "EXT_123",
    stablePersonExternalIdType: "STATE_ID",
    pseudonymizedId: "PSEUDO_123",
    stateCode: "US_NE",
    givenNames: "John",
    middleNames: null,
    surname: "Doe",
    suffix: null,
    displayPersonExternalId: "ADC123",
    supervisionType: "PAROLE",
    isActive: true,
    staffEmails: ["fake@fake.com"],
    lastImportedAt: new Date(0),
  };

  const mockResident: Resident = {
    personId: BigInt(67890),
    stablePersonExternalId: "EXT_456",
    stablePersonExternalIdType: "STATE_ID",
    pseudonymizedId: "PSEUDO_456",
    stateCode: "US_NE",
    givenNames: "Jane",
    middleNames: null,
    surname: "Smith",
    suffix: null,
    displayPersonExternalId: "ADC456",
    facilityId: "FACILITY_1",
    isActive: true,
    lastImportedAt: new Date(0),
  };

  test("returns true for a Resident", () => {
    expect(isResident(mockResident)).toBe(true);
  });

  test("returns false for a Client", () => {
    expect(isResident(mockClient)).toBe(false);
  });

  test("returns true for a Resident with an empty facilityId", () => {
    // The guard keys off the field's presence, not its truthiness, so an
    // unset-but-present facility still reads as a resident.
    expect(isResident({ ...mockResident, facilityId: "" })).toBe(true);
  });

  test("narrows a Person to a Resident for the type checker", () => {
    const person: Person = mockResident;

    if (!isResident(person)) {
      throw new Error("expected the resident to narrow");
    }

    // Only compiles if `person` narrowed - facilityId isn't on Client.
    expect(person.facilityId).toBe("FACILITY_1");
  });

  test("leaves a Client as a Client on the false branch", () => {
    const person: Person = mockClient;

    if (isResident(person)) {
      throw new Error("expected the client not to narrow");
    }

    // Only compiles if `person` narrowed to Client - supervisionType isn't on Resident.
    expect(person.supervisionType).toBe("PAROLE");
  });
});
