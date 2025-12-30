// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { testTRPCClient } from "~@meetings/trpc/test/setup";
import {
  fakeResidentMeeting,
  fakeResidents,
} from "~@meetings/trpc/test/setup/seed";

describe("resident router", () => {
  describe("list", () => {
    test("returns list of all residents", async () => {
      const result = await testTRPCClient.v1.resident.list.query();
      expect(result).toIncludeSameMembers([
        {
          personId: fakeResidents[0].personId,
          givenNames: fakeResidents[0].givenNames,
          surname: fakeResidents[0].surname,
          displayPersonExternalId: fakeResidents[0].displayPersonExternalId,
          facilityId: fakeResidents[0].facilityId,
          activeMeetingId: fakeResidentMeeting.id,
        },
        {
          personId: fakeResidents[1].personId,
          givenNames: fakeResidents[1].givenNames,
          surname: fakeResidents[1].surname,
          displayPersonExternalId: fakeResidents[1].displayPersonExternalId,
          facilityId: fakeResidents[1].facilityId,
          activeMeetingId: null,
        },
      ]);
    });

    test("returns only active residents", async () => {
      const result = await testTRPCClient.v1.resident.list.query();
      // Should only include active residents (fakeResidents[0] and fakeResidents[1])
      // and not fakeResidents[2] which has isActive: false
      expect(result).toHaveLength(2);
      expect(
        result.every(
          (resident) => resident.personId !== fakeResidents[2].personId,
        ),
      ).toBe(true);
    });
  });
});
