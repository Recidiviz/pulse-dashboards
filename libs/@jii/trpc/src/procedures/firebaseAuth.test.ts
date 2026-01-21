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

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import firebaseAdmin from "firebase-admin";
import superjson from "superjson";
import { beforeAll } from "vitest";

import { getPrismaClientForStateCode } from "~@jii/prisma";
import { buildCommonServer } from "~server-setup-plugin";

import { createContext } from "../context";
import { firebaseAuthedProcedure } from "./firebaseAuth";
import { router } from "./init";

vi.mock("firebase-admin");
vi.mock("~@jii/prisma", () => {
  // we don't need to mock the entire library for these tests
  // and prisma has some special mocking requirements that we don't want to deal with here,
  // which is why this is only a partial implementation of the public api
  return { getPrismaClientForStateCode: vi.fn() };
});

const testPort = 3005;
const testHost = "localhost";
const firebaseAuthMock = {
  // library method that validates and decodes the token payload.
  // we don't want the external dependency on Firebase so we can just mock its responses
  // rather than worrying about generating valid tokens for testing
  verifyIdToken: vi.fn(),
};

// easiest way to test a real trpc context is with a real server,
// so let's make one to use here.
let testServer: ReturnType<typeof buildCommonServer>;
// This uses the same context as our real routers
// but doesn't actually do anything useful
const testAppRouter = router({
  // A procedure that does nothing, but is used to test that the base procedure auth checks are running.
  test: firebaseAuthedProcedure.query(async () => {
    return "Hello, world!";
  }),
});
type TestAppRouter = typeof testAppRouter;
// server is stateless so we can reuse it for all tests rather than rebuilding it each time
beforeAll(async () => {
  // @ts-expect-error just stubbing what we need
  vi.mocked(firebaseAdmin.auth).mockReturnValue(firebaseAuthMock);

  testServer = buildCommonServer({
    createContext: createContext,
    appRouter: testAppRouter,
    firebaseAuthOptions: {
      projectId: "demo-test",
    },
  });

  // Start listening.
  testServer.listen({ port: testPort, host: testHost });
});
afterAll(() => {
  testServer.close();
});

const defaultTestHeaders = {
  StateCode: "US_XX",
  // this token gets processed by a third party library so we just rely on mocks below
  Authorization: "Bearer valid-token",
};

// this is the bare minimum required to make a valid request
const defaultAuthPayload = {
  app: "jii",
  sub: "abc123",
  stateCode: "US_XX",
  permissions: ["live_data"],
};

// returns a TRPC client that will call the test server defined above.
// same basic way we expect the server to be used in real situations
function makeTestClient(
  testHeaders: Record<string, string> = defaultTestHeaders,
) {
  return createTRPCClient<TestAppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
        transformer: superjson,
        headers() {
          return testHeaders;
        },
      }),
    ],
  });
}
type TestClient = ReturnType<typeof makeTestClient>;
let client: TestClient;

beforeEach(() => {
  client = makeTestClient();
  firebaseAuthMock.verifyIdToken.mockResolvedValue(defaultAuthPayload);
});

test("require state code in header", async () => {
  client = makeTestClient({});

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Unsupported state code provided in request headers: undefined",
    }),
  );
});

test("require auth header", async () => {
  client = makeTestClient({ StateCode: "US_XX" });

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "BAD_REQUEST",
    }),
  );
});

test("require token from JII app", async () => {
  firebaseAuthMock.verifyIdToken.mockResolvedValue({ app: "staff" });

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this application",
    }),
  );
});

test("must have permissions for requested state", async () => {
  firebaseAuthMock.verifyIdToken.mockResolvedValue({
    ...defaultAuthPayload,
    stateCode: "US_ZZ",
  });

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this state",
    }),
  );
});

test("Recidiviz users must have permissions for requested state", async () => {
  firebaseAuthMock.verifyIdToken.mockResolvedValue({
    ...defaultAuthPayload,
    stateCode: "RECIDIVIZ",
    allowedStates: ["US_YY", "US_ZZ"],
  });

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this state",
    }),
  );
});

test("Demo data requests must have permissions for requested state", async () => {
  firebaseAuthMock.verifyIdToken.mockResolvedValue({
    ...defaultAuthPayload,
    stateCode: "PARTNER",
    allowedStates: ["US_YY", "US_ZZ"],
    permissions: [],
  });

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this state",
    }),
  );
});

test("database must support state code", async () => {
  const dbError = new Error("oops");

  vi.mocked(getPrismaClientForStateCode).mockImplementation(() => {
    throw dbError;
  });

  await expect(client.test.query()).rejects.toThrow(
    new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Unsupported state code provided in request headers: US_XX",
      cause: dbError,
    }),
  );
});

test("successful context creation", async () => {
  await expect(client.test.query()).resolves.toMatchInlineSnapshot(
    `"Hello, world!"`,
  );

  expect(getPrismaClientForStateCode).toHaveBeenCalledWith("US_XX");
});

test("successful context creation for demo request", async () => {
  client = makeTestClient({ ...defaultTestHeaders, useDemoData: "true" });

  await expect(client.test.query()).resolves.toMatchInlineSnapshot(
    `"Hello, world!"`,
  );

  expect(getPrismaClientForStateCode).toHaveBeenCalledWith("US_XX_DEMO");
});

test("Recidiviz users don't need state permissions for demo data", async () => {
  client = makeTestClient({ ...defaultTestHeaders, useDemoData: "true" });
  firebaseAuthMock.verifyIdToken.mockResolvedValue({
    ...defaultAuthPayload,
    stateCode: "RECIDIVIZ",
    allowedStates: ["US_YY", "US_ZZ"],
  });

  await expect(client.test.query()).resolves.toMatchInlineSnapshot(
    `"Hello, world!"`,
  );
});

test("successful context creation without live_data permission", async () => {
  firebaseAuthMock.verifyIdToken.mockResolvedValue({
    ...defaultAuthPayload,
    permissions: [],
  });

  await expect(client.test.query()).resolves.toMatchInlineSnapshot(
    `"Hello, world!"`,
  );

  expect(getPrismaClientForStateCode).toHaveBeenCalledWith("US_XX_DEMO");
});
