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

import { Storage } from "@google-cloud/storage";
import {
  CompactEncrypt,
  exportPKCS8,
  generateKeyPair,
  GenerateKeyPairResult,
} from "jose";
import { createJWKSMock, JWKSMock, JwtPayload } from "mock-jwks";
import request from "supertest";

import { AuthorizedUserProfile, ResidentUserProfile } from "~@jii/auth";

import {
  checkDemoResidentsRoster,
  checkEdovoTestAccountRoster,
  checkResidentsRoster,
  getFirebaseToken,
} from "../../helpers/firebaseAdmin";
import { secrets } from "../../helpers/secrets";
import { edovoToken } from "./function";

vi.mock("@google-cloud/storage");
vi.mock("@sentry/node");
vi.mock("../../helpers/secrets");
vi.mock("../../helpers/firebaseAdmin");

const mockJwksHost = "http://fake-jwks-url-test";

const mockSecrets: Record<string, string> = {
  // this path is what mock-jwks expects by default. the application itself doesn't care,
  // it just passes through whatever is stored in this secret as the URL
  EDOVO_JWKS_URL: `${mockJwksHost}/.well-known/jwks.json`,
};

const mockRealUserProfile: AuthorizedUserProfile = {
  stateCode: "US_OZ",
  externalId: "real-123",
  pseudonymizedId: "pseudo-real-123",
};
const mockDemoUserProfile: ResidentUserProfile = {
  stateCode: "US_OZ",
  externalId: "demo-123",
  pseudonymizedId: "pseudo-demo-123",
  permissions: [],
};
const mockFirebaseTokenValue = "test-firebase-token";

let tokenEncryptionKeys: GenerateKeyPairResult;
let mockEdovoJWKS: JWKSMock;
let mockEncryptedToken: string;

async function createMockToken(payload: JwtPayload | undefined) {
  // simulates a token signed by the Edovo private key
  const signedToken = mockEdovoJWKS.token(payload);

  // simulates encryption by Edovo with our public key.
  // this is what is actually passed to us
  mockEncryptedToken = await new CompactEncrypt(
    new TextEncoder().encode(signedToken),
  )
    .setProtectedHeader({
      alg: "RSA-OAEP-256",
      enc: "A256GCM",
      cty: "JWT",
    })
    .encrypt(tokenEncryptionKeys.publicKey);
}

beforeAll(async () => {
  tokenEncryptionKeys = await generateKeyPair("RSA-OAEP-256");

  mockSecrets["EDOVO_TOKEN_PRIVATE_KEY"] = await exportPKCS8(
    tokenEncryptionKeys.privateKey,
  );
});

beforeEach(async () => {
  vi.mocked(secrets).getLatestValue.mockImplementation(
    async (secretName) => mockSecrets[secretName] ?? "test-default",
  );
  vi.mocked(getFirebaseToken).mockResolvedValue(mockFirebaseTokenValue);

  // this mocks the Edovo API where we get the signature verification key from
  mockEdovoJWKS = createJWKSMock(mockJwksHost);
  // a little confusing but this starts the mock server
  // and returns a callback for onTestFinished that stops it
  onTestFinished(mockEdovoJWKS.start());

  await createMockToken({
    inmate_id: "123456",
    facility_state: "OZ",
  });

  // mock the various roster lookup functions. individual tests may turn some of these off
  // to exercise more realistic conditions based on the order they are called in
  vi.mocked(checkResidentsRoster).mockResolvedValue(mockRealUserProfile);
  vi.mocked(checkDemoResidentsRoster).mockResolvedValue(mockDemoUserProfile);
  vi.mocked(checkEdovoTestAccountRoster).mockResolvedValue({
    email: "test@recidiviz.org",
  });
  // this gets used to look up an ACL for recidiviz accounts. We are not testing
  // our use of it here, just stubbing it out
  const mockStorageClient = {
    bucket: () => ({
      file: () => ({
        download: () => [
          Buffer.from(JSON.stringify({ allowedStates: ["US_OZ"] })),
        ],
      }),
    }),
  };
  // @ts-expect-error not passing a complete object here, only what we need to stub
  vi.mocked(Storage).mockReturnValue(mockStorageClient);
});

test("succeeds with resident lookup", async () => {
  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth(`${mockEncryptedToken}`, { type: "bearer" });

  expect(resp.status).toBe(200);
  expect(resp.body).toEqual({
    firebaseToken: mockFirebaseTokenValue,
    user: mockRealUserProfile,
  });
});

test("succeeds with demo account lookup", async () => {
  // this is the second fallback after residents and internal test accounts rosters
  vi.mocked(checkResidentsRoster).mockResolvedValue(undefined);
  vi.mocked(checkEdovoTestAccountRoster).mockResolvedValue(undefined);

  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth(`${mockEncryptedToken}`, { type: "bearer" });

  expect(resp.status).toBe(200);
  expect(resp.body).toEqual({
    firebaseToken: mockFirebaseTokenValue,
    user: mockDemoUserProfile,
  });
});

test("succeeds with Recidiviz account lookup", async () => {
  // this is the first fallback after residents roster
  vi.mocked(checkResidentsRoster).mockResolvedValue(undefined);

  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth(`${mockEncryptedToken}`, { type: "bearer" });

  expect(resp.status).toBe(200);
  expect(resp.body).toEqual({
    firebaseToken: mockFirebaseTokenValue,
    user: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_OZ"],
      permissions: ["enhanced", "live_data", "translator"],
    },
  });
});

test("succeeds with magic payload for Securus test accounts", async () => {
  // we don't have to disable any of the lookup mocks
  // because this one takes precedence over all

  mockSecrets["SECURUS_TEST_FACILITIES"] = JSON.stringify(["securus-test-1"]);
  await createMockToken({
    inmate_id: "123456",
    facility_state: "OZ",
    // this is actually the only field that matters to the result here
    facility_name: "securus-test-1",
  });

  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth(`${mockEncryptedToken}`, { type: "bearer" });

  expect(resp.status).toBe(200);
  // note here that the response is hard-coded to a specific test identity,
  // regardless of which state or ID was specified in the payload
  expect(resp.body).toEqual({
    firebaseToken: mockFirebaseTokenValue,
    user: {
      stateCode: "US_AZ",
      permissions: [],
      externalId: "RES001",
      pseudonymizedId: "anonres001",
    },
  });
});

test("unknown user", async () => {
  // case where all roster lookups fail
  vi.mocked(checkResidentsRoster).mockResolvedValue(undefined);
  vi.mocked(checkEdovoTestAccountRoster).mockResolvedValue(undefined);
  vi.mocked(checkDemoResidentsRoster).mockResolvedValue(undefined);

  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth(`${mockEncryptedToken}`, { type: "bearer" });

  expect(resp.status).toBe(403);
  expect(resp.body).toMatchInlineSnapshot(`
    {
      "error": "You are not authorized to access this application",
    }
  `);
});

test("invalid token", async () => {
  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth("not-a-valid-JWE", { type: "bearer" });

  expect(resp.status).toBe(500);
  expect(resp.body).toMatchInlineSnapshot(`
    {
      "error": "An unexpected error occurred",
    }
  `);
});

test("invalid payload", async () => {
  await createMockToken({
    marco: "polo",
  });

  const resp = await request(
    // @ts-expect-error this type overlaps enough for our purposes
    edovoToken,
  )
    .get("/")
    .auth(`${mockEncryptedToken}`, { type: "bearer" });

  expect(resp.status).toBe(401);
  expect(resp.body).toMatchInlineSnapshot(`
    {
      "error": "Your credentials contain invalid identity data",
    }
  `);
});

describe("language field handling", () => {
  test("succeeds with language field", async () => {
    await createMockToken({
      inmate_id: "123456",
      facility_state: "OZ",
      language: "es",
    });

    const resp = await request(
      // @ts-expect-error this type overlaps enough for our purposes
      edovoToken,
    )
      .get("/")
      .auth(`${mockEncryptedToken}`, { type: "bearer" });

    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      firebaseToken: mockFirebaseTokenValue,
      user: mockRealUserProfile,
      language: "es",
    });
  });

  test("succeeds without language field", async () => {
    // Default mock token has no language field
    const resp = await request(
      // @ts-expect-error this type overlaps enough for our purposes
      edovoToken,
    )
      .get("/")
      .auth(`${mockEncryptedToken}`, { type: "bearer" });

    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      firebaseToken: mockFirebaseTokenValue,
      user: mockRealUserProfile,
      // No language field should be present
    });
  });

  test("passes through invalid language values", async () => {
    await createMockToken({
      inmate_id: "123456",
      facility_state: "OZ",
      language: "invalid-locale-code",
    });

    const resp = await request(
      // @ts-expect-error this type overlaps enough for our purposes
      edovoToken,
    )
      .get("/")
      .auth(`${mockEncryptedToken}`, { type: "bearer" });

    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      firebaseToken: mockFirebaseTokenValue,
      user: mockRealUserProfile,
      language: "invalid-locale-code",
    });
  });
});
