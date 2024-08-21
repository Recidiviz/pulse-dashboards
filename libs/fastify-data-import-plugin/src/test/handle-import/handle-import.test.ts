import { beforeEach, describe, expect, test, vi } from "vitest";

import { handleImportBody } from "~fastify-data-import-plugin/test/handle-import/constants";
import { arrayToJsonLines } from "~fastify-data-import-plugin/test/handle-import/utils";
import {
  mockStorageSingleton,
  setGetPayloadImp,
  testEtlHelper,
  testExceptionHandler,
  testServer,
} from "~fastify-data-import-plugin/test/setup";

beforeEach(() => {
  setGetPayloadImp(
    vi.fn().mockReturnValue({
      email_verified: true,
      email: "test-handle-import-email@fake.com",
    }),
  );
});

describe("handle_import", () => {
  describe("auth", () => {
    test("should throw error if there is no token", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: handleImportBody,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        "error verifying auth token: No bearer token was provided",
      );
    });

    test("should throw error if there is no token payload", async () => {
      setGetPayloadImp(vi.fn().mockReturnValue(undefined));

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: handleImportBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        "error verifying auth token: Email not verified",
      );
    });

    test("should throw error if email is not verified", async () => {
      setGetPayloadImp(
        vi.fn().mockReturnValue({
          email_verified: false,
        }),
      );

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: handleImportBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        "error verifying auth token: Email not verified",
      );
    });

    test("should throw error if there is no email", async () => {
      setGetPayloadImp(
        vi.fn().mockReturnValue({
          email_verified: true,
          email: undefined,
        }),
      );

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: handleImportBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        "error verifying auth token: Email not verified",
      );
    });

    test("should throw error if email doesn't match expected", async () => {
      setGetPayloadImp(
        vi.fn().mockReturnValue({
          email_verified: true,
          email: "not-the-right-email@gmail.com",
        }),
      );

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: handleImportBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        "error verifying auth token: Invalid email address",
      );
    });

    test("should throw error if file type is invalid", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: {
          bucketId: "test-bucket",
          objectId: "not-a-valid-file.json",
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        `Unsupported bucket + object pair: test-bucket/not-a-valid-file.json`,
      );
    });

    test("should work if email is correct", async () => {
      await mockStorageSingleton
        .bucket("test-bucket")
        .file("test-object")
        .save(
          arrayToJsonLines([
            {
              datapoint: "first",
            },
            {
              datapoint: "second",
            },
          ]),
        );

      const response = await testServer.inject({
        method: "POST",
        url: "/handle_import",
        payload: handleImportBody,
        headers: { authorization: `Bearer token` },
      });

      expect(response.statusCode).toBe(200);

      expect(testEtlHelper).toHaveBeenCalledWith([
        {
          datapoint: "first",
        },
        {
          datapoint: "second",
        },
      ]);
    });
  });
});
