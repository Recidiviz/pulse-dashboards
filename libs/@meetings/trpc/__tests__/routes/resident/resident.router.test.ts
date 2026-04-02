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
import { createId } from "@paralleldrive/cuid2";

import { PostMeetingProcessingStatus } from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import {
  initFastifyAndSetUser,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import {
  fakeResidentMeeting,
  fakeResidentMeetingCompleted,
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
          meetingId: createId(),
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
              staffEmail: fakeStaff[0].email,
              startTime,
              endTime: null,
              recordingsGCSBucket: "test-audio-bucket",
              recordingsFolderPath: result.id,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOT_STARTED,
            }),
            expect.objectContaining({
              residentId: fakeResidents[0].personId,
              staffEmail: fakeStaff[0].email,
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
      test("Returns own in-progress meetings and all completed meetings", async () => {
        // fakeResidentMeeting belongs to fakeStaff[0] (the current user) and is in progress
        const result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        expect(result).toEqual([
          expect.objectContaining({
            id: fakeResidentMeeting.id,
            startTime: fakeResidentMeeting.startTime,
            endTime: null,
          }),
        ]);
      });

      test("Returns own in-progress meetings but not other staff's in-progress meetings, plus all completed meetings", async () => {
        // Create an in-progress meeting with a different staff member
        const otherStaffInProgressMeeting =
          await testPrismaClient.meeting.create({
            data: {
              residentId: fakeResidents[0].personId,
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
            residentId: fakeResidents[0].personId,
            staffEmail: fakeStaff[1].email,
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

        const resultIds = result.map((m) => m.id);
        // Own in-progress meeting
        expect(resultIds).toContain(fakeResidentMeeting.id);
        // Completed meeting from another staff member
        expect(resultIds).toContain(completedMeeting.id);
        // Other staff's in-progress meeting should be excluded
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
            meetingDetails: {
              id: null,
              caseNote: null,
              lastCompletedMeetingTime: null,
              validationErrorType: null,
            },
          },
          {
            personId: fakeResidents[1].personId,
            givenNames: fakeResidents[1].givenNames,
            surname: fakeResidents[1].surname,
            displayPersonExternalId: fakeResidents[1].displayPersonExternalId,
            facilityId: fakeResidents[1].facilityId,
            activeMeetingId: null,
            meetingDetails: {
              id: fakeResidentMeetingCompleted.id,
              caseNote: null,
              lastCompletedMeetingTime: fakeResidentMeetingCompleted.startTime,
              validationErrorType: null,
            },
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

        const result = await testTRPCClient.v1.resident.createMeeting.mutate({
          residentId: fakeResidents[0].personId,
          startTime,
          meetingId: createId(),
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
            residentId: fakeResidents[0].personId,
            staffEmail: "test@recidiviz.org",
          }),
        );
      });

      test("Blocks recidiviz users from creating meetings in production", async () => {
        const originalDeployEnv = env.DEPLOY_ENV;
        env.DEPLOY_ENV = "production";

        try {
          await expect(
            testTRPCClient.v1.resident.createMeeting.mutate({
              residentId: fakeResidents[0].personId,
              startTime: faker.date.future(),
              meetingId: createId(),
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
      test("Returns own in-progress meetings but not other staff's in-progress meetings, plus all completed meetings", async () => {
        // Create an in-progress meeting owned by the recidiviz user
        const ownInProgressMeeting = await testPrismaClient.meeting.create({
          data: {
            residentId: fakeResidents[0].personId,
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
            residentId: fakeResidents[0].personId,
            staffEmail: fakeStaff[1].email,
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

        const resultIds = result.map((m) => m.id);
        // Own in-progress meeting
        expect(resultIds).toContain(ownInProgressMeeting.id);
        // Completed meeting from another staff member
        expect(resultIds).toContain(completedMeeting.id);
        // fakeResidentMeeting belongs to fakeStaff[0], not the recidiviz user — excluded
        expect(resultIds).not.toContain(fakeResidentMeeting.id);
        expect(result.length).toBe(2);
      });
    });
  });
});
