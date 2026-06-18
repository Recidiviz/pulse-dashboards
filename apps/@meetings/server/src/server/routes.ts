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

import { captureException, withScope } from "@sentry/node";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { run_v2 } from "googleapis";
import { z } from "zod";

import { AUDIO_FORMATS } from "~@meetings/config";
import { AGENCY_CONFIGS } from "~@meetings/config/configs";
import { getPrismaClientForStateCode } from "~@meetings/prisma";
import {
  PostMeetingProcessingStatus,
  StateCode,
} from "~@meetings/prisma/client";
import env from "~@meetings/server/env";
import {
  getStepFromMeetingStatus,
  getStepFromUserSetStep,
  handleNotetakingProcessing,
  handleTranscriptions,
  queueLlmajEvaluationTask,
  queueNotetakingTask,
  queueTranscriptionTask,
} from "~@meetings/server/server/utils";
import {
  ActionItem,
  cleanupLocalFiles,
  CriticalUpdate,
  exportLabelStudioTask,
  labelStudioMeetingInclude,
  stitchAudio,
} from "~@meetings/tasks";
import {
  createEvaluatorClients,
  EVALUATOR_VERSION,
  runAllEvaluators,
} from "~@meetings/tasks/llm/evaluators";
import {
  DraftingOutputSchema,
  VerificationOutputSchema,
} from "~@meetings/tasks/llm/schemas";
import { formatTranscripts } from "~@meetings/tasks/llm/utils";
import { getPersonNameTokens } from "~@meetings/trpc/routes/meeting.helpers";
import { queueStitchingTask } from "~@meetings/trpc/routes/meeting/utils";
import {
  postMeetingCompletedNotification,
  postMeetingErrorNotification,
} from "~@meetings/trpc/services/slack";

/**
 * Convert ActionItem objects to simple task strings
 */
function formatActionItems(actionItems: ActionItem[]): string[] {
  return actionItems.map((item) => item.task);
}

/**
 * Convert CriticalUpdate objects to formatted strings
 */
function formatCriticalUpdates(criticalUpdates: CriticalUpdate[]): string[] {
  return criticalUpdates.map(
    (item) => `${item.category} - ${item.updateType}: ${item.details}`,
  );
}

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

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const runClient = new run_v2.Run({ auth });
  // technically the cloud tasks project/location could be different from the cloud run one,
  // but in practice they are the same so we can reuse the env vars
  const resource = `projects/${env.CLOUD_TASKS_PROJECT}/locations/${env.CLOUD_TASKS_LOCATION}/services/${process.env["K_SERVICE"]}`;
  const runInvokerPermission = "run.routes.invoke";
  const iamResponse =
    await runClient.projects.locations.services.testIamPermissions({
      resource,
      requestBody: {
        permissions: [runInvokerPermission],
      },
    });

  if (!iamResponse.data.permissions?.includes(runInvokerPermission)) {
    throw new AuthError(
      "Caller does not have Cloud Run invoker permission",
      403,
    );
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

  app.get("/health", async (_req, reply) => {
    return reply.status(200).send({ status: "ok" });
  });

  // Add content type parser for audio files - don't parse, just flag as handled
  app.addContentTypeParser(
    Object.values(AUDIO_FORMATS).flatMap((f) => f.acceptedMimeTypes),
    (req, payload, done) => {
      // Don't parse the body, just indicate we're handling this content type
      // The raw stream will be available via req.raw
      done(null);
    },
  );

  // Upload endpoint for local mode
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
      if (!env.IS_LOCAL_MODE) {
        return reply
          .status(400)
          .send("Uploading to server is only valid when running in local mode");
      }

      const { meetingId, filename } = req.params;

      try {
        // Create directory if it doesn't exist
        const localStorageDir =
          env.LOCAL_STORAGE_DIR ?? path.join(os.tmpdir(), "meetings-local");
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

  // Serve audio files from local storage in local mode
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/stream-audio/:meetingId/:filename",
    schema: {
      params: z.object({
        meetingId: z.string(),
        filename: z.string(),
      }),
    },
    handler: async (req, reply) => {
      if (!env.IS_LOCAL_MODE) {
        return reply.status(400).send("Only available in local mode");
      }

      const { meetingId, filename } = req.params;
      const localStorageDir =
        env.LOCAL_STORAGE_DIR ?? path.join(os.tmpdir(), "meetings-local");
      const fullPath = path.join(localStorageDir, meetingId, filename);

      if (!fs.existsSync(fullPath)) {
        return reply.status(404).send("Audio file not found");
      }

      const ext = path.extname(fullPath).slice(1);
      const format = AUDIO_FORMATS[ext as keyof typeof AUDIO_FORMATS];
      const contentType = format?.contentType ?? "application/octet-stream";

      const { size } = fs.statSync(fullPath);
      const rangeHeader = req.headers.range;

      // Safari requires byte-range support to play audio — it uses Range requests
      // to read metadata and to seek. Without honoring the range, it refuses to play.
      if (rangeHeader) {
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : size - 1;
        return reply
          .status(206)
          .header("Content-Type", contentType)
          .header("Content-Range", `bytes ${start}-${end}/${size}`)
          .header("Accept-Ranges", "bytes")
          .header("Content-Length", end - start + 1)
          .send(fs.createReadStream(fullPath, { start, end }));
      }

      return reply
        .header("Content-Type", contentType)
        .header("Accept-Ranges", "bytes")
        .header("Content-Length", size)
        .send(fs.createReadStream(fullPath));
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

      return withScope(async (scope) => {
        scope.setTag("meetingId", meetingId);

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
                PostMeetingProcessingStatus.STITCHING_IN_PROGRESS,
            },
          });

          const stitchResult = await stitchAudio(
            meeting.recordingsGCSBucket,
            meeting.recordingsFolderPath,
          );

          // If there is no audio to stitch, mark the meeting as completed and exit early without queuing transcription
          if (!stitchResult) {
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
              finalRecordingGCSPath: stitchResult.outputFileName,
              durationMs: stitchResult.durationMs,
              ...(!meeting.endTime && {
                endTime: new Date(
                  meeting.startTime.getTime() + stitchResult.durationMs,
                ),
              }),
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

          postMeetingErrorNotification({
            meetingId,
            stateCode,
            errorStep: "stitching",
          }).catch((err) => {
            captureException(err);
            console.error("Failed to post Slack error notification", err);
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

        return reply.code(200).send("Audio stitching completed successfully");
      });
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

      return withScope(async (scope) => {
        scope.setTag("meetingId", meetingId);

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
            include: { client: true, resident: true },
          });

          if (!meeting.finalRecordingGCSPath) {
            throw new Error("Final recording GCS path is not set for meeting");
          }

          const agencyKeywords = AGENCY_CONFIGS[stateCode]?.keywords ?? [];

          const person = meeting.client ?? meeting.resident;
          const personNameTokens = person ? getPersonNameTokens(person) : [];

          // TODO - AVild: Logged in staff member's name included in list of tokens

          const keywords = [...agencyKeywords, ...personNameTokens];

          const transcriptions = await handleTranscriptions({
            meetingId,
            recordingsGCSBucket: meeting.recordingsGCSBucket,
            finalRecordingGCSPath: meeting.finalRecordingGCSPath,
            keywords,
          });

          // Upsert each transcription to handle retries in the case we got here
          // via the reprocess-meeting script.
          // Utterances must be handled explicitly here (rather than nested in the
          // meeting update) because prisma.transcription.upsert operates on the
          // Transcription model directly, so relation fields like `utterances`
          // must be passed as explicit relation operations.
          await Promise.all(
            transcriptions.map(({ utterances, ...transcription }) =>
              prisma.transcription.upsert({
                where: {
                  provider_meetingId: {
                    provider: transcription.provider,
                    meetingId,
                  },
                },
                create: {
                  ...transcription,
                  meetingId,
                  utterances,
                },
                update: {
                  ...transcription,
                  utterances: {
                    deleteMany: {}, // delete all utterances for this transcription (scoped by foreign key)
                    createMany: utterances.createMany,
                  },
                },
              }),
            ),
          );

          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOTETAKING_QUEUED,
            },
          });

          // Queue LLM processing task
          try {
            await queueNotetakingTask(stateCode, meetingId, prisma);
          } catch (e) {
            // Capture the exception but don't fail the task, since transcription succeeded
            captureException(e);
            return reply
              .code(200)
              .send(
                "Transcription completed successfully; queuing LLM processing failed.",
              );
          }

          // Clean up local files after successful transcription
          await cleanupLocalFiles(meetingId);
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

          postMeetingErrorNotification({
            meetingId,
            stateCode,
            errorStep: "transcription",
          }).catch((err) => {
            captureException(err);
            console.error("Failed to post Slack error notification", err);
          });

          // Rethrow the error so the task fails and can be retried, if we want it to, as well as for sentry logging.
          throw e;
        }

        return reply.code(200).send("Transcription completed successfully");
      });
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/process-notetaking",
    schema: {
      body: z.object({
        stateCode: z.nativeEnum(StateCode),
        meetingId: z.string(),
      }),
    },
    preHandler: [authenticateInternalRequestPreHandlerFn],
    handler: async (req, reply) => {
      const { stateCode, meetingId } = req.body;

      return withScope(async (scope) => {
        scope.setTag("meetingId", meetingId);

        const prisma = getPrismaClientForStateCode(stateCode);

        // Try and find the meeting and fail fast if it doesn't exist
        await prisma.meeting.findUniqueOrThrow({
          where: {
            id: meetingId,
          },
        });

        let completedMeeting;
        try {
          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOTETAKING_IN_PROGRESS,
            },
          });

          // Run the LLM processing pipeline
          const result = await handleNotetakingProcessing({
            meetingId,
            prisma,
          });

          // Transform action items and critical updates to simple string arrays
          const actionItems = formatActionItems(result.output.actionItems);
          const criticalUpdates = formatCriticalUpdates(
            result.output.statusUpdates,
          );
          const structuredActionItems = result.output.actionItems.map(
            (item) => ({
              task: item.task,
              assignee: item.assignee,
              deadline: item.deadline ?? null,
              context: item.context ?? null,
              evidenceQuotes: item.evidenceQuotes ?? null,
            }),
          );

          // Always persist staff feedback (it's bundled into the writer agent's
          // single LLM call). The API layer decides whether to surface it based
          // on the agency's staffFeedbackEnabled flag — storing it
          // unconditionally lets us backfill existing meetings if a state is
          // enabled later.

          completedMeeting = await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              caseNote: result.output.caseNote,
              actionItems: actionItems, // TODO OBT-31909: Remove this
              structuredActionItems,
              criticalUpdates: criticalUpdates,
              meetingSummary: result.output.meetingMinutes,
              staffFeedback: result.output.staffFeedback,
              staffFeedbackGeneratedAt: new Date(),
              // Tags this feedback content to the pipeline run that produced it,
              // so prior FeedbackVote rows are invalidated on reprocess (when
              // the pipeline run id advances).
              staffFeedbackPipelineRunId: result.output.pipelineRunId,
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.COMPLETED,
              meetingActionItems: {
                createMany: {
                  data: result.output.actionItems.map((item) => ({
                    assignee: item.assignee,
                    generatedTask: item.task,
                    evidenceQuotes: item.evidenceQuotes ?? [],
                    completed: false,
                    deleted: false,
                    pipelineRunId: result.output.pipelineRunId,
                  })),
                },
              },
            },
            select: {
              staffEmail: true,
              client: { select: { pseudonymizedId: true } },
              resident: { select: { pseudonymizedId: true } },
            },
          });
        } catch (e) {
          // Set error status at the current stage
          await prisma.meeting.update({
            where: {
              id: meetingId,
            },
            data: {
              postMeetingProcessingStatus:
                PostMeetingProcessingStatus.NOTETAKING_ERROR,
            },
          });

          postMeetingErrorNotification({
            meetingId,
            stateCode,
            errorStep: "notetaking",
          }).catch((err) => {
            captureException(err);
            console.error("Failed to post Slack error notification", err);
          });

          // Rethrow the error so the task fails and can be retried
          throw e;
        }

        // Post-completion side effects — these run after the meeting is already
        // marked COMPLETED, so failures here must not revert the status.
        const personPseudoId =
          completedMeeting.client?.pseudonymizedId ??
          completedMeeting.resident?.pseudonymizedId ??
          meetingId;

        postMeetingCompletedNotification({
          staffEmail: completedMeeting.staffEmail,
          stateCode,
          personPseudoId,
          meetingId,
        }).catch((e) => {
          captureException(e);
          console.error(
            "Failed to post meeting completed Slack notification",
            e,
          );
        });

        queueLlmajEvaluationTask(stateCode, meetingId).catch((e) => {
          captureException(e);
          console.error("Failed to queue LLMAJ evaluation task", e);
        });

        return reply
          .code(200)
          .send("Notetaking process completed successfully");
      });
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/run-llmaj-evaluation",
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

      const pipelineRun = await prisma.notetakingPipelineRun.findFirst({
        where: { meetingId, status: "SUCCESS" },
        include: {
          agentExecutions: {
            where: { agentType: { in: ["DRAFTING", "VERIFICATION"] } },
            orderBy: { attemptNumber: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!pipelineRun) {
        return reply
          .code(200)
          .send("No successful pipeline run found for meeting; skipping.");
      }

      const alreadyEvaluated = await prisma.notetakingEvaluationRun.findFirst({
        where: {
          pipelineRunId: pipelineRun.id,
          evaluatorVersion: EVALUATOR_VERSION,
        },
      });

      if (alreadyEvaluated) {
        return reply
          .code(200)
          .send("Pipeline run already evaluated at current version; skipping.");
      }

      const draftingExecution = pipelineRun.agentExecutions
        .filter((e) => e.agentType === "DRAFTING")
        .find((e) => DraftingOutputSchema.safeParse(e.outputData).success);
      const draftingOutput = draftingExecution
        ? DraftingOutputSchema.parse(draftingExecution.outputData)
        : null;

      const verificationExecution = pipelineRun.agentExecutions.find(
        (e) => e.agentType === "VERIFICATION",
      );
      const verificationParsed = verificationExecution
        ? VerificationOutputSchema.safeParse(verificationExecution.outputData)
        : null;
      const verificationOutput = verificationParsed?.success
        ? verificationParsed.data
        : null;

      if (!draftingOutput || !verificationOutput) {
        return reply
          .code(200)
          .send(
            "Missing drafting or verification output for pipeline run; skipping.",
          );
      }

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          transcriptions: {
            include: { utterances: { orderBy: { startTimeMs: "asc" } } },
            orderBy: { confidence: "desc" },
          },
          client: { select: { givenNames: true, surname: true } },
          resident: { select: { givenNames: true, surname: true } },
        },
      });

      if (
        !meeting ||
        !meeting.finalRecordingGCSPath ||
        meeting.transcriptions.length === 0
      ) {
        return reply
          .code(200)
          .send("Missing audio or transcripts for meeting; skipping.");
      }

      const { byProvider: transcriptsByProvider, best: bestTranscript } =
        formatTranscripts(meeting.transcriptions);

      const person = meeting.client ?? meeting.resident;
      const inputs = {
        audioBucket: meeting.recordingsGCSBucket,
        audioPath: meeting.finalRecordingGCSPath,
        transcriptsByProvider,
        bestTranscript,
        caseNote: draftingOutput.caseNote,
        actionItems: verificationOutput.actionItems,
        criticalUpdates: verificationOutput.criticalUpdates,
        meetingContext: {
          personName: person
            ? [person.givenNames, person.surname].filter(Boolean).join(" ")
            : undefined,
          staffEmail: meeting.staffEmail,
          staffNotes: meeting.userNotepadNotes ?? undefined,
        },
      };

      const evaluatorClients = createEvaluatorClients();
      const { scores, langsmithTraceId } = await runAllEvaluators(
        evaluatorClients,
        inputs,
      );

      await prisma.notetakingEvaluationRun.create({
        data: {
          pipelineRunId: pipelineRun.id,
          evaluatorVersion: EVALUATOR_VERSION,
          scores,
          langsmithTraceId,
        },
      });

      // Export Label Studio task JSON to GCS. Skip US_DEMO in production only —
      // staging US_DEMO meetings should still flow to Label Studio.
      if (stateCode !== StateCode.US_DEMO || env.DEPLOY_ENV !== "production") {
        try {
          const meetingWithRelations = await prisma.meeting.findUniqueOrThrow({
            where: { id: meetingId },
            include: labelStudioMeetingInclude,
          });

          const needsRecidivizReview =
            scores.caseNote?.grade === "BAD" ||
            scores.actionItems?.grade === "BAD" ||
            scores.criticalUpdates?.grade === "BAD" ||
            scores.overall?.grade === "BAD";

          exportLabelStudioTask(
            meetingWithRelations,
            stateCode,
            needsRecidivizReview,
          ).catch((e) => {
            captureException(e);
            console.error("Failed to export Label Studio task to GCS", e);
          });
        } catch (e) {
          captureException(e);
          console.error("Failed to fetch meeting for Label Studio export", e);
        }
      }

      reply.code(200).send("LLMAJ evaluation completed successfully");
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/reprocess-meeting",
    schema: {
      body: z.object({
        stateCode: z.nativeEnum(StateCode),
        meetingId: z.string(),
        step: z.enum(["stitching", "transcription", "notetaking"]).optional(),
        gcsPath: z.string().optional(),
      }),
    },
    preHandler: [authenticateInternalRequestPreHandlerFn],
    handler: async (req, reply) => {
      const { stateCode, meetingId, step, gcsPath } = req.body;

      return withScope(async (scope) => {
        scope.setTag("meetingId", meetingId);

        const prisma = getPrismaClientForStateCode(stateCode);

        // Try and find the meeting and fail fast if it doesn't exist
        let meeting = await prisma.meeting.findUniqueOrThrow({
          where: {
            id: meetingId,
          },
        });

        if (gcsPath) {
          meeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: { finalRecordingGCSPath: gcsPath },
          });
        }

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

            return reply
              .code(200)
              .send("Audio stitching task queueing failed.");
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

          return reply
            .code(200)
            .send("Transcription task queued successfully.");
        } else if (stepToProcess === "NOTETAKING") {
          try {
            await queueNotetakingTask(stateCode, meetingId, prisma);
          } catch (e) {
            // Capture the exception
            captureException(e);
            return reply
              .code(200)
              .send("Notetaking processing task queueing failed.");
          }

          return reply
            .code(200)
            .send("Notetaking processing task queued successfully.");
        }
      });
    },
  });
}
