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

import { TRPCError } from "@trpc/server";

import { caller, mockCtx } from "../../../../test/mockResidentProcedure";
import { testPrismaClient } from "../../../../test/prisma";

const residentInFacility = {
  pseudonymizedId: "resident-in-facility",
  personExternalId: "ext-1",
  displayId: "display-1",
  givenNames: "Jane",
  surname: "Doe",
  facilityId: "facility-1",
  importedAt: new Date("2026-01-01"),
  stateSpecificData: {},
};

const secondResidentInFacility = {
  pseudonymizedId: "second-resident-in-facility",
  personExternalId: "ext-3",
  displayId: "display-3",
  givenNames: "Alex",
  surname: "Lee",
  facilityId: "facility-1",
  importedAt: new Date("2026-01-01"),
  stateSpecificData: {},
};

const residentWithEarlierGivenName = {
  pseudonymizedId: "resident-with-earlier-given-name",
  personExternalId: "ext-4",
  displayId: "display-4",
  givenNames: "Amy",
  surname: "Doe",
  facilityId: "facility-1",
  importedAt: new Date("2026-01-01"),
  stateSpecificData: {},
};

const residentWithLaterGivenName = {
  pseudonymizedId: "resident-with-later-given-name",
  personExternalId: "ext-5",
  displayId: "display-5",
  givenNames: "Zoe",
  surname: "Doe",
  facilityId: "facility-1",
  importedAt: new Date("2026-01-01"),
  stateSpecificData: {},
};

const residentInOtherFacility = {
  pseudonymizedId: "resident-in-other-facility",
  personExternalId: "ext-2",
  displayId: "display-2",
  givenNames: "John",
  surname: "Smith",
  facilityId: "facility-2",
  importedAt: new Date("2026-01-01"),
  stateSpecificData: {},
};

describe("getResidentsInFacility", () => {
  test("throws FORBIDDEN when the user does not have the enhanced permission", async () => {
    const error: TRPCError = await caller
      .getResidentsInFacility({ facilityId: "facility-1" })
      .catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("FORBIDDEN");
  });

  describe("with the enhanced permission", () => {
    beforeEach(() => {
      mockCtx.permissions = ["enhanced"];
    });

    test("returns the selected fields for residents in the given facility, sorted alphabetically by surname", async () => {
      // inserted in reverse-alphabetical order (by surname) so the assertion
      // below only passes if the endpoint actually sorts the results, rather
      // than happening to return them in insertion order
      await testPrismaClient.resident.createMany({
        data: [
          secondResidentInFacility,
          residentInFacility,
          residentInOtherFacility,
        ],
      });

      const result = await caller.getResidentsInFacility({
        facilityId: "facility-1",
      });

      expect(result).toEqual(
        [residentInFacility, secondResidentInFacility].map((resident) => ({
          pseudonymizedId: resident.pseudonymizedId,
          givenNames: resident.givenNames,
          surname: resident.surname,
          displayId: resident.displayId,
        })),
      );
    });

    test("sorts residents with the same surname by given name", async () => {
      // inserted in reverse order (by given name) so the assertion below
      // only passes if the endpoint actually sorts on given name as a
      // tiebreaker, rather than happening to return them in insertion order
      await testPrismaClient.resident.createMany({
        data: [residentWithLaterGivenName, residentWithEarlierGivenName],
      });

      const result = await caller.getResidentsInFacility({
        facilityId: "facility-1",
      });

      expect(result).toEqual(
        [residentWithEarlierGivenName, residentWithLaterGivenName].map(
          (resident) => ({
            pseudonymizedId: resident.pseudonymizedId,
            givenNames: resident.givenNames,
            surname: resident.surname,
            displayId: resident.displayId,
          }),
        ),
      );
    });

    test("returns an empty array when no residents are in the facility", async () => {
      const result = await caller.getResidentsInFacility({
        facilityId: "facility-1",
      });

      expect(result).toEqual([]);
    });
  });
});
