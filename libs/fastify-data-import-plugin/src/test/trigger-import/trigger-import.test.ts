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

import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  mockCloudTasksClient,
  setGetPayloadImp,
  testBucketId,
  testExceptionHandler,
  testServer,
} from "~fastify-data-import-plugin/test/setup";
import { samplePayloadMessage } from "~fastify-data-import-plugin/test/trigger-import/constants";

beforeEach(() => {
  setGetPayloadImp(
    vi.fn().mockReturnValue({
      email_verified: true,
      email: "test-trigger-import-email@fake.com",
    }),
  );
});

describe("trigger_import", () => {
  test("should log exception and return 200 if there is no token", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(testExceptionHandler).toHaveBeenCalledWith(
      "error verifying auth token: No bearer token was provided",
    );
  });

  test("should log exception and return 200 if there is no token payload", async () => {
    setGetPayloadImp(vi.fn().mockReturnValue(undefined));

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(testExceptionHandler).toHaveBeenCalledWith(
      "error verifying auth token: Email not verified",
    );
  });

  test("should log exception and return 200 if email is not verified", async () => {
    setGetPayloadImp(
      vi.fn().mockReturnValue({
        email_verified: false,
      }),
    );

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(testExceptionHandler).toHaveBeenCalledWith(
      "error verifying auth token: Email not verified",
    );
  });

  test("should log exception and return 200 if there is no email", async () => {
    setGetPayloadImp(
      vi.fn().mockReturnValue({
        email_verified: true,
        email: undefined,
      }),
    );

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(testExceptionHandler).toHaveBeenCalledWith(
      "error verifying auth token: Email not verified",
    );
  });

  test("should log exception and return 200 if email doesn't match expected", async () => {
    setGetPayloadImp(
      vi.fn().mockReturnValue({
        email_verified: true,
        email: "not-the-right-email@fake.com",
      }),
    );

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(testExceptionHandler).toHaveBeenCalledWith(
      "error verifying auth token: Invalid email address",
    );
  });

  test("should log exception and return 200 if file type is invalid", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: {
        message: {
          attributes: {
            bucketId: testBucketId,
            objectId: "not-a-valid-file.json",
          },
        },
      },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(testExceptionHandler).toHaveBeenCalledWith(
      `Unsupported bucket + object pair: test-bucket/not-a-valid-file.json`,
    );
  });

  test("should work if email is correct", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    expect(mockCloudTasksClient.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: "parent",
        task: {
          httpRequest: {
            headers: {
              "Content-Type": "application/json",
            },
            body: Buffer.from(
              JSON.stringify({
                bucketId: "test-bucket",
                objectId: "test-object",
              }),
            ),
            httpMethod: "POST",
            url: "cloud-task-url",
            oidcToken: {
              serviceAccountEmail: "cloud-task-service-account-email@fake.com",
            },
          },
        },
      }),
    );
  });
});
