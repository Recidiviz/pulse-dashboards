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

import { CloudTasksClient } from "@google-cloud/tasks";
import Fastify, { FastifyInstance } from "fastify";
import { MockStorage } from "mock-gcs";
import { beforeAll, beforeEach, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { ImportRoutesHandler } from "~fastify-data-import-plugin/index";
export const testEtlHelper = vi.fn();
export const testBucketId = "test-bucket";
export const testFileName = "test-object";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testServer: FastifyInstance;

export const testExceptionHandler = vi.fn();

export let getPayloadImp = vi.fn();

export function setGetPayloadImp(fn: typeof getPayloadImp) {
  getPayloadImp = fn;
}

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => {
    return {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: getPayloadImp,
      }),
    };
  }),
}));

export const mockCloudTasksClient = mock<CloudTasksClient>({
  queuePath: vi.fn((project: string, location: string, queue: string) => {
    // We want to do this so that we can test that the correct arguments are being passed to the queuePath function
    if (
      !(project === "cloud-task-project") ||
      !(location === "cloud-task-location") ||
      !(queue === "cloud-task-queue")
    ) {
      throw new Error("Invalid arguments");
    }

    return "parent";
  }),
  createTask: vi.fn().mockResolvedValue([{ name: "task-name" }]),
});

vi.mock("@google-cloud/tasks", () => ({
  CloudTasksClient: vi.fn().mockImplementation(() => {
    return mockCloudTasksClient;
  }),
}));

export const mockStorageSingleton = new MockStorage();

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => {
    return mockStorageSingleton;
  }),
}));

beforeAll(async () => {
  testServer = Fastify({
    logger: true,
  });

  const routeHandler = new ImportRoutesHandler({
    etlHelperGetter: ({ bucketId, fileName }) => {
      if (fileName === testFileName && bucketId === testBucketId) {
        return testEtlHelper;
      }
      return undefined;
    },
    triggerImportArgs: {
      iamEmail: "test-trigger-import-email@fake.com",
      cloudTaskProject: "cloud-task-project",
      cloudTaskLocation: "cloud-task-location",
      cloudTaskQueueName: "cloud-task-queue",
      cloudTaskUrl: "cloud-task-url",
      cloudTaskServiceAccountEmail: "cloud-task-service-account-email@fake.com",
    },
    handleImportArgs: {
      iamEmail: "test-handle-import-email@fake.com",
    },
    exceptionHandler: testExceptionHandler,
  });

  routeHandler.registerImportRoutes(testServer);

  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}`);
    }
  });
});

beforeEach(() => {
  testExceptionHandler.mockClear();
  testEtlHelper.mockClear();
});
