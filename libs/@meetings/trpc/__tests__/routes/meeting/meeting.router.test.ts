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

import { Storage } from "@google-cloud/storage";
import { describe, expect, test, vi } from "vitest";

import { PostMeetingProcessingStatus } from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";
import {
  GCS_API_ENDPOINT,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeClient, fakeMeeting } from "~@meetings/trpc/test/setup/seed";

const FAKE_DATE = new Date("2025-09-18");

describe("meeting router", () => {
  beforeAll(() => {
    // // tell vitest we use mocked time
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_DATE);
  });

  afterAll(() => {
    // restoring date after the tests are complete
    vi.useRealTimers();
  });

  describe("getSignedUrlForRecording", () => {
    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.getSignedUrlForRecording.query({
          clientId: fakeClient.personId,
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Returns a signed URL for the meeting recording", async () => {
      const result =
        await testTRPCClient.v1.meeting.getSignedUrlForRecording.query({
          clientId: fakeClient.personId,
          meetingId: fakeMeeting.id,
        });

      expect(result).toEqual(
        `${GCS_API_ENDPOINT}/${fakeMeeting.id}/${FAKE_DATE.getTime() / 1000}.m4a`,
      );
    });
  });

  describe("endMeeting", () => {
    beforeAll(async () => {
      const storage = new Storage({
        apiEndpoint: GCS_API_ENDPOINT,
        projectId: "test",
      });

      await storage.createBucket(env.AUDIO_RECORDINGS_BUCKET_NAME);

      await storage
        .bucket(env.AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/1.m4a", {
          destination: `${fakeMeeting.id}/1.m4a`,
          resumable: false,
        });
      await storage
        .bucket(env.AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/2.m4a", {
          destination: `${fakeMeeting.id}/2.m4a`,
          resumable: false,
        });
      await storage
        .bucket(env.AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/3.m4a", {
          destination: `${fakeMeeting.id}/3.m4a`,
          resumable: false,
        });
    });

    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.v1.meeting.endMeeting.mutate({
          clientId: fakeClient.personId,
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting with that id was not found",
        data: { code: "NOT_FOUND" },
      });
    });

    test("Should end meeting and stitch together audio", async () => {
      await testTRPCClient.v1.meeting.endMeeting.mutate({
        clientId: fakeClient.personId,
        meetingId: fakeMeeting.id,
      });

      const updatedMeeting = await testPrismaClient.meeting.findUnique({
        where: { id: fakeMeeting.id },
      });

      // Check that end date has been set
      expect(updatedMeeting).toEqual(
        expect.objectContaining({
          endTime: FAKE_DATE,
          postMeetingProcessingStatus: PostMeetingProcessingStatus.TRANSCRIBING,
          finalRecordingGCSPath: `${env.AUDIO_RECORDINGS_BUCKET_NAME}/${fakeMeeting.id}/final.m4a`,
        }),
      );

      // Check that the "final" audio file has been created
      const storage = new Storage({
        apiEndpoint: GCS_API_ENDPOINT,
        projectId: "test",
      });
      const [files] = await storage
        .bucket(env.AUDIO_RECORDINGS_BUCKET_NAME)
        .getFiles({ prefix: `${fakeMeeting.id}/` });
      expect(files.map((f) => f.name)).toEqual(
        expect.arrayContaining([`${fakeMeeting.id}/final.m4a`]),
      );
    });
  });
});
