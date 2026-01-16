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
  fakeActiveMeeting,
  fakeClients,
  fakeInactiveMeeting,
  fakeMeetingStaff1,
  fakeStaff,
} from "~@meetings/trpc/test/setup/seed";

describe("staff router", () => {
  describe("state user", () => {
    test("getClients returns list of clients for staff member", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      expect(result).toIncludeSameMembers([
        {
          personId: fakeClients[0].personId,
          givenNames: fakeClients[0].givenNames,
          surname: fakeClients[0].surname,
          displayPersonExternalId: fakeClients[0].displayPersonExternalId,
          activeMeetingId: fakeActiveMeeting.id,
          supervisionType: fakeClients[0].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: null,
          },
        },
        {
          personId: fakeClients[3].personId,
          givenNames: fakeClients[3].givenNames,
          surname: fakeClients[3].surname,
          displayPersonExternalId: fakeClients[3].displayPersonExternalId,
          activeMeetingId: null,
          supervisionType: fakeClients[3].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: fakeInactiveMeeting.startTime,
          },
        },
      ]);
    });

    test("getClients returns only active clients", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      // Should not include fakeClients[2] which has isActive: false
      expect(result).toHaveLength(2);
      expect(
        result.every((client) => client.personId !== fakeClients[2].personId),
      ).toBe(true);
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
      expect(result).toIncludeSameMembers([
        {
          personId: fakeClients[0].personId,
          givenNames: fakeClients[0].givenNames,
          surname: fakeClients[0].surname,
          displayPersonExternalId: fakeClients[0].displayPersonExternalId,
          activeMeetingId: fakeActiveMeeting.id,
          supervisionType: fakeClients[0].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: null,
          },
        },
        {
          personId: fakeClients[3].personId,
          givenNames: fakeClients[3].givenNames,
          surname: fakeClients[3].surname,
          displayPersonExternalId: fakeClients[3].displayPersonExternalId,
          activeMeetingId: null,
          supervisionType: fakeClients[3].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: fakeInactiveMeeting.startTime,
          },
        },
      ]);
    });

    test("getClients returns only active clients", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      // Should not include fakeClients[2] which has isActive: false
      expect(result).toHaveLength(2);
      expect(
        result.every((client) => client.personId !== fakeClients[2].personId),
      ).toBe(true);
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
          activeMeetingId: fakeActiveMeeting.id,
          supervisionType: fakeClients[0].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: null,
          },
        },
        {
          personId: fakeClients[1].personId,
          givenNames: fakeClients[1].givenNames,
          surname: fakeClients[1].surname,
          displayPersonExternalId: fakeClients[1].displayPersonExternalId,
          activeMeetingId: fakeMeetingStaff1.id, //returns meeting attached to staff[1] because this is a recidiviz user
          supervisionType: fakeClients[1].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: null,
          },
        },
        {
          personId: fakeClients[3].personId,
          givenNames: fakeClients[3].givenNames,
          surname: fakeClients[3].surname,
          displayPersonExternalId: fakeClients[3].displayPersonExternalId,
          activeMeetingId: null,
          supervisionType: fakeClients[3].supervisionType,
          meetingDetails: {
            lastCompletedMeetingTime: fakeInactiveMeeting.startTime,
          },
        },
      ]);
    });

    test("getClients returns only active clients", async () => {
      const result = await testTRPCClient.v1.staff.getClients.query();
      // Should only include active clients (fakeClients[0] and fakeClients[1] and fakeClients[3])
      // and not fakeClients[2] which has isActive: false
      expect(result).toHaveLength(3);
      expect(
        result.every((client) => client.personId !== fakeClients[2].personId),
      ).toBe(true);
    });
  });
});
