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

import { usMeResidents, usMeSccpFixtures } from "~datatypes";
import { FilterParams, FirestoreAPIClient } from "~firestore-api";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { proxyHost } from "../../utils/proxy";
import type { AuthManager } from "../auth/AuthManager";
import { ApiClient } from "./ApiClient";

vi.mock("~firestore-api");
vi.mock("../../utils/proxy");

let client: ApiClient;
const getFirebaseTokenMock = vi.fn();

const projectIdMock = "test-project-id";
const apiKeyMock = "test-api-key";
const stateCodeMock = "US_ME";

beforeEach(() => {
  getFirebaseTokenMock.mockResolvedValue("test-firebase-token");
  vi.stubEnv("VITE_FIRESTORE_PROJECT", projectIdMock);
  vi.stubEnv("VITE_FIRESTORE_API_KEY", apiKeyMock);

  client = new ApiClient({
    authManager: {
      getFirebaseToken: getFirebaseTokenMock,
    } as unknown as AuthManager,
    config: residentsConfigByState.US_ME,
  });
});

test("firestore client", () => {
  expect(FirestoreAPIClient).toHaveBeenCalledExactlyOnceWith(
    projectIdMock,
    apiKeyMock,
    expect.any(Function),
    undefined,
  );
});

test("authenticate", async () => {
  expect(client.isAuthenticated).toBeFalse();

  await waitFor(() => expect(client.isAuthenticated).toBeTrue());

  expect(FirestoreAPIClient.prototype.authenticate).toHaveBeenCalledWith(
    "test-firebase-token",
  );
});

describe("after authentication", () => {
  beforeEach(async () => {
    await waitFor(() => expect(client.isAuthenticated).toBeTrue());
  });

  describe("resident", () => {
    const record = usMeResidents[0];

    test("exists", async () => {
      vi.mocked(FirestoreAPIClient.prototype.resident).mockResolvedValue(
        record,
      );

      const fetched = await client.residentById(
        stateCodeMock,
        record.personExternalId,
      );

      expect(
        FirestoreAPIClient.prototype.resident,
      ).toHaveBeenCalledExactlyOnceWith(stateCodeMock, record.personExternalId);
      expect(fetched).toEqual(record);
    });

    test("does not exist", async () => {
      vi.mocked(FirestoreAPIClient.prototype.resident).mockResolvedValue(
        undefined,
      );

      await expect(
        client.residentById(stateCodeMock, record.personExternalId),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: No data found for resident RES001]`,
      );
    });
  });

  describe("eligibility", () => {
    const record = usMeSccpFixtures.RES004fullyEligibleHalfPortion.output;

    test("exists", async () => {
      vi.mocked(
        FirestoreAPIClient.prototype.recordForExternalId,
      ).mockResolvedValue(record);

      const fetched = await client.residentEligibility(
        stateCodeMock,
        "abc123",
        "usMeSCCP",
      );

      expect(
        vi.mocked(FirestoreAPIClient.prototype.recordForExternalId).mock
          .calls[0],
      ).toEqual([
        stateCodeMock,
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

      await expect(
        client.residentEligibility(stateCodeMock, "abc123", "usMeSCCP"),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Missing usMeSCCP record for abc123]`,
      );
    });
  });

  describe("residents", () => {
    const records = usMeResidents;

    test("exists", async () => {
      vi.mocked(FirestoreAPIClient.prototype.residents).mockResolvedValue([
        ...records,
      ]);

      const fetched = await client.residents(stateCodeMock);

      expect(FirestoreAPIClient.prototype.residents).toHaveBeenCalled();
      expect(fetched).toEqual(records);
    });

    test("no filters", async () => {
      await client.residents(stateCodeMock);
      expect(
        FirestoreAPIClient.prototype.residents,
      ).toHaveBeenCalledExactlyOnceWith(stateCodeMock, undefined);
    });

    test("filtered", async () => {
      const filter: FilterParams = ["foo", "==", "bar"];
      await client.residents(stateCodeMock, [filter]);
      expect(
        FirestoreAPIClient.prototype.residents,
      ).toHaveBeenCalledExactlyOnceWith(stateCodeMock, [filter]);
    });

    test("does not exist", async () => {
      vi.mocked(FirestoreAPIClient.prototype.residents).mockResolvedValue([]);

      const fetched = await client.residents(stateCodeMock);

      expect(fetched).toEqual([]);
    });
  });
});

test("with proxy option", () => {
  vi.mocked(proxyHost).mockReturnValue("foo.bar");

  client = new ApiClient({
    authManager: {
      getFirebaseToken: getFirebaseTokenMock,
    } as unknown as AuthManager,
    config: residentsConfigByState.US_ME,
  });

  expect(FirestoreAPIClient).toHaveBeenLastCalledWith(
    projectIdMock,
    apiKeyMock,
    expect.any(Function),
    "foo.bar",
  );
});
