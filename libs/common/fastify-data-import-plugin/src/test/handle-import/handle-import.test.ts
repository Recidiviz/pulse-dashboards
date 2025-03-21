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
          objectId: "US_ID/not-a-valid-file.json",
        },
        headers: { authorization: `Bearer token` },
      });

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
      });

      expect(testExceptionHandler).toHaveBeenCalledWith(
        `Unsupported bucket + object pair: test-bucket/US_ID/not-a-valid-file.json`,
      );
    });

    test("should work if email is correct", async () => {
      await mockStorageSingleton
        .bucket("test-bucket")
        .file("US_ID/test-object")
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

      expect(testEtlHelper).toHaveBeenCalledWith(
        "US_ID",
        // This is how a generator apparently looks?
        expect.objectContaining({}),
      );
    });
  });
});
