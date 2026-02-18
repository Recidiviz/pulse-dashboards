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
import env from "~@meetings/trpc/env";
import {
  initFastifyAndSetUser,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import {
  fakeActiveMeeting,
  fakeClients,
  fakeInactiveMeeting,
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
              staffEmail: fakeStaff[0].email,
              startTime,
              endTime: null,
              recordingsGCSBucket: "test-audio-bucket",
              recordingsFolderPath: result.id,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            }),
            expect.objectContaining({
              clientId: fakeClients[0].personId,
              staffEmail: fakeStaff[0].email,
              startTime: fakeActiveMeeting.startTime,
              endTime: null,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            }),
          ]),
        );
      });
    });

    describe("getMeetings", () => {
      test("Returns own in-progress meetings and all completed meetings", async () => {
        // fakeActiveMeeting belongs to fakeStaff[0] (the current user) and is in progress
        const result = await testTRPCClient.v1.client.getMeetings.query({
          clientId: fakeClients[0].personId,
        });

        // Check expected fields are returned
        expect(result).toEqual([
          expect.objectContaining({
            id: fakeActiveMeeting.id,
            startTime: fakeActiveMeeting.startTime,
            endTime: null,
            caseNote: fakeActiveMeeting.caseNote,
          }),
        ]);
      });

      test("Returns own in-progress meetings but not other staff's in-progress meetings, plus all completed meetings", async () => {
        // Create an in-progress meeting with a different staff member
        const otherStaffInProgressMeeting =
          await testPrismaClient.meeting.create({
            data: {
              clientId: fakeClients[0].personId,
              staffEmail: fakeStaff[1].email,
              startTime: faker.date.past(),
              recordingsGCSBucket: "test-audio-bucket",
              recordingsFolderPath: "test-folder",
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            },
          });

        // Create a completed meeting with a different staff member
        const completedMeeting = await testPrismaClient.meeting.create({
          data: {
            clientId: fakeClients[0].personId,
            staffEmail: fakeStaff[1].email,
            startTime: faker.date.past(),
            endTime: faker.date.recent(),
            recordingsGCSBucket: "test-audio-bucket",
            recordingsFolderPath: "test-folder-2",
            postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
          },
        });

        const result = await testTRPCClient.v1.client.getMeetings.query({
          clientId: fakeClients[0].personId,
        });

        // State user (fakeStaff[0]) should see:
        // 1. Their own in-progress meetings (fakeMeeting)
        // 2. All completed/processing meetings regardless of staff (completedMeeting)
        // Should NOT see: otherStaffInProgressMeeting (different staff, in-progress)
        const resultIds = result.map((m) => m.id);
        expect(resultIds).toContain(fakeActiveMeeting.id);
        expect(resultIds).toContain(completedMeeting.id);
        expect(resultIds).not.toContain(otherStaffInProgressMeeting.id);
        expect(result.length).toBe(2);
      });
    });

    describe("list", () => {
      test("returns list of all active clients", async () => {
        const result = await testTRPCClient.v1.client.list.query();

        // Should return all active clients (fakeClients[0], fakeClients[1], fakeClients[3])
        // but not fakeClients[2] which has isActive: false
        expect(result).toHaveLength(3);

        // Verify all expected clients are present with correct structure
        expect(result).toIncludeSameMembers([
          {
            personId: fakeClients[0].personId,
            givenNames: fakeClients[0].givenNames,
            surname: fakeClients[0].surname,
            displayPersonExternalId: fakeClients[0].displayPersonExternalId,
            supervisionType: fakeClients[0].supervisionType,
            activeMeetingId: fakeActiveMeeting.id,
            meetingDetails: {
              lastCompletedMeetingTime: null,
            },
            staffEmails: [fakeStaff[0].email],
          },
          {
            personId: fakeClients[1].personId,
            givenNames: fakeClients[1].givenNames,
            surname: fakeClients[1].surname,
            displayPersonExternalId: fakeClients[1].displayPersonExternalId,
            supervisionType: fakeClients[1].supervisionType,
            activeMeetingId: null,
            meetingDetails: {
              lastCompletedMeetingTime: null,
            },
            staffEmails: [fakeStaff[1].email],
          },
          {
            personId: fakeClients[3].personId,
            givenNames: fakeClients[3].givenNames,
            surname: fakeClients[3].surname,
            displayPersonExternalId: fakeClients[3].displayPersonExternalId,
            supervisionType: fakeClients[3].supervisionType,
            activeMeetingId: null,
            meetingDetails: {
              lastCompletedMeetingTime: fakeInactiveMeeting.startTime,
            },
            staffEmails: [fakeStaff[0].email],
          },
        ]);
      });

      test("returns only active clients", async () => {
        const result = await testTRPCClient.v1.client.list.query();

        // Should not include fakeClients[2] which has isActive: false
        expect(
          result.every((client) => client.personId !== fakeClients[2].personId),
        ).toBe(true);
      });
    });

    describe("get", () => {
      test("returns a single client by personId", async () => {
        const result = await testTRPCClient.v1.client.get.query({
          personId: fakeClients[0].personId,
        });

        expect(result).toEqual({
          personId: fakeClients[0].personId,
          givenNames: fakeClients[0].givenNames,
          surname: fakeClients[0].surname,
          displayPersonExternalId: fakeClients[0].displayPersonExternalId,
          supervisionType: fakeClients[0].supervisionType,
          activeMeetingId: fakeActiveMeeting.id,
          meetingDetails: {
            lastCompletedMeetingTime: null,
          },
          staffEmails: [fakeStaff[0].email],
        });
      });

      test("throws error when client not found", async () => {
        await expect(
          testTRPCClient.v1.client.get.query({
            personId: BigInt(999),
          }),
        ).rejects.toThrow("Client not found or access denied");
      });
    });
  });

  describe("recidiviz user", () => {
    beforeEach(async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz",
          allowedStates: ["US_NE"],
        },
      });
    });

    describe("createMeeting", () => {
      test("Creates a meeting with staffEmail set to the recidiviz user's email", async () => {
        const startTime = faker.date.future();

        const result = await testTRPCClient.v1.client.createMeeting.mutate({
          clientId: fakeClients[0].personId,
          startTime,
        });

        expect(result).toEqual({
          id: expect.any(String),
          startTime,
        });

        const meeting = await testPrismaClient.meeting.findUnique({
          where: { id: result.id },
        });
        expect(meeting).toEqual(
          expect.objectContaining({
            id: result.id,
            clientId: fakeClients[0].personId,
            staffEmail: "test@recidiviz.org",
          }),
        );
      });

      test("Blocks recidiviz users from creating meetings in production", async () => {
        const originalDeployEnv = env.DEPLOY_ENV;
        env.DEPLOY_ENV = "production";

        try {
          await expect(
            testTRPCClient.v1.client.createMeeting.mutate({
              clientId: fakeClients[0].personId,
              startTime: faker.date.future(),
            }),
          ).rejects.toThrow(
            "Recidiviz users may not create meetings in production",
          );
        } finally {
          env.DEPLOY_ENV = originalDeployEnv;
        }
      });
    });

    describe("getMeetings", () => {
      test("Does not return other staff's in-progress meetings", async () => {
        // fakeActiveMeeting belongs to fakeStaff[0], not the recidiviz user
        const result = await testTRPCClient.v1.client.getMeetings.query({
          clientId: fakeClients[0].personId,
        });

        expect(result).toEqual([]);
      });

      test("Returns own in-progress meetings but not other staff's in-progress meetings, plus all completed meetings", async () => {
        // Create an in-progress meeting owned by the recidiviz user
        const ownInProgressMeeting = await testPrismaClient.meeting.create({
          data: {
            clientId: fakeClients[0].personId,
            staffEmail: "test@recidiviz.org",
            startTime: faker.date.past(),
            recordingsGCSBucket: "test-audio-bucket",
            recordingsFolderPath: "test-folder",
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.NOT_STARTED,
          },
        });

        // Create a completed meeting with a different staff member
        const completedMeeting = await testPrismaClient.meeting.create({
          data: {
            clientId: fakeClients[0].personId,
            staffEmail: fakeStaff[1].email,
            startTime: faker.date.past(),
            endTime: faker.date.recent(),
            recordingsGCSBucket: "test-audio-bucket",
            recordingsFolderPath: "test-folder-2",
            postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
          },
        });

        const result = await testTRPCClient.v1.client.getMeetings.query({
          clientId: fakeClients[0].personId,
        });

        const resultIds = result.map((m) => m.id);
        // Own in-progress meeting
        expect(resultIds).toContain(ownInProgressMeeting.id);
        // Completed meeting from another staff member
        expect(resultIds).toContain(completedMeeting.id);
        // fakeActiveMeeting belongs to fakeStaff[0], not the recidiviz user — excluded
        expect(resultIds).not.toContain(fakeActiveMeeting.id);
        expect(result.length).toBe(2);
      });
    });
  });
});
