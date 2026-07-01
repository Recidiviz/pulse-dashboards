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

import { SyncPrerecordedResponse } from "@deepgram/sdk";
import { CloudTasksClient, protos } from "@google-cloud/tasks";
import { captureException } from "@sentry/node";

import { AGENCY_CONFIGS } from "~@meetings/config/loader";
import {
  PostMeetingProcessingStatus,
  PrismaClient,
  TranscriptionProvider,
} from "~@meetings/prisma/client";
import env from "~@meetings/server/env";
import {
  transcribeAudioWithAssemblyAI,
  transcribeAudioWithDeepgram,
} from "~@meetings/tasks";
import { ProductionPipeline, TranscriptInput } from "~@meetings/tasks/llm";
import { utterancesToRawText } from "~@meetings/tasks/llm/utils";

export function queueTranscriptionTaskLocal(
  stateCode: string,
  meetingId: string,
) {
  // Don't await the fetch to avoid blocking
  fetch(env.TRANSCRIPTION_TASK_REQUEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stateCode, meetingId }),
  });
}

export async function queueTranscriptionTaskCloud(
  stateCode: string,
  meetingId: string,
) {
  const cloudTaskClient = new CloudTasksClient();

  const parent = cloudTaskClient.queuePath(
    env.CLOUD_TASKS_PROJECT,
    env.CLOUD_TASKS_LOCATION,
    env.TRANSCRIPTION_TASK_QUEUE_NAME,
  );

  const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
    parent,
    task: {
      httpRequest: {
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify({ stateCode, meetingId })),
        httpMethod: "POST",
        url: env.TRANSCRIPTION_TASK_REQUEST_URL,
        oidcToken: {
          serviceAccountEmail: env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL,
        },
      },
    },
  };

  await cloudTaskClient.createTask(request);
}

export async function queueTranscriptionTask(
  stateCode: string,
  meetingId: string,
  prisma: PrismaClient,
) {
  // Go ahead and set the status to stitching queued so we don't accidentally overwrite it from the other process

  await prisma.meeting.update({
    where: {
      id: meetingId,
    },
    data: {
      postMeetingProcessingStatus:
        PostMeetingProcessingStatus.TRANSCRIPTION_QUEUED,
    },
  });

  // If we're on a local environment, there is no way to emulate Cloud Tasks, so we just call endpoint directly
  if (env.NODE_ENV === "development") {
    // Don't await to avoid blocking
    queueTranscriptionTaskLocal(stateCode, meetingId);
  } else {
    await queueTranscriptionTaskCloud(stateCode, meetingId);
  }
}

type DeepgramUtterance = NonNullable<
  SyncPrerecordedResponse["results"]["utterances"]
>[number];

type DeepgramWord = NonNullable<DeepgramUtterance["words"]>[number];

type CleanedUtterance = {
  text: string;
  speaker: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence: number;
};

// Deepgram's utterance-level `speaker` is pinned to a single value, but
// `words[]` within an utterance can cross speakers — so we split the utterance
// at speaker boundaries while preserving the utterance boundary (a natural
// pause in the conversation) when there's only one speaker.
function splitDeepgramUtteranceBySpeaker(
  utterance: DeepgramUtterance,
): CleanedUtterance[] {
  const groups: DeepgramWord[][] = [];
  for (const word of utterance.words ?? []) {
    const currentGroup = groups.at(-1);
    if (currentGroup && currentGroup[0].speaker === word.speaker) {
      currentGroup.push(word);
    } else {
      groups.push([word]);
    }
  }

  // No speaker transitions in this utterance — keep the utterance intact so we
  // preserve the original transcript text (spacing, punctuation, casing).
  if (groups.length <= 1) {
    return [
      {
        text: utterance.transcript,
        speaker: utterance.speaker?.toString() ?? "unknown",
        startTimeMs: utterance.start * 1000,
        endTimeMs: utterance.end * 1000,
        confidence: utterance.confidence,
      },
    ];
  }

  return groups.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const avgConfidence =
      group.reduce((sum, w) => sum + w.confidence, 0) / group.length;
    return {
      text: group.map((w) => w.punctuated_word ?? w.word).join(" "),
      speaker: first.speaker?.toString() ?? "unknown",
      startTimeMs: first.start * 1000,
      endTimeMs: last.end * 1000,
      confidence: Math.round(avgConfidence * 10000) / 10000,
    };
  });
}

type HandleTranscriptionParams = {
  meetingId: string;
  recordingsGCSBucket: string;
  finalRecordingGCSPath: string;
  keywords?: string[];
};

export async function handleTranscriptions(params: HandleTranscriptionParams) {
  const {
    meetingId,
    recordingsGCSBucket,
    finalRecordingGCSPath,
    keywords = [],
  } = params;

  const [assemblyAIResult, deepgramResult] = await Promise.allSettled([
    transcribeAudioWithAssemblyAI(
      recordingsGCSBucket,
      finalRecordingGCSPath,
      env.ASSEMBLYAI_API_KEY,
      keywords,
    ),
    transcribeAudioWithDeepgram(
      recordingsGCSBucket,
      finalRecordingGCSPath,
      env.DEEPGRAM_API_KEY,
      keywords,
    ),
  ]);

  if (
    assemblyAIResult.status === "rejected" &&
    deepgramResult.status === "rejected"
  ) {
    throw new Error(`Both AssemblyAI and Deepgram transcriptions failed with these errors:
            AssemblyAI: ${assemblyAIResult.reason}
            Deepgram: ${deepgramResult.reason}`);
  }

  const transcriptions = [];
  if (assemblyAIResult.status === "fulfilled") {
    const assemblyAiTransriptionResult = assemblyAIResult.value;
    const cleanedAssemblyAIUtterances = (
      assemblyAiTransriptionResult.utterances ?? []
    ).map((utterance) => ({
      text: utterance.text,
      speaker: utterance.speaker ?? "unknown",
      startTimeMs: utterance.start,
      endTimeMs: utterance.end,
      confidence: utterance.confidence,
    }));

    transcriptions.push({
      provider: TranscriptionProvider.ASSEMBLYAI,
      transcriptObject:
        assemblyAiTransriptionResult as PrismaJson.TranscriptType,
      confidence: assemblyAiTransriptionResult.confidence,
      summary: assemblyAiTransriptionResult.summary,
      utterances: {
        createMany: {
          data: cleanedAssemblyAIUtterances,
        },
      },
    });
  } else {
    captureException("AssemblyAI transcription failed", {
      extra: { error: assemblyAIResult.reason, meetingId },
    });
  }

  if (deepgramResult.status === "fulfilled") {
    const deepgramTranscriptionResult = deepgramResult.value;
    const cleanedDeepgramUtterances = (
      deepgramTranscriptionResult.results.utterances ?? []
    ).flatMap(splitDeepgramUtteranceBySpeaker);

    transcriptions.push({
      provider: TranscriptionProvider.DEEPGRAM,
      transcriptObject:
        deepgramTranscriptionResult as PrismaJson.TranscriptType,
      confidence:
        deepgramTranscriptionResult.results.channels[0]?.alternatives[0]
          ?.confidence ?? 0,
      summary: deepgramTranscriptionResult.results.summary?.result,
      utterances: {
        createMany: {
          data: cleanedDeepgramUtterances,
        },
      },
    });
  } else {
    captureException("Deepgram transcription failed", {
      extra: { error: deepgramResult.reason, meetingId },
    });
  }

  return transcriptions;
}

export async function queueNotetakingTaskLocal(
  stateCode: string,
  meetingId: string,
) {
  // Don't await the fetch to avoid blocking
  fetch(env.NOTETAKING_TASK_REQUEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stateCode, meetingId }),
  });
}

export async function queueNotetakingTaskCloud(
  stateCode: string,
  meetingId: string,
) {
  const cloudTaskClient = new CloudTasksClient();

  const parent = cloudTaskClient.queuePath(
    env.CLOUD_TASKS_PROJECT,
    env.CLOUD_TASKS_LOCATION,
    env.NOTETAKING_TASK_QUEUE_NAME,
  );

  const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
    parent,
    task: {
      httpRequest: {
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify({ stateCode, meetingId })),
        httpMethod: "POST",
        url: env.NOTETAKING_TASK_REQUEST_URL,
        oidcToken: {
          serviceAccountEmail: env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL,
        },
      },
    },
  };

  await cloudTaskClient.createTask(request);
}

export async function queueNotetakingTask(
  stateCode: string,
  meetingId: string,
  prisma: PrismaClient,
) {
  // Set the status to extraction queued
  await prisma.meeting.update({
    where: {
      id: meetingId,
    },
    data: {
      postMeetingProcessingStatus:
        PostMeetingProcessingStatus.NOTETAKING_QUEUED,
    },
  });

  // If we're on a local environment, there is no way to emulate Cloud Tasks, so we just call endpoint directly
  if (env.NODE_ENV === "development") {
    // Don't await to avoid blocking
    queueNotetakingTaskLocal(stateCode, meetingId);
  } else {
    await queueNotetakingTaskCloud(stateCode, meetingId);
  }
}

export async function queueLlmajEvaluationTaskLocal(
  stateCode: string,
  meetingId: string,
) {
  // Don't await the fetch to avoid blocking
  fetch(env.LLMAJ_TASK_REQUEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stateCode, meetingId }),
  });
}

export async function queueLlmajEvaluationTaskCloud(
  stateCode: string,
  meetingId: string,
) {
  const cloudTaskClient = new CloudTasksClient();

  const parent = cloudTaskClient.queuePath(
    env.CLOUD_TASKS_PROJECT,
    env.CLOUD_TASKS_LOCATION,
    env.LLMAJ_TASK_QUEUE_NAME,
  );

  const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
    parent,
    task: {
      httpRequest: {
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify({ stateCode, meetingId })),
        httpMethod: "POST",
        url: env.LLMAJ_TASK_REQUEST_URL,
        oidcToken: {
          serviceAccountEmail: env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL,
        },
      },
    },
  };

  await cloudTaskClient.createTask(request);
}

export async function queueLlmajEvaluationTask(
  stateCode: string,
  meetingId: string,
) {
  if (env.NODE_ENV === "development") {
    // Don't await to avoid blocking
    queueLlmajEvaluationTaskLocal(stateCode, meetingId);
  } else {
    await queueLlmajEvaluationTaskCloud(stateCode, meetingId);
  }
}

type HandleLLMProcessingParams = {
  meetingId: string;
  prisma: PrismaClient;
};

export async function handleNotetakingProcessing(
  params: HandleLLMProcessingParams,
) {
  const { meetingId, prisma } = params;

  // Fetch meeting with client/resident data and transcriptions
  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    include: {
      client: true,
      resident: true,
      transcriptions: {
        include: {
          utterances: {
            orderBy: {
              startTimeMs: "asc",
            },
          },
        },
        orderBy: {
          confidence: "desc",
        },
      },
    },
  });

  if (meeting.transcriptions.length === 0) {
    throw new Error("No transcriptions available for LLM processing");
  }

  // Use the best transcription (ordered by confidence)
  const bestTranscription = meeting.transcriptions[0];

  // Build transcript input from utterances
  const rawText = utterancesToRawText(bestTranscription.utterances);

  const transcriptInput: TranscriptInput = {
    rawText: rawText,
    recordingDate: meeting.startTime.toISOString().split("T")[0],
    durationSeconds: meeting.endTime
      ? Math.floor(
          (meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000,
        )
      : 0,
    poNotes: meeting.userNotepadNotes || "",
    meetingType: meeting.meetingType ?? undefined,
  };

  const meetingPerson = meeting.client ?? meeting.resident;

  if (!meetingPerson) {
    throw new Error(
      "Meeting must have an associated client or resident for LLM processing",
    );
  }

  if (meeting.client && meeting.resident) {
    throw new Error(
      "Meeting cannot have both an associated client and an associated resident",
    );
  }

  const agencyConfig = AGENCY_CONFIGS[meetingPerson.stateCode];
  if (!agencyConfig) {
    throw new Error(
      `No agency config found for state code: ${meetingPerson.stateCode}`,
    );
  }

  // Run the LLM pipeline
  const pipeline = new ProductionPipeline(prisma);
  const result = await pipeline.run(
    agencyConfig,
    meetingPerson,
    transcriptInput,
    meetingId,
  );

  // Return the full result with metadata
  return {
    output: result,
    agencyConfig,
    transcriptInput,
  };
}

export function getStepFromUserSetStep(step?: string) {
  switch (step) {
    case "stitching":
      return "STITCHING";
    case "transcription":
      return "TRANSCRIPTION";
    case "notetaking":
      return "NOTETAKING";
    default:
      return undefined;
  }
}

export function getStepFromMeetingStatus(status: PostMeetingProcessingStatus) {
  switch (status) {
    case PostMeetingProcessingStatus.NOT_STARTED:
    case PostMeetingProcessingStatus.STITCHING_ERROR:
      return "STITCHING";
    case PostMeetingProcessingStatus.TRANSCRIPTION_ERROR:
      return "TRANSCRIPTION";
    case PostMeetingProcessingStatus.NOTETAKING_ERROR:
      return "NOTETAKING";
    default:
      return undefined;
  }
}
