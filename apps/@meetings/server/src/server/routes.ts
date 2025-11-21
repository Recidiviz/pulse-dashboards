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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { captureException } from "@sentry/node";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import {
  PostMeetingProcessingStatus,
  StateCode,
} from "~@meetings/prisma/client";
import env from "~@meetings/server/env";
import {
  getStepFromMeetingStatus,
  getStepFromUserSetStep,
  handleTranscriptions,
  queueTranscriptionTask,
} from "~@meetings/server/server/utils";
import { cleanupOfflineFiles, stitchAudio } from "~@meetings/tasks";
import { queueStitchingTask } from "~@meetings/trpc/routes/meeting/utils";

class AuthError extends Error {
  errorCode: number;

  constructor(message: string, errorCode: number) {
    super(message);
    this.name = "AuthError";
    this.errorCode = errorCode;
  }
}

async function verifyGoogleIdToken(authorizationHeaders: string | undefined) {
  const idToken = authorizationHeaders?.split(" ")[1];

  if (!idToken) {
    throw new AuthError("No bearer token was provided", 401);
  }

  const oAuth2Client = new OAuth2Client();

  const result = await oAuth2Client.verifyIdToken({
    idToken,
  });

  const payload = result.getPayload();

  // Optionally, if "includeEmail" was set in the token options, check if the
  // email was verified
  if (!payload || !payload.email_verified || !payload.email) {
    throw new AuthError("Email not verified", 401);
  }

  if (payload.email !== env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL) {
    throw new AuthError("Invalid email address", 403);
  }

  console.log(`Email verified: ${payload.email}`);
}

async function authenticateInternalRequestPreHandlerFn<
  T extends FastifyRequest,
>(request: T, reply: FastifyReply) {
  if (env.NODE_ENV === "development") {
    // Skip authentication in development mode
    return;
  }

  // Validate that the token in the request is from the expected service account
  try {
    await verifyGoogleIdToken(request.headers.authorization);
  } catch (err) {
    if (err instanceof AuthError) {
      return reply.status(err.errorCode).send(err);
    }

    reply.status(403).send(err);
  }
}

export function registerTaskRoutes(app: FastifyInstance) {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Add content type parser for audio files - don't parse, just flag as handled
  app.addContentTypeParser(
    ["audio/m4a", "audio/x-m4a", "audio/mp4", "audio/*"],
    (req, payload, done) => {
      // Don't parse the body, just indicate we're handling this content type
      // The raw stream will be available via req.raw
      done(null);
    },
  );

  // Upload endpoint for offline mode
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/upload-audio/:meetingId/:filename",
    schema: {
      params: z.object({
        meetingId: z.string(),
        filename: z.string(),
      }),
    },
    handler: async (req, reply) => {
      if (!env.IS_OFFLINE) {
        return reply
          .status(400)
          .send(
            "Uploading to server is only valid when running in offline mode",
          );
      }

      const { meetingId, filename } = req.params;

      try {
        // Create directory if it doesn't exist
        const localStorageDir =
          env.OFFLINE_STORAGE_DIR ?? path.join(os.tmpdir(), "meetings-offline");
        const meetingDir = path.join(localStorageDir, meetingId);

        if (!fs.existsSync(meetingDir)) {
          fs.mkdirSync(meetingDir, { recursive: true });
        }

        const filePath = path.join(meetingDir, filename);

        // Save the uploaded file from the raw request stream
        const fileStream = fs.createWriteStream(filePath);
        await pipeline(req.raw, fileStream);

        console.log(`Saved audio file to ${filePath}`);

        reply.code(200).send("File uploaded successfully");
      } catch (e) {
        console.error("Error uploading file:", e);
        reply.code(500).send("Error uploading file");
      }
    },
  });

  // TODO(#10219): Remove route-level authentication once this is moved to an internal-only service
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/stitch-audio",
    schema: {
      body: z.object({
        stateCode: z.nativeEnum(StateCode),
        meetingId: z.string(),
      }),
    },
    preHandler: [authenticateInternalRequestPreHandlerFn],
    handler: async (req, reply) => {
      const { stateCode, meetingId } = req.body;

      const prisma = getPrismaClientForStateCode(stateCode);

      // Try and find the meeting and fail fast if it doesn't exist
      await prisma.meeting.findUniqueOrThrow({
        where: {
          id: meetingId,
        },
      });

      let finalRecordingGCSPath;
      try {
        const meeting = await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.STITCHING_IN_PROGRESS,
          },
        });

        finalRecordingGCSPath = await stitchAudio(
          meeting.recordingsGCSBucket,
          meeting.recordingsFolderPath,
        );

        // If there is no audio to stitch, mark the meeting as completed and exit early without queuing transcription
        if (!finalRecordingGCSPath) {
          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.COMPLETED,
            },
          });

          return reply
            .code(200)
            .send(
              "No audio files found to stitch; marking meeting as completed.",
            );
        }

        await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            finalRecordingGCSPath,
          },
        });
      } catch (e) {
        await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.STITCHING_ERROR,
          },
        });

        // Rethrow the error so the task fails and can be retried, if we want it to, as well as for sentry logging.
        throw e;
      }

      try {
        await queueTranscriptionTask(stateCode, meetingId, prisma);
      } catch (e) {
        await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.TRANSCRIPTION_ERROR,
          },
        });

        // Capture the exception but don't fail the task, since stitching succeeded
        captureException(e);
        return reply
          .code(200)
          .send(
            "Audio stitching completed successfully; queuing transcription failed.",
          );
      }



      reply.code(200).send("Audio stitching completed successfully");
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/transcribe-audio",
    schema: {
      body: z.object({
        stateCode: z.nativeEnum(StateCode),
        meetingId: z.string(),
      }),
    },
    preHandler: [authenticateInternalRequestPreHandlerFn],
    handler: async (req, reply) => {
      const { stateCode, meetingId } = req.body;

      const prisma = getPrismaClientForStateCode(stateCode);

      // Try and find the meeting and fail fast if it doesn't exist
      await prisma.meeting.findUniqueOrThrow({
        where: {
          id: meetingId,
        },
      });

      try {
        const meeting = await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.TRANSCRIPTION_IN_PROGRESS,
          },
        });

        if (!meeting.finalRecordingGCSPath) {
          throw new Error("Final recording GCS path is not set for meeting");
        }

        const transcriptions = await handleTranscriptions({
          meetingId,
          recordingsGCSBucket: meeting.recordingsGCSBucket,
          finalRecordingGCSPath: meeting.finalRecordingGCSPath,
        });

        await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
            transcriptions: {
              create: transcriptions,
            },
          },
        });

        // Clean up offline files after successful transcription
        await cleanupOfflineFiles(meetingId);
      } catch (e) {
        await prisma.meeting.update({
          where: {
            id: meetingId,
          },
          data: {
            postMeetingProcessingStatus:
              PostMeetingProcessingStatus.TRANSCRIPTION_ERROR,
          },
        });

        // Rethrow the error so the task fails and can be retried, if we want it to, as well as for sentry logging.
        throw e;
      }

      reply.code(200).send("Transcription completed successfully");
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/reprocess-meeting",
    schema: {
      body: z.object({
        stateCode: z.nativeEnum(StateCode),
        meetingId: z.string(),
        step: z.enum(["stitching", "transcription"]).optional(),
      }),
    },
    preHandler: [authenticateInternalRequestPreHandlerFn],
    handler: async (req, reply) => {
      const { stateCode, meetingId, step } = req.body;

      const prisma = getPrismaClientForStateCode(stateCode);

      // Try and find the meeting and fail fast if it doesn't exist
      const meeting = await prisma.meeting.findUniqueOrThrow({
        where: {
          id: meetingId,
        },
      });

      const stepToProcess =
        getStepFromUserSetStep(step) ??
        getStepFromMeetingStatus(meeting.postMeetingProcessingStatus);

      if (!stepToProcess) {
        return reply
          .code(200)
          .send(
            "Nothing to queue - meeting is being actively processed or is completed.",
          );
      } else if (stepToProcess === "STITCHING") {
        try {
          await queueStitchingTask(stateCode, meetingId, prisma);
        } catch (e) {
          // Don't throw the error because we want to update the status
          captureException(e);

          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.STITCHING_ERROR,
            },
          });

          return reply.code(200).send("Audio stitching task queueing failed.");
        }

        return reply
          .code(200)
          .send("Audio stitching task queued successfully.");
      } else if (stepToProcess === "TRANSCRIPTION") {
        try {
          await queueTranscriptionTask(stateCode, meetingId, prisma);
        } catch (e) {
          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.TRANSCRIPTION_ERROR,
            },
          });

          // Capture the exception but don't fail the task, since stitching succeeded
          captureException(e);
          return reply
            .code(200)
            .send(
              "Audio stitching completed successfully; queuing transcription failed.",
            );
        }

        return reply.code(200).send("Transcription task queued successfully.");
      }
    },
  });
}
