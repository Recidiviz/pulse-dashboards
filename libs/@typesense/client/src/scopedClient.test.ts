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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { createScopedTypesenseClient } from "./scopedClient";

const mockPerform = vi.fn();
// Implementations are (re)set in beforeEach rather than here: this project runs
// vitest with `mockReset: true`, which strips them before every test.
const mockCreateTypesenseClient = vi.fn();

vi.mock("./client", () => ({
  createTypesenseClient: (config: unknown) =>
    mockCreateTypesenseClient(config as never),
}));

const MINT_RESPONSE = {
  keys: {
    supervisionStaff: "key-supervision-staff",
    locations: "key-locations",
  },
  // Comfortably beyond the refresh buffer.
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  typesenseHost: "http://typesense.test:8108",
};

function makeClient(mintResponse: unknown = MINT_RESPONSE) {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mintResponse),
  });

  const client = createScopedTypesenseClient({
    mintEndpoint: () => "http://staff-server.test/api/US_XX/mint",
    getMintRequestBody: () => ({ system: "SUPERVISION" }),
    getAuthHeader: () => null,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  return { client, fetchImpl };
}

beforeEach(() => {
  mockPerform.mockResolvedValue({ results: [] });
  mockCreateTypesenseClient.mockReturnValue({
    multiSearch: { perform: mockPerform },
  });
});

describe("per-search key routing", () => {
  test("stamps each search with the key scoped to its own collection", async () => {
    const { client } = makeClient();

    await client.multiSearch({
      searches: [
        { collection: "supervisionStaff", q: "smith", query_by: "surname" },
        { collection: "locations", q: "smith", query_by: "name" },
      ],
    });

    expect(mockPerform).toHaveBeenCalledWith({
      searches: [
        {
          collection: "supervisionStaff",
          q: "smith",
          query_by: "surname",
          "x-typesense-api-key": "key-supervision-staff",
        },
        {
          collection: "locations",
          q: "smith",
          query_by: "name",
          "x-typesense-api-key": "key-locations",
        },
      ],
    });
  });

  test("leaves the rest of each search descriptor untouched", async () => {
    const { client } = makeClient();

    await client.multiSearch({
      searches: [
        {
          collection: "locations",
          q: "*",
          query_by: "name",
          filter_by: "idType:=`districtId`",
          per_page: 20,
          infix: "always",
        },
      ],
    });

    expect(mockPerform.mock.calls[0][0].searches[0]).toMatchObject({
      filter_by: "idType:=`districtId`",
      per_page: 20,
      infix: "always",
    });
  });

  // Falling back to another collection's key would run the search under the
  // wrong scope, and running it unscoped would be worse still.
  test("throws rather than guess when a collection has no key", async () => {
    const { client } = makeClient();

    await expect(
      client.multiSearch({
        searches: [
          { collection: "incarcerationStaff", q: "*", query_by: "surname" },
        ],
      }),
    ).rejects.toThrow(/incarcerationStaff/);

    expect(mockPerform).not.toHaveBeenCalled();
  });

  test("throws when a search names no collection at all", async () => {
    const { client } = makeClient();

    await expect(
      client.multiSearch({ searches: [{ q: "*", query_by: "surname" }] }),
    ).rejects.toThrow(/unnamed/);
  });

  test("names the available collections in the error, to make the mismatch obvious", async () => {
    const { client } = makeClient();

    await expect(
      client.multiSearch({
        searches: [{ collection: "clients", q: "*", query_by: "surname" }],
      }),
    ).rejects.toThrow(/supervisionStaff, locations/);
  });
});

describe("key lifecycle", () => {
  test("mints once and reuses the keys across searches", async () => {
    const { client, fetchImpl } = makeClient();

    await client.multiSearch({
      searches: [{ collection: "locations", q: "a", query_by: "name" }],
    });
    await client.multiSearch({
      searches: [{ collection: "locations", q: "b", query_by: "name" }],
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("concurrent callers share one in-flight mint", async () => {
    const { client, fetchImpl } = makeClient();

    await Promise.all([
      client.multiSearch({
        searches: [{ collection: "locations", q: "a", query_by: "name" }],
      }),
      client.multiSearch({
        searches: [{ collection: "locations", q: "b", query_by: "name" }],
      }),
    ]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("reset forces a re-mint and rebuilds the underlying client", async () => {
    const { client, fetchImpl } = makeClient();

    await client.getScopedKeys();
    client.reset();
    await client.getScopedKeys();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test("exposes the whole key map", async () => {
    const { client } = makeClient();

    await expect(client.getScopedKeys()).resolves.toEqual({
      supervisionStaff: "key-supervision-staff",
      locations: "key-locations",
    });
  });

  test("builds the underlying client against the host the mint returned", async () => {
    const { client } = makeClient();

    await client.multiSearch({
      searches: [{ collection: "locations", q: "a", query_by: "name" }],
    });

    expect(mockCreateTypesenseClient).toHaveBeenCalledWith(
      expect.objectContaining({ host: "http://typesense.test:8108" }),
    );
  });

  test("surfaces a failed mint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      text: () => Promise.resolve("User has no externalId"),
    });

    const client = createScopedTypesenseClient({
      mintEndpoint: () => "http://staff-server.test/api/US_XX/mint",
      getMintRequestBody: () => ({ system: "SUPERVISION" }),
      getAuthHeader: () => null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.getScopedKeys()).rejects.toThrow(/422/);
  });
});
