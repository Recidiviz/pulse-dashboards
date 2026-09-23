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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { ReactNode } from "react";
import superjson from "superjson";

import { DataAPI, useResidentsContext } from "~@jii/data";
import { findStateSchema } from "~@jii/schemas";
import type { JiiResidentAppRouter } from "~@jii/trpc-types";

import { useResidentDataQuery } from "./useResidentDataQuery";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@jii/data")>()),
  useResidentsContext: vi.fn(),
}));

vi.mock("~@jii/schemas", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@jii/schemas")>()),
  findStateSchema: vi.fn(),
}));

const PSEUDO_ID = "test-resident-id";
const TEST_STATE_CODE = "US_ND";

// the raw shape the server returns: stateSpecificData is unparsed JSON,
// with calendar dates still represented as strings
const rawResident = {
  pseudonymizedId: PSEUDO_ID,
  personExternalId: "ext-1",
  displayId: "display-1",
  stateSpecificData: {
    stateCode: TEST_STATE_CODE,
    paroleReviewDate: "2026-03-20",
  },
};

/**
 * Fake but realistic, in that it has replaced a date string with a Date object
 */
const mockParsedSSD = {
  stateCode: TEST_STATE_CODE,
  paroleReviewDate: new Date(2026, 2, 20),
};

let queryClient: QueryClient;
let trpcQuerier: DataAPI["trpcQuerier"];
/** every operation the client dispatched, so tests can assert on request input */
let dispatchedOps: Array<{ path: string; input: unknown }>;

const TRPC_URL = "http://test.local/trpc";

/**
 * Intercepts the actual network requests from the tRPC client
 * to record them and return a mock response.
 */
const stubFetch = async (input: RequestInfo | URL | string) => {
  const requestUrl = new URL(
    // the real type is wider, but we know this is what we're passing here
    input as string,
  );
  const serializedInput = requestUrl.searchParams.get("input");

  dispatchedOps.push({
    path: requestUrl.pathname.replace(`${new URL(TRPC_URL).pathname}/`, ""),
    input: serializedInput
      ? superjson.deserialize(JSON.parse(serializedInput))
      : undefined,
  });

  return new Response(
    JSON.stringify({ result: { data: superjson.serialize(rawResident) } }),
    { headers: { "content-type": "application/json" } },
  );
};

/**
 * Stubs findStateSchema with a schema whose parse behavior the test controls,
 * so we don't depend on any irrelevant state-specific behavior
 */
function mockSchema(parse: () => unknown) {
  const schema = { parse: vi.fn(parse) };
  vi.mocked(findStateSchema).mockReturnValue(
    schema as unknown as ReturnType<typeof findStateSchema>,
  );
  return schema;
}

beforeEach(() => {
  dispatchedOps = [];

  queryClient = new QueryClient({
    // disable retries and background refetches during tests for better isolation
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });

  trpcQuerier = createTRPCOptionsProxy<JiiResidentAppRouter>({
    client: createTRPCClient<JiiResidentAppRouter>({
      // httpLink rather than the httpBatchLink used in production, for simplicity
      links: [
        httpLink({ url: TRPC_URL, transformer: superjson, fetch: stubFetch }),
      ],
    }),
    queryClient,
  });

  // minimal stub of what these tests access from the context
  vi.mocked(useResidentsContext).mockReturnValue({
    residentsStore: { stateCode: TEST_STATE_CODE },
  } as unknown as ReturnType<typeof useResidentsContext>);
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const renderTarget = () =>
  renderHook(() => useResidentDataQuery(PSEUDO_ID, trpcQuerier), { wrapper });

describe("useResidentDataQuery", () => {
  test("requests the resident by pseudonymized ID", async () => {
    mockSchema(() => mockParsedSSD);

    const { result } = renderTarget();
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(dispatchedOps).toEqual([
      { path: "resident.getResident", input: { pseudonymizedId: PSEUDO_ID } },
    ]);
  });

  test("parses stateSpecificData with the schema for the resident's state", async () => {
    const schema = mockSchema(() => mockParsedSSD);

    const { result } = renderTarget();
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(findStateSchema).toHaveBeenCalledWith(TEST_STATE_CODE);
    expect(schema.parse).toHaveBeenCalledWith(rawResident.stateSpecificData);
    expect(result.current.data).toEqual({
      ...rawResident,
      stateSpecificData: mockParsedSSD,
    });
  });

  test("discards stateSpecificData when the state has no registered schema", async () => {
    vi.mocked(findStateSchema).mockReturnValue(undefined);

    const { result } = renderTarget();
    await waitFor(() => expect(result.current.data).toBeDefined());

    // the raw blob must not be passed through unvalidated
    expect(result.current.data).toEqual({
      ...rawResident,
      stateSpecificData: undefined,
    });
  });

  test("surfaces a schema parse failure as a query error", async () => {
    mockSchema(() => {
      throw new Error("invalid shape");
    });

    const { result } = renderTarget();
    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.error).toEqual(new Error("invalid shape"));
    expect(result.current.data).toBeUndefined();
  });

  test("does not re-parse when re-rendered with unchanged data", async () => {
    const schema = mockSchema(() => mockParsedSSD);

    const { result, rerender } = renderTarget();
    await waitFor(() => expect(result.current.data).toBeDefined());

    const callsAfterFirstRender = schema.parse.mock.calls.length;
    rerender();
    rerender();

    expect(schema.parse).toHaveBeenCalledTimes(callsAfterFirstRender);
  });
});
