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

import { faker } from "@faker-js/faker";

import { PostMeetingProcessingStatus } from "~@meetings/prisma/client";
import {
  initFastifyAndSetUser,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import {
  fakeClients,
  fakeMeeting,
  fakeStaff,
} from "~@meetings/trpc/test/setup/seed";

describe("client router", () => {
  describe("state user", () => {
    describe("createMeeting", () => {
      test("Creates a meeting", async () => {
        const startTime = faker.date.future();

        const result = await testTRPCClient.v1.client.createMeeting.mutate({
          clientId: fakeClients[0].personId,
          startTime,
        });

        // Check expected fields are returned
        expect(result).toEqual({
          id: expect.any(String),
          startTime,
        });

        // Check meeting was created in DB
        const meetings = await testPrismaClient.meeting.findMany({
          where: { clientId: fakeClients[0].personId },
        });
        expect(meetings.length).toBe(2);
        expect(meetings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: result.id,
              clientId: fakeClients[0].personId,
              staffId: fakeStaff[0].staffId,
              startTime,
              endTime: null,
              recordingsGCSBucket: "test-audio-bucket",
              recordingsFolderPath: result.id,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            }),
            expect.objectContaining({
              clientId: fakeClients[0].personId,
              staffId: fakeStaff[0].staffId,
              startTime: fakeMeeting.startTime,
              endTime: null,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            }),
          ]),
        );
      });
    });

    describe("getMeetings", () => {
      test("Returns list of meetings", async () => {
        const result = await testTRPCClient.v1.client.getMeetings.query({
          clientId: fakeClients[0].personId,
        });

        // Check expected fields are returned
        expect(result).toEqual([
          expect.objectContaining({
            id: fakeMeeting.id,
            startTime: fakeMeeting.startTime,
            endTime: null,
          }),
        ]);
      });

      test("Returns error when client does not belong to staff", async () => {
        await expect(
          testTRPCClient.v1.client.getMeetings.query({
            clientId: fakeClients[1].personId,
          }),
        ).rejects.toMatchObject({
          message: "Client not found",
          data: { code: "NOT_FOUND" },
        });
      });
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

    describe("getMeetings", () => {
      test("Returns list of meetings", async () => {
        const result = await testTRPCClient.v1.client.getMeetings.query({
          clientId: fakeClients[0].personId,
        });

        // Check expected fields are returned
        expect(result).toEqual([
          expect.objectContaining({
            id: fakeMeeting.id,
            startTime: fakeMeeting.startTime,
            endTime: null,
          }),
        ]);
      });

      test("Returns error when client does not belong to staff", async () => {
        await expect(
          testTRPCClient.v1.client.getMeetings.query({
            clientId: fakeClients[1].personId,
          }),
        ).rejects.toMatchObject({
          message: "Client not found",
          data: { code: "NOT_FOUND" },
        });
      });
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

    test("Returns list of meetings", async () => {
      let result = await testTRPCClient.v1.client.getMeetings.query({
        clientId: fakeClients[0].personId,
      });

      // Check expected fields are returned
      expect(result).toEqual([
        expect.objectContaining({
          id: fakeMeeting.id,
          startTime: fakeMeeting.startTime,
          endTime: null,
          postMeetingProcessingStatus: PostMeetingProcessingStatus.NOT_STARTED,
        }),
      ]);

      // Check that we can also query a different client
      result = await testTRPCClient.v1.client.getMeetings.query({
        clientId: fakeClients[1].personId,
      });

      // There are no meetings for this client, but it should not error
      expect(result).toEqual([]);
    });
  });
});
