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

import env from "~@meetings/server/env";

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
