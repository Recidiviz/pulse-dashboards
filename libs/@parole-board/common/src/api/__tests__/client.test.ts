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

import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import { MockInstance } from "vitest";

import { calendarApiConfig } from "../../fixtures";
import { createCalendarTrpc } from "../client";
import { getCalendarErrorCode } from "../errors";

const BACKEND_URL = "https://modules.example.test";

let fetchSpy: MockInstance<typeof fetch>;

function batchResponse(data: unknown): Response {
  return new Response(
    JSON.stringify([{ result: { data: superjson.serialize(data) } }]),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function requestOf(call: Parameters<typeof fetch>): {
  url: string;
  authorization: string | null;
  stateCode: string | null;
} {
  const [input, init] = call;
  const headers = new Headers(init?.headers);
  return {
    url: String(input),
    authorization: headers.get("Authorization"),
    stateCode: headers.get("StateCode"),
  };
}

beforeEach(() => {
  vi.stubEnv("VITE_MODULE_BACKEND_URL", BACKEND_URL);
  fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      Promise.resolve(batchResponse(calendarApiConfig)),
    );
});

describe("createCalendarTrpc", () => {
  it("sends the token and the state code to the Calendar module at VITE_MODULE_BACKEND_URL", async () => {
    const { client } = createCalendarTrpc({
      getToken: () => Promise.resolve("token-a"),
      getStateCode: () => "US_CO",
      queryClient: new QueryClient(),
    });

    const config = await client.admin.config.get.query();

    expect(config).toEqual(calendarApiConfig);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const { url, authorization, stateCode } = requestOf(fetchSpy.mock.calls[0]);
    expect(
      url.startsWith(
        `${BACKEND_URL}/Calendar.usCo.paroleBoard.admin.config.get`,
      ),
    ).toBe(true);
    expect(authorization).toBe("Bearer token-a");
    expect(stateCode).toBe("US_CO");
  });

  it("reads the token again for each request", async () => {
    const getToken = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("token-a")
      .mockResolvedValueOnce("token-b");
    const { client } = createCalendarTrpc({
      getToken,
      getStateCode: () => "US_CO",
      queryClient: new QueryClient(),
    });

    await client.admin.config.get.query();
    await client.admin.config.get.query();

    expect(requestOf(fetchSpy.mock.calls[1]).authorization).toBe(
      "Bearer token-b",
    );
  });

  it.each([
    ["undefined", () => undefined],
    ["an empty string", () => Promise.resolve("")],
  ])(
    "fails without sending a request when the token is %s",
    async (_, getToken) => {
      const { client } = createCalendarTrpc({
        getToken,
        getStateCode: () => "US_CO",
        queryClient: new QueryClient(),
      });

      await expect(client.admin.config.get.query()).rejects.toThrow(
        "The calendar needs a signed-in user",
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["undefined", () => undefined],
    ["an empty string", () => ""],
  ])(
    "fails without sending a request when the state code is %s",
    async (_, getStateCode) => {
      const { client } = createCalendarTrpc({
        getToken: () => Promise.resolve("token-a"),
        getStateCode,
        queryClient: new QueryClient(),
      });

      await expect(client.admin.config.get.query()).rejects.toThrow(
        "The calendar needs a state code",
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("fails without reading the token or sending a request when VITE_MODULE_BACKEND_URL is empty", async () => {
    vi.stubEnv("VITE_MODULE_BACKEND_URL", "");
    const getToken = vi.fn(() => Promise.resolve("token-a"));
    const { client } = createCalendarTrpc({
      getToken,
      getStateCode: () => "US_CO",
      queryClient: new QueryClient(),
    });

    const failure = client.admin.config.get.query();

    await expect(failure).rejects.toThrow("VITE_MODULE_BACKEND_URL isn't set");
    expect(getToken).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("gives server errors their tRPC code", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            error: superjson.serialize({
              message: "This hearing was just changed by Editor A.",
              code: -32009,
              data: { code: "CONFLICT", httpStatus: 409 },
            }),
          },
        ]),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );
    const { client } = createCalendarTrpc({
      getToken: () => Promise.resolve("token-a"),
      getStateCode: () => "US_CO",
      queryClient: new QueryClient(),
    });

    const error = await client.admin.entries.cancel
      .mutate({ entryId: "entry-1", expectedVersion: 1 })
      .catch((e: unknown) => e);

    expect(getCalendarErrorCode(error)).toBe("CONFLICT");
  });

  it("builds the options proxy on the QueryClient it was given", () => {
    const queryClient = new QueryClient();
    const calendarTrpc = createCalendarTrpc({
      getToken: () => Promise.resolve("token-a"),
      getStateCode: () => "US_CO",
      queryClient,
    });

    expect(
      calendarTrpc.querier.admin.months.get.queryKey({ year: 2026, month: 11 }),
    ).toEqual([
      ["admin", "months", "get"],
      { input: { year: 2026, month: 11 }, type: "query" },
    ]);
    expect(calendarTrpc.queryClient).toBe(queryClient);
  });
});
