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

import { CloudTasksClient, protos } from "@google-cloud/tasks";
import { captureException } from "@sentry/node";

import { TranscriptionProvider } from "~@meetings/prisma/client";
import env from "~@meetings/server/env";
import {
  transcribeAudioWithAssemblyAI,
  transcribeAudioWithDeepgram,
} from "~@meetings/tasks";

export async function queueTranscriptionTaskLocal(
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
) {
  // If we're on a local environment, there is no way to emulate Cloud Tasks, so we just call endpoint directly
  if (env.NODE_ENV === "development") {
    // Don't await to avoid blocking
    queueTranscriptionTaskLocal(stateCode, meetingId);
  } else {
    await queueTranscriptionTaskCloud(stateCode, meetingId);
  }
}

type HandleTranscriptionParams = {
  meetingId: string;
  recordingsGCSBucket: string;
  finalRecordingGCSPath: string;
};

export async function handleTranscriptions(params: HandleTranscriptionParams) {
  const { meetingId, recordingsGCSBucket, finalRecordingGCSPath } = params;

  const [assemblyAIResult, deepgramResult] = await Promise.allSettled([
    transcribeAudioWithAssemblyAI(
      recordingsGCSBucket,
      finalRecordingGCSPath,
      env.ASSEMBLYAI_API_KEY,
    ),
    transcribeAudioWithDeepgram(
      recordingsGCSBucket,
      finalRecordingGCSPath,
      env.DEEPGRAM_API_KEY,
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
      transcriptObject: assemblyAiTransriptionResult,
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
    ).map((utterance) => ({
      text: utterance.transcript,
      speaker: utterance.speaker?.toString() ?? "unknown",
      startTimeMs: utterance.start,
      endTimeMs: utterance.end,
      confidence: utterance.confidence,
    }));

    transcriptions.push({
      provider: TranscriptionProvider.DEEPGRAM,
      transcriptObject: deepgramTranscriptionResult,
      confidence:
        deepgramTranscriptionResult.results.channels[0]?.language_confidence ??
        0,
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
