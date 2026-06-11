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
import { IMPERSONATED_EMAIL_HEADER_KEY } from "~@meetings/trpc/context";
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
  pseudoMeetingType,
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
          meetingType: pseudoMeetingType,
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

      test("Creates a meeting without meetingType", async () => {
        const startTime = faker.date.future();
        const meetingId = createId();

        const result = await testTRPCClient.v1.resident.createMeeting.mutate({
          residentId: fakeResidents[0].personId,
          startTime,
          meetingId,
        });

        expect(result).toEqual({
          id: meetingId,
          startTime,
        });

        const meeting = await testPrismaClient.meeting.findUnique({
          where: { id: meetingId },
        });
        expect(meeting).toEqual(
          expect.objectContaining({
            id: meetingId,
            meetingType: null,
            meetingTypeCategory: null,
          }),
        );
      });
    });

    describe("getMeetings", () => {
      test("Does not return in-progress meetings", async () => {
        // fakeResidentMeeting belongs to fakeStaff[0] (the current user) but has no endTime
        const result = await testTRPCClient.v1.resident.getMeetings.query({
          residentId: fakeResidents[0].personId,
        });

        expect(result).toEqual([]);
      });

      test("Returns only completed meetings, excluding all in-progress meetings", async () => {
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
        expect(resultIds).toContain(completedMeeting.id);
        expect(resultIds).not.toContain(fakeResidentMeeting.id);
        expect(resultIds).not.toContain(otherStaffInProgressMeeting.id);
        expect(result.length).toBe(1);
      });
    });

    describe("list", () => {
      test("returns list of all residents", async () => {
        const result = await testTRPCClient.v1.resident.list.query();
        expect(result.data).toIncludeSameMembers([
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
              staffEmail: null,
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
              staffEmail: fakeStaff[0].email,
            },
          },
        ]);
      });

      test("returns only active residents", async () => {
        const result = await testTRPCClient.v1.resident.list.query();
        // Should only include active residents (fakeResidents[0] and fakeResidents[1])
        // and not fakeResidents[2] which has isActive: false
        expect(result.data).toHaveLength(2);
        expect(
          result.data.every(
            (resident) => resident.personId !== fakeResidents[2].personId,
          ),
        ).toBe(true);
      });

      describe("pagination", () => {
        test("returns pagination metadata", async () => {
          const result = await testTRPCClient.v1.resident.list.query({
            size: 1,
          });
          expect(result.page).toBe(1);
          expect(result.total).toBe(2);
          expect(result.totalPages).toBe(2);
          expect(result.nextCursor).toBe(2);
        });

        test("pages via cursor and omits nextCursor on last page", async () => {
          const page2 = await testTRPCClient.v1.resident.list.query({
            size: 1,
            cursor: 2,
          });
          expect(page2.data).toHaveLength(1);
          expect(page2.page).toBe(2);
          expect(page2.nextCursor).toBeUndefined();
        });

        test("pages cover all active residents without overlap", async () => {
          const page1 = await testTRPCClient.v1.resident.list.query({
            size: 1,
          });
          const page2 = await testTRPCClient.v1.resident.list.query({
            size: 1,
            cursor: 2,
          });
          const allIds = [
            ...page1.data.map((r) => r.personId),
            ...page2.data.map((r) => r.personId),
          ];
          expect(allIds).toIncludeSameMembers([
            fakeResidents[0].personId,
            fakeResidents[1].personId,
          ]);
        });
      });

      describe("search", () => {
        test("filters by displayPersonExternalId", async () => {
          const result = await testTRPCClient.v1.resident.list.query({
            filters: { search: fakeResidents[1].displayPersonExternalId },
          });
          expect(result.total).toBe(1);
          expect(result.data[0].personId).toBe(fakeResidents[1].personId);
          expect(result.nextCursor).toBeUndefined();
        });
      });

      describe("sortBy", () => {
        test("sortBy=id orders by displayPersonExternalId ascending", async () => {
          const result = await testTRPCClient.v1.resident.list.query({
            sort: { sortBy: "id", sortDirection: "asc" },
          });
          const ids = result.data.map((r) => r.personId);
          // fakeResidents[0] has an active meeting with the current user → first
          // fakeResidents[1]: "resident-display-ext-2" → second
          expect(ids).toEqual([
            fakeResidents[0].personId,
            fakeResidents[1].personId,
          ]);
        });

        test("sortBy=lastMeeting orders by most recent completed meeting, nulls last", async () => {
          const result = await testTRPCClient.v1.resident.list.query({
            sort: { sortBy: "lastMeeting", sortDirection: "desc" },
          });
          const ids = result.data.map((r) => r.personId);
          // fakeResidents[0]: active meeting with current user → first
          // fakeResidents[1]: has fakeResidentMeetingCompleted → second
          expect(ids).toEqual([
            fakeResidents[0].personId,
            fakeResidents[1].personId,
          ]);
        });
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
          meetingType: pseudoMeetingType,
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

      test("Blocks recidiviz users from creating non-demo meetings in production", async () => {
        const originalDeployEnv = env.DEPLOY_ENV;
        env.DEPLOY_ENV = "production";

        try {
          await expect(
            testTRPCClient.v1.resident.createMeeting.mutate({
              residentId: fakeResidents[0].personId,
              startTime: faker.date.future(),
              meetingId: createId(),
              meetingType: pseudoMeetingType,
            }),
          ).rejects.toThrow(
            "Recidiviz users may not create non-demo meetings in production",
          );
        } finally {
          env.DEPLOY_ENV = originalDeployEnv;
        }
      });

      test("Allows recidiviz users to create meetings in US_DEMO in production", async () => {
        const originalDeployEnv = env.DEPLOY_ENV;
        env.DEPLOY_ENV = "production";

        await initFastifyAndSetUser(
          {
            "https://dashboard.recidiviz.org/email_address":
              "test@recidiviz.org",
            "https://dashboard.recidiviz.org/app_metadata": {
              stateCode: "recidiviz",
              allowedStates: ["US_DEMO"],
            },
          },
          { stateCode: "US_DEMO" },
        );

        try {
          const startTime = faker.date.future();
          const result = await testTRPCClient.v1.resident.createMeeting.mutate({
            residentId: fakeResidents[0].personId,
            startTime,
            meetingId: createId(),
            meetingType: pseudoMeetingType,
          });

          expect(result).toEqual({
            id: expect.any(String),
            startTime,
          });
        } finally {
          env.DEPLOY_ENV = originalDeployEnv;
        }
      });
    });

    describe("getMeetings", () => {
      test("Returns only completed meetings, excluding all in-progress meetings", async () => {
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
        expect(resultIds).toContain(completedMeeting.id);
        expect(resultIds).not.toContain(ownInProgressMeeting.id);
        expect(resultIds).not.toContain(fakeResidentMeeting.id);
        expect(result.length).toBe(1);
      });
    });
  });

  describe("impersonation", () => {
    describe("createMeeting", () => {
      test("Blocks recidiviz users from creating meetings in production even when impersonating", async () => {
        const originalDeployEnv = env.DEPLOY_ENV;
        env.DEPLOY_ENV = "production";

        await initFastifyAndSetUser(
          {
            "https://dashboard.recidiviz.org/email_address":
              "test@recidiviz.org",
            "https://dashboard.recidiviz.org/app_metadata": {
              stateCode: "recidiviz",
              allowedStates: ["US_NE"],
            },
          },
          {
            extraHeaders: {
              [IMPERSONATED_EMAIL_HEADER_KEY]: fakeStaff[0].email,
            },
          },
        );

        try {
          await expect(
            testTRPCClient.v1.resident.createMeeting.mutate({
              residentId: fakeResidents[0].personId,
              startTime: faker.date.future(),
              meetingId: createId(),
              meetingType: pseudoMeetingType,
            }),
          ).rejects.toThrow(
            "Recidiviz users may not create non-demo meetings in production",
          );
        } finally {
          env.DEPLOY_ENV = originalDeployEnv;
        }
      });
    });
  });
});
