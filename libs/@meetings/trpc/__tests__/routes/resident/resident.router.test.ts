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
  fakeResidentMeeting,
  fakeResidents,
  fakeStaff,
} from "~@meetings/trpc/test/setup/seed";

describe("resident router", () => {
  describe("state user", () => {
    describe("createMeeting", () => {
      test("Creates a meeting", async () => {
        const startTime = faker.date.future();

        const result = await testTRPCClient.v1.resident.createMeeting.mutate({
          residentId: fakeResidents[0].personId,
          startTime,
        });

        // Check expected fields are returned
        expect(result).toEqual({
          id: expect.any(String),
          startTime,
        });

        // Check meeting was created in DB
        const meetings = await testPrismaClient.meeting.findMany({
          where: { residentId: fakeResidents[0].personId },
        });
        expect(meetings.length).toBe(2);
        expect(meetings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: result.id,
              residentId: fakeResidents[0].personId,
              staffId: fakeStaff[0].staffId,
              startTime,
              endTime: null,
              recordingsGCSBucket: "test-audio-bucket",
              recordingsFolderPath: result.id,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            }),
            expect.objectContaining({
              residentId: fakeResidents[0].personId,
              staffId: fakeStaff[0].staffId,
              startTime: fakeResidentMeeting.startTime,
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
        const result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        // Check expected fields are returned
        expect(result).toEqual([
          expect.objectContaining({
            id: fakeResidentMeeting.id,
            startTime: fakeResidentMeeting.startTime,
            endTime: null,
          }),
        ]);
      });

      test("Returns only own in-progress meetings but all completed meetings", async () => {
        // Create an in-progress meeting with a different staff member
        const otherStaffInProgressMeeting =
          await testPrismaClient.meeting.create({
            data: {
              residentId: fakeResidents[0].personId,
              staffId: fakeStaff[1].staffId,
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
            residentId: fakeResidents[0].personId,
            staffId: fakeStaff[1].staffId,
            startTime: faker.date.past(),
            endTime: faker.date.recent(),
            recordingsGCSBucket: "test-audio-bucket",
            recordingsFolderPath: "test-folder-2",
            postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
          },
        });

        const result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        // State user (fakeStaff[0]) should see:
        // 1. Their own in-progress meetings (fakeResidentMeeting)
        // 2. All completed/processing meetings regardless of staff (completedMeeting)
        // Should NOT see: otherStaffInProgressMeeting (different staff, in-progress)
        const resultIds = result.map((m) => m.id);
        expect(resultIds).toContain(fakeResidentMeeting.id);
        expect(resultIds).toContain(completedMeeting.id);
        expect(resultIds).not.toContain(otherStaffInProgressMeeting.id);
        expect(result.length).toBe(2);
      });
    });

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
        const result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        // Check expected fields are returned
        expect(result).toEqual([
          expect.objectContaining({
            id: fakeResidentMeeting.id,
            startTime: fakeResidentMeeting.startTime,
            endTime: null,
          }),
        ]);
      });
    });
  });

  describe("recidiviz user", () => {
    beforeEach(async () => {
      await initFastifyAndSetUser({
        "https://dashboard.recidiviz.org/app_metadata": {
          stateCode: "recidiviz",
          allowedStates: ["US_NE"],
        },
      });
    });

    describe("createMeeting", () => {
      test("Creates a meeting without staffId in non-production", async () => {
        const startTime = faker.date.future();

        const result = await testTRPCClient.v1.resident.createMeeting.mutate({
          residentId: fakeResidents[0].personId,
          startTime,
        });

        // Check expected fields are returned
        expect(result).toEqual({
          id: expect.any(String),
          startTime,
        });

        // Check meeting was created in DB without staffId
        const meeting = await testPrismaClient.meeting.findUnique({
          where: { id: result.id },
        });
        expect(meeting).toEqual(
          expect.objectContaining({
            id: result.id,
            residentId: fakeResidents[0].personId,
            staffId: null,
          }),
        );
      });

      test("Blocks recidiviz users from creating meetings in production", async () => {
        const originalDeployEnv = env.DEPLOY_ENV;
        env.DEPLOY_ENV = "production";

        try {
          const startTime = faker.date.future();

          await expect(
            testTRPCClient.v1.resident.createMeeting.mutate({
              residentId: fakeResidents[0].personId,
              startTime,
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
      test("Does not return in-progress meetings of staff user", async () => {
        // Recidiviz users should NOT see the fakeResidentMeeting because it has a staffId
        // and is NOT_STARTED (in-progress)
        let result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        expect(result).toEqual([]);

        // Check that we can also query a different resident
        result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[1].personId,
        });

        // There are no meetings for this resident, but it should not error
        expect(result).toEqual([]);
      });

      test("Returns only in-progress meetings without staffId and all completed meetings", async () => {
        // Create a meeting without staffId (RECIDIVIZ user)
        const recidivizMeeting = await testPrismaClient.meeting.create({
          data: {
            residentId: fakeResidents[0].personId,
            staffId: null,
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
            residentId: fakeResidents[0].personId,
            staffId: fakeStaff[1].staffId,
            startTime: faker.date.past(),
            endTime: faker.date.recent(),
            recordingsGCSBucket: "test-audio-bucket",
            recordingsFolderPath: "test-folder-2",
            postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
          },
        });

        const result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        // RECIDIVIZ user should see:
        // 1. In-progress meetings without staffId (recidivizMeeting)
        // 2. All completed/processing meetings regardless of staff (completedMeeting)
        // Should NOT see: fakeResidentMeeting (has staffId and is NOT_STARTED)
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: recidivizMeeting.id, // Meeting without staffId
            }),
            expect.objectContaining({
              id: completedMeeting.id, // Completed meeting with different staff
            }),
          ]),
        );
        expect(result.length).toBe(2);
        expect(result).not.toContainEqual(
          expect.objectContaining({
            id: fakeResidentMeeting.id,
          }),
        );
      });
    });
  });
});
