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

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import firebaseAdmin from "firebase-admin";
import superjson from "superjson";
import { describe, expect, test } from "vitest";
import { beforeAll } from "vitest";

import { buildCommonServer } from "~server-setup-plugin";
import {
  createFirebaseContext,
  FbAppRouter,
  testFbRouter,
} from "~server-setup-plugin/test/utils/firebase";

vi.mock("firebase-admin");

export const testPort = 3015;
export const testHost = "localhost";

export let testServer: ReturnType<typeof buildCommonServer>;

const firebaseAuthMock = {
  verifyIdToken: vi.fn(),
};

describe("firebase auth", () => {
  beforeAll(async () => {
    // @ts-expect-error just stubbing what we need
    vi.mocked(firebaseAdmin.initializeApp).mockImplementation((opts) => {
      expect(opts).toEqual({ projectId: "demo-test" });
    });

    // @ts-expect-error just stubbing what we need
    vi.mocked(firebaseAdmin.auth).mockReturnValue(firebaseAuthMock);

    testServer = buildCommonServer({
      createContext: createFirebaseContext,
      appRouter: testFbRouter,
      firebaseAuthOptions: {
        projectId: "demo-test",
      },
    });

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

  afterAll(() => {
    testServer.close();
  });

  test("should throw an error if there is no authorization header", async () => {
    // Don't pass authorization headers
    const trpcClient = createTRPCClient<FbAppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${testPort}`,
          // Required to get Date objects to serialize correctly.
          transformer: superjson,
        }),
      ],
    });

    await expect(() => trpcClient.test.query()).rejects.toThrowError(
      new TRPCError({
        code: "BAD_REQUEST",
      }),
    );
  });

  test("should throw error if token is invalid", async () => {
    firebaseAuthMock.verifyIdToken.mockImplementation(() => {
      throw new Error();
    });

    const trpcClient = createTRPCClient<FbAppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${testPort}`,
          headers() {
            return {
              Authorization: "Bearer nonsense-token",
              StateCode: "US_ID",
            };
          },
          // Required to get Date objects to serialize correctly.
          transformer: superjson,
        }),
      ],
    });

    await expect(() => trpcClient.test.query()).rejects.toThrowError(
      new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token provided",
      }),
    );
  });

  test("should be marked as authorized if passed valid token", async () => {
    firebaseAuthMock.verifyIdToken.mockResolvedValue({});

    const trpcClient = createTRPCClient<FbAppRouter>({
      links: [
        httpBatchLink({
          url: `http://${testHost}:${testPort}`,
          headers() {
            return {
              Authorization: `Bearer valid-token`,
              StateCode: "US_ID",
            };
          },
          // Required to get Date objects to serialize correctly.
          transformer: superjson,
        }),
      ],
    });

    const result = await trpcClient.test.query();
    expect(result).toEqual("Hello, world!");
  });
});
