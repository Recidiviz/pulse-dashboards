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

import { Storage } from "@google-cloud/storage";
import { TRPCError } from "@trpc/server";

import { auth0Procedure, router } from "~@meetings/trpc/init";
import { getSignedUrlForRecordingInputSchema } from "~@meetings/trpc/routes/meeting/meeting.schema";

const AUDIO_RECORDING_BUCKET_NAME = process.env["AUDIO_RECORDINGS_BUCKET_NAME"];
if (!AUDIO_RECORDING_BUCKET_NAME) {
  throw new Error("AUDIO_RECORDINGS_BUCKET_NAME environment variable not set");
}

const CONTENT_TYPE = "audio/m4a";

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
            message: "Meeting not found",
          });
        }

        // Make the file name the time since epoch so that we know the order of the recordings for a meeting
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        const fileName = `${meetingId}/${secondsSinceEpoch}.m4a`;

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
});
