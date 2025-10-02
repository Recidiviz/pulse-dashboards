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

import fs from "node:fs";
import os from "node:os";

import { Storage } from "@google-cloud/storage";
import { TRPCError } from "@trpc/server";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import { Prisma } from "~@meetings/prisma/client";
import { auth0Procedure, router } from "~@meetings/trpc/init";
import {
  endMeetingInputSchema,
  getSignedUrlForRecordingInputSchema,
} from "~@meetings/trpc/routes/meeting/meeting.schema";

const AUDIO_RECORDING_BUCKET_NAME = process.env["AUDIO_RECORDINGS_BUCKET_NAME"];
if (!AUDIO_RECORDING_BUCKET_NAME) {
  throw new Error("AUDIO_RECORDINGS_BUCKET_NAME environment variable not set");
}

const CONTENT_TYPE = "audio/webm";

if (!ffmpegPath) {
  throw new Error("ffmpeg-static failed to load ffmpeg binary");
}

ffmpeg.setFfmpegPath(ffmpegPath);

export const meetingRouter = router({
  getSignedUrlForRecording: auth0Procedure
    .input(getSignedUrlForRecordingInputSchema)
    .query(
      async ({ input: { clientId, meetingId }, ctx: { prisma, user } }) => {
        const meeting = await prisma.meeting.findUnique({
          where: {
            id: meetingId,
            clientId: clientId,
            staff: {
              pseudonymizedId: user.pseudonymizedId,
            },
          },
        });

        if (!meeting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting with that id was not found",
          });
        }

        // Make the file name the time since epoch so that we know the order of the recordings for a meeting
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        const fileName = `${meetingId}/${secondsSinceEpoch}.webm`;

        // Creates a client
        const storage = new Storage();

        const bucket = storage.bucket(AUDIO_RECORDING_BUCKET_NAME);
        const file = bucket.file(fileName);
        // await file.save("Hello, world!");

        const [url] = await file.getSignedUrl({
          version: "v4",
          action: "write",
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          contentType: CONTENT_TYPE,
        });

        return url;
      },
    ),
  endMeeting: auth0Procedure
    .input(endMeetingInputSchema)
    .mutation(
      async ({ input: { clientId, meetingId }, ctx: { prisma, user } }) => {
        try {
          await prisma.meeting.update({
            where: {
              id: meetingId,
              clientId: clientId,
              staff: {
                pseudonymizedId: user.pseudonymizedId,
              },
            },
            data: {
              endTime: new Date(),
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Meeting with that id was not found",
              cause: e,
            });
          }

          throw e;
        }

        // Creates a client
        const storage = new Storage();
        const bucket = storage.bucket(AUDIO_RECORDING_BUCKET_NAME);

        const [files] = await bucket.getFiles({ prefix: `${meetingId}/` });
        if (files.length === 0) {
          return;
        }

        // Sort files by timestamp to ensure correct order
        files.sort((a, b) => {
          const timeA = parseInt(a.name);
          const timeB = parseInt(b.name);
          return timeA - timeB;
        });

        const tempFilePaths = [];
        const fileListPath = path.join(os.tmpdir(), "filelist.txt");
        let fileListContent = "";

        const downloads = [];
        for (const segmentFile of files) {
          const tempFilePath = path.join(
            os.tmpdir(),
            path.basename(segmentFile.name),
          );

          downloads.push(segmentFile.download({ destination: tempFilePath }));
          tempFilePaths.push(tempFilePath);
          fileListContent += `file '${tempFilePath}'\n`;
        }

        // TODO: handle errors
        await Promise.all(downloads);
        fs.writeFileSync(fileListPath, fileListContent);

        const tempOutputPath = path.join(os.tmpdir(), "final.webm");

        // Use FFmpeg to concatenate the files
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(fileListPath)
            .inputOptions(["-f concat", "-safe 0"])
            .outputOptions("-c copy") // Directly copy the stream without re-encoding
            .save(tempOutputPath)
            .on("end", resolve)
            .on("error", reject);
        });

        // Upload the final stitched file back to the bucket
        const outputFileName = `${meetingId}/final.webm`;
        await bucket.upload(tempOutputPath, {
          destination: outputFileName,
          metadata: { contentType: "audio/webm" },
          resumable: false,
        });
      },
    ),
});
