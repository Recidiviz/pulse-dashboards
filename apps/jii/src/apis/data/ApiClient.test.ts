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
import { z } from "zod";

import type { AuthClient } from "~auth";
import { usMeResidents, usMeSccpFixtures } from "~datatypes";
import { FilterParams, FirestoreAPIClient } from "~firestore-api";

import { residentsConfigByState } from "../../configs/residentsConfig";
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
    config: residentsConfigByState.US_ME,
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

describe("after authentication", () => {
  beforeEach(async () => {
    fetchMock.mockResponse(
      JSON.stringify({ firebaseToken: "test-firebase-token" }),
    );
    await waitFor(() => expect(client.isAuthenticated).toBeTrue());
  });

  describe("resident", () => {
    const record = usMeResidents[0];

    test("exists", async () => {
      vi.mocked(FirestoreAPIClient.prototype.resident).mockResolvedValue(
        record,
      );

      const fetched = await client.residentById(record.personExternalId);

      expect(
        FirestoreAPIClient.prototype.resident,
      ).toHaveBeenCalledExactlyOnceWith(record.personExternalId);
      expect(fetched).toEqual(record);
    });

    test("does not exist", async () => {
      vi.mocked(FirestoreAPIClient.prototype.resident).mockResolvedValue(
        undefined,
      );

      await expect(
        client.residentById(record.personExternalId),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: No data found for resident RES001]`,
      );
    });
  });

  describe("eligibility", () => {
    const record = usMeSccpFixtures.fullyEligibleHalfPortion.output;

    test("exists", async () => {
      vi.mocked(
        FirestoreAPIClient.prototype.recordForExternalId,
      ).mockResolvedValue(record);

      const fetched = await client.residentEligibility("abc123", "usMeSCCP");

      expect(
        vi.mocked(FirestoreAPIClient.prototype.recordForExternalId).mock
          .calls[0],
      ).toEqual([
        { raw: "US_ME-SCCPReferrals" },
        "abc123",
        expect.any(z.ZodType),
      ]);

      expect(fetched).toEqual(record);
    });

    test("does not exist", async () => {
      vi.mocked(
        FirestoreAPIClient.prototype.recordForExternalId,
      ).mockResolvedValue(undefined);

      const fetched = await client.residentEligibility("abc123", "usMeSCCP");

      expect(fetched).toBeUndefined();
    });
  });

  describe("residents", () => {
    const records = usMeResidents;

    test("exists", async () => {
      vi.mocked(FirestoreAPIClient.prototype.residents).mockResolvedValue([
        ...records,
      ]);

      const fetched = await client.residents();

      expect(FirestoreAPIClient.prototype.residents).toHaveBeenCalled();
      expect(fetched).toEqual(records);
    });

    test("no filters", async () => {
      await client.residents();
      expect(
        FirestoreAPIClient.prototype.residents,
      ).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    test("filtered", async () => {
      const filter: FilterParams = ["foo", "==", "bar"];
      await client.residents([filter]);
      expect(
        FirestoreAPIClient.prototype.residents,
      ).toHaveBeenCalledExactlyOnceWith([filter]);
    });

    test("does not exist", async () => {
      vi.mocked(FirestoreAPIClient.prototype.residents).mockResolvedValue([]);

      const fetched = await client.residents();

      expect(fetched).toEqual([]);
    });
  });
});
