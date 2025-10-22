// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { describe, test, vi } from "vitest";

import { PostMeetingProcessingStatus } from "~@meetings/prisma/client";
import {
  setGetPayloadImp,
  testPrismaClient,
  testServer,
} from "~@meetings/server/test/setup";
import { fakeMeeting } from "~@meetings/server/test/setup/seed";
import * as tasks from "~@meetings/tasks";

describe("server", () => {
  describe("/stitch-audio", () => {
    describe("auth", () => {
      test("Should return authorization error if token is not provided", async () => {
        const response = await testServer.inject({
          method: "POST",
          url: "/stitch-audio",
          body: {
            stateCode: "US_NE",
            meetingId: fakeMeeting.id,
          },
        });

        expect(response.statusCode).toBe(401);
        expect(JSON.parse(response.body)).toEqual(
          expect.objectContaining({
            error: "Unauthorized",
            message: "No bearer token was provided",
          }),
        );
      });

      test("Should return authorization error if token is invalid", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: false,
            email:
              "test-service-account-email@test-project.iam.gserviceaccount.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: "/stitch-audio",
          headers: { authorization: `Bearer token` },
          body: {
            stateCode: "US_NE",
            meetingId: fakeMeeting.id,
          },
        });

        expect(response.statusCode).toBe(401);
        expect(JSON.parse(response.body)).toEqual(
          expect.objectContaining({
            error: "Unauthorized",
            message: "Email not verified",
          }),
        );
      });

      test("Should return authorization error if email doesn't match expected", async () => {
        setGetPayloadImp(
          vi.fn().mockReturnValue({
            email_verified: true,
            email: "wrong-email@test-project.iam.gserviceaccount.com",
          }),
        );

        const response = await testServer.inject({
          method: "POST",
          url: "/stitch-audio",
          headers: { authorization: `Bearer token` },
          body: {
            stateCode: "US_NE",
            meetingId: fakeMeeting.id,
          },
        });

        expect(response.statusCode).toBe(403);
        expect(JSON.parse(response.body)).toEqual(
          expect.objectContaining({
            error: "Forbidden",
            message: "Invalid email address",
          }),
        );
      });
    });

    test("Should return 500 if meeting does not exist", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: "Not a meeting",
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: expect.stringContaining(
            "Invalid `prisma.meeting.findUniqueOrThrow()` invocation",
          ),
        }),
      );
    });

    test("Should return 500 and set stitching error if audio stitching fails", async () => {
      const mockStitchAudio = vi.spyOn(tasks, "stitchAudio");

      mockStitchAudio.mockImplementationOnce(() => {
        throw new Error("Audio stitching failed");
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          error: "Internal Server Error",
          message: "Audio stitching failed",
        }),
      );

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting.postMeetingProcessingStatus).toBe(
        PostMeetingProcessingStatus.STITCHING_ERROR,
      );
    });

    test("Should return 200 and set transcribing queued if audio stitching succeeds", async () => {
      const mockStitchAudio = vi.spyOn(tasks, "stitchAudio");

      mockStitchAudio.mockImplementationOnce(async () => {
        return "final-path.m4a";
      });

      const response = await testServer.inject({
        method: "POST",
        url: "/stitch-audio",
        headers: { authorization: `Bearer token` },
        body: {
          stateCode: "US_NE",
          meetingId: fakeMeeting.id,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual("Audio stitching completed successfully");

      const meeting = await testPrismaClient.meeting.findUniqueOrThrow({
        where: { id: fakeMeeting.id },
      });

      expect(meeting).toEqual(
        expect.objectContaining({
          finalRecordingGCSPath: "final-path.m4a",
          postMeetingProcessingStatus:
            PostMeetingProcessingStatus.TRANSCRIBING_QUEUED,
        }),
      );
    });
  });
});
