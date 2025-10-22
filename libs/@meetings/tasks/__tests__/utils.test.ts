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
import { describe, expect, test } from "vitest";

import { GCS_API_ENDPOINT } from "~@meetings/tasks/test/setup";
import {
  getSignedUrlForNewRecording,
  stitchAudio,
} from "~@meetings/tasks/utils";

const AUDIO_RECORDINGS_BUCKET_NAME = "test-audio-recordings";

describe("utils", () => {
  describe("getSignedUrlForNewRecording", () => {
    beforeAll(() => {
      // // tell vitest we use mocked time
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-19"));
    });

    afterAll(() => {
      // restoring date after the tests are complete
      vi.useRealTimers();
    });

    test("Should return url for new recording", async () => {
      const url = await getSignedUrlForNewRecording(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "signed-url-test-folder",
      );

      // 1760832000 = seconds since epoch for Oct 19, 2025
      expect(url).toEqual(
        `${GCS_API_ENDPOINT}/test-audio-recordings/signed-url-test-folder/1760832000.m4a`,
      );
    });
  });

  describe("stitchAudio", () => {
    beforeAll(async () => {
      const folderName = "stitch-audio-test-folder";

      const storage = new Storage({
        apiEndpoint: GCS_API_ENDPOINT,
        projectId: "test",
      });

      await storage.createBucket(AUDIO_RECORDINGS_BUCKET_NAME);

      console.log(process.cwd());

      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/1.m4a", {
          destination: `${folderName}/1.m4a`,
          resumable: false,
        });
      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/2.m4a", {
          destination: `${folderName}/2.m4a`,
          resumable: false,
        });
      await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .upload("__tests__/data/3.m4a", {
          destination: `${folderName}/3.m4a`,
          resumable: false,
        });
    });

    test("Should throw error if there are no recordings", async () => {
      await expect(
        stitchAudio(AUDIO_RECORDINGS_BUCKET_NAME, "non-existent-folder"),
      ).rejects.toThrow("No audio files found to stitch");
    });

    test("Should stitch audio if meeting exists", async () => {
      await stitchAudio(
        AUDIO_RECORDINGS_BUCKET_NAME,
        "stitch-audio-test-folder",
      );

      const storage = new Storage({
        apiEndpoint: GCS_API_ENDPOINT,
        projectId: "test",
      });

      const [files] = await storage
        .bucket(AUDIO_RECORDINGS_BUCKET_NAME)
        .getFiles({ prefix: `stitch-audio-test-folder/` });
      expect(files.map((f) => f.name)).toEqual(
        expect.arrayContaining([`stitch-audio-test-folder/final.m4a`]),
      );
    });
  });
});
