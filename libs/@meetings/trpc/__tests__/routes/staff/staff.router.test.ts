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

import {
  initFastifyAndSetUser,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import {
  fakeClients,
  fakeMeeting,
  fakeStaff,
} from "~@meetings/trpc/test/setup/seed";

describe("staff router", () => {
  describe("state user", () => {
    test("getClients returns list of clients for staff member", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      expect(result).toEqual([
        {
          personId: fakeClients[0].personId,
          givenNames: fakeClients[0].givenNames,
          surname: fakeClients[0].surname,
          displayPersonExternalId: fakeClients[0].displayPersonExternalId,
          activeMeetingId: fakeMeeting.id,
          supervisionType: fakeClients[0].supervisionType,
        },
      ]);
    });
  });

  describe("recidiviz user with pseudo ID set", () => {
    beforeEach(async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz",
          pseudonymizedId: fakeStaff[0].pseudonymizedId,
          allowedStates: ["US_NE"],
        },
      });
    });

    test("getClients returns list of clients for staff member", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      expect(result).toEqual([
        {
          personId: fakeClients[0].personId,
          givenNames: fakeClients[0].givenNames,
          surname: fakeClients[0].surname,
          displayPersonExternalId: fakeClients[0].displayPersonExternalId,
          activeMeetingId: fakeMeeting.id,
          supervisionType: fakeClients[0].supervisionType,
        },
      ]);
    });
  });

  describe("recidiviz user without pseudo ID set", () => {
    beforeEach(async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz",
          allowedStates: ["US_NE"],
        },
      });
    });

    test("getClients returns list of clients for staff member with active meeting id", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      expect(result).toIncludeSameMembers([
        {
          personId: fakeClients[0].personId,
          givenNames: fakeClients[0].givenNames,
          surname: fakeClients[0].surname,
          displayPersonExternalId: fakeClients[0].displayPersonExternalId,
          activeMeetingId: fakeMeeting.id,
          supervisionType: fakeClients[0].supervisionType,
        },
        {
          personId: fakeClients[1].personId,
          givenNames: fakeClients[1].givenNames,
          surname: fakeClients[1].surname,
          displayPersonExternalId: fakeClients[1].displayPersonExternalId,
          activeMeetingId: null,
          supervisionType: fakeClients[1].supervisionType,
        },
      ]);
    });
  });
});
