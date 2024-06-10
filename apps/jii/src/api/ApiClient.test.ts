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

import { waitFor } from "@testing-library/react";

import type { AuthClient } from "~auth";
import { FirestoreAPIClient } from "~firestore-api";

import { ApiClient } from "./ApiClient";

vi.hoisted(() => {
  vi.stubEnv("VITE_API_URL_BASE", "http://localhost:9999/functions");
});

vi.mock("~firestore-api");

let client: ApiClient;
const getTokenMock = vi.fn();

const projectIdMock = "test-project-id";
const apiKeyMock = "test-api-key";

beforeEach(() => {
  getTokenMock.mockReturnValue("test-auth0-access-token");
  vi.stubEnv("VITE_FIRESTORE_PROJECT", projectIdMock);
  vi.stubEnv("VITE_FIRESTORE_API_KEY", apiKeyMock);

  client = new ApiClient({
    stateCode: "US_ME",
    authClient: { getTokenSilently: getTokenMock } as unknown as AuthClient,
  });
});

test("firestore client", () => {
  expect(FirestoreAPIClient).toHaveBeenCalledExactlyOnceWith(
    "US_ME",
    projectIdMock,
    apiKeyMock,
  );
});

test("authenticate", async () => {
  fetchMock.mockResponse(
    JSON.stringify({ firebaseToken: "test-firebase-token" }),
  );

  expect(client.isAuthenticated).toBeFalse();

  await waitFor(() => expect(client.isAuthenticated).toBeTrue());
  expect(fetchMock.mock.lastCall).toMatchInlineSnapshot(`
    [
      "http://localhost:9999/functions/firebaseToken",
      {
        "headers": {
          "Authorization": "Bearer test-auth0-access-token",
        },
      },
    ]
  `);

  expect(FirestoreAPIClient.prototype.authenticate).toHaveBeenCalledWith(
    "test-firebase-token",
  );
});
