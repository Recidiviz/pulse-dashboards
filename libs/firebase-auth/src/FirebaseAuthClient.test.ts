// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

import { FirebaseAuthClient } from "./FirebaseAuthClient";

vi.mock("firebase/app");
vi.mock("firebase/auth");

const testProjectId = "demo-test";
const testApiKey = "abc123";
const testFirebaseToken = "test-token-123";
// minimal stub
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockFirebaseApp: any;
// minimal stub
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockFirebaseAuth: any;

let client: FirebaseAuthClient;

beforeEach(() => {
  mockFirebaseApp = { name: "mock firebase app" };
  mockFirebaseAuth = {
    config: {},
  };
  vi.mocked(initializeApp).mockReturnValue(mockFirebaseApp);
  vi.mocked(getAuth).mockReturnValue(mockFirebaseAuth);
  vi.mocked(getApps).mockReturnValue([]);

  client = new FirebaseAuthClient(testProjectId, testApiKey);
});

test("initializes Firebase on demand without constructor side effects", () => {
  expect(initializeApp).not.toHaveBeenCalled();
  expect(getAuth).not.toHaveBeenCalled();

  expect(client.app).toBe(mockFirebaseApp);
  expect(initializeApp).toHaveBeenCalledWith({
    projectId: testProjectId,
    apiKey: testApiKey,
  });

  expect(client.auth).toBe(mockFirebaseAuth);
  expect(getAuth).toHaveBeenCalledWith(mockFirebaseApp);
});

test("base authentication", async () => {
  await client.authenticate(testFirebaseToken);
  expect(connectAuthEmulator).not.toHaveBeenCalled();
  expect(mockFirebaseAuth.config).toEqual({});
});

test("authentication with Firebase emulator", async () => {
  const testEmulatorUrl = "http://localhost:99999";
  await client.authenticate(testFirebaseToken, testEmulatorUrl);
  expect(connectAuthEmulator).toHaveBeenCalledWith(
    mockFirebaseAuth,
    testEmulatorUrl,
  );
  expect(mockFirebaseAuth.config).toEqual({});
});

test("authentication with reverse proxy enabled", async () => {
  // this is an environment setting so depends on the client being initialized differently
  const testProxyHost = "example.com";
  client = new FirebaseAuthClient(testProjectId, testApiKey, testProxyHost);

  await client.authenticate(testFirebaseToken);
  expect(connectAuthEmulator).not.toHaveBeenCalled();
  expect(mockFirebaseAuth.config).toEqual({
    apiHost: `${testProxyHost}/gcp-identitytoolkit`,
    tokenApiHost: `${testProxyHost}/gcp-securetoken`,
  });
});
