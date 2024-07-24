import { CloudTasksClient } from "@google-cloud/tasks";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { testAndGetSentryReport } from "~sentencing-server/test/import/common/utils";
import { samplePayloadMessage } from "~sentencing-server/test/import/trigger-import/constants";
import { testServer } from "~sentencing-server/test/setup";

let getPayloadImp = vi.fn();

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => {
    return {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: getPayloadImp,
      }),
    };
  }),
}));

const mockCloudTasksClient = mock<CloudTasksClient>({
  queuePath: vi.fn().mockReturnValue("parent"),
  createTask: vi.fn().mockResolvedValue([{ name: "task-name" }]),
});

vi.mock("@google-cloud/tasks", () => ({
  CloudTasksClient: vi.fn().mockImplementation(() => {
    return mockCloudTasksClient;
  }),
}));

beforeEach(() => {
  getPayloadImp = vi.fn().mockReturnValue({
    email_verified: true,
    email: "test-csn@fake.com",
  });
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

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toBe("No bearer token was provided");
  });

  test("should log exception and return 200 if there is no token payload", async () => {
    getPayloadImp = vi.fn().mockReturnValue(undefined);

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toBe(
      "error verifying auth token: Error: Email not verified",
    );
  });

  test("should log exception and return 200 if email is not verified", async () => {
    getPayloadImp = vi.fn().mockReturnValue({
      email_verified: false,
    });

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toBe(
      "error verifying auth token: Error: Email not verified",
    );
  });

  test("should log exception and return 200 if there is no email", async () => {
    getPayloadImp = vi.fn().mockReturnValue({
      email_verified: true,
      email: undefined,
    });

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toBe(
      "error verifying auth token: Error: Email not verified",
    );
  });

  test("should log exception and return 200 if email doesn't match expected", async () => {
    getPayloadImp = vi.fn().mockReturnValue({
      email_verified: true,
      email: "not-the-right-email@gmail.com",
    });

    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toBe(
      "error verifying auth token: Error: Invalid email address",
    );
  });

  test("should log exception and return 200 if file type is invalid", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: {
        message: {
          attributes: {
            bucketId: "bucket-id",
            objectId: "US_ID/not-a-valid-file.json",
          },
        },
      },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReport = await testAndGetSentryReport();
    expect(sentryReport.error?.message).toBe(
      "Invalid object id: US_ID/not-a-valid-file.json",
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
                bucketId: "bucket-id",
                objectId: "US_ID/sentencing_case_record.json",
              }),
            ),
            httpMethod: "POST",
            url: "test-task-url",
            oidcToken: {
              serviceAccountEmail: "test-task@fake.com",
            },
          },
        },
      }),
    );
  });
});
