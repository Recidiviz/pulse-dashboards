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

import { describe, expect, test, vi } from "vitest";

import { mockStorage, testTRPCClient } from "~@meetings/trpc/test/setup";
import { fakeClient, fakeMeeting } from "~@meetings/trpc/test/setup/seed";

const FAKE_DATE = new Date("2025-09-18");

describe("meeting router", () => {
  describe("getSignedUrlForRecording", () => {
    beforeAll(() => {
      vi.mock("@google-cloud/storage", () => ({
        Storage: vi.fn().mockImplementation(() => {
          return mockStorage;
        }),
      }));

      // // tell vitest we use mocked time
      vi.useFakeTimers();
      vi.setSystemTime(FAKE_DATE);

      const bucket = mockStorage.bucket(
        process.env["AUDIO_RECORDING_BUCKET_NAME"] || "test-audio-bucket",
      );

      // We need to create the bucket and file because the mock-gcs library needs the file to exist in order to create a signed URL (not true of real GCS)
      const fakeSecondsSinceEpoch = Math.round(FAKE_DATE.getTime() / 1000);
      const fileName = `${fakeMeeting.id}/${fakeSecondsSinceEpoch}.m4a`;
      const file = bucket.file(fileName);
      file.save("Hello, world!");
    });

    afterAll(() => {
      // restoring date after each test run
      vi.useRealTimers();
    });

    test("Should throw error if meeting does not exist", async () => {
      await expect(
        testTRPCClient.meeting.getSignedUrlForRecording.query({
          clientId: fakeClient.personId,
          meetingId: "non-existent-meeting-id",
        }),
      ).rejects.toMatchObject({
        message: "Meeting not found",
        data: { code: "NOT_FOUND" },
      });
    }, 10000);

    test("Returns a signed URL for the meeting recording", async () => {
      const result =
        await testTRPCClient.meeting.getSignedUrlForRecording.query({
          clientId: fakeClient.personId,
          meetingId: fakeMeeting.id,
        });

      expect(result).toEqual(expect.any(String));
    }, 10000);
  });
});
