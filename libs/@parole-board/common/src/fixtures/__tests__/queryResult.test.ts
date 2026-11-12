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

import { action } from "storybook/actions";

import {
  failedQuery,
  infiniteQueryResult,
  loadedQueryResult,
  mutationResult,
  pendingQueryResult,
  queryResult,
  suspendedQuery,
} from "../queryResult";

vi.mock("storybook/actions", () => ({ action: vi.fn() }));

describe("query results", () => {
  test("queryResult is a success holding the data", async () => {
    const result = queryResult(["2026-09"]);

    expect(result).toMatchObject({
      status: "success",
      data: ["2026-09"],
      error: null,
      isSuccess: true,
      isPending: false,
      isLoading: false,
      fetchStatus: "idle",
    });
    await expect(result.refetch()).resolves.toBe(result);
  });

  test("loadedQueryResult is the same success, typed for useQuery", () => {
    expect(loadedQueryResult(["2026-09"])).toMatchObject({
      status: "success",
      data: ["2026-09"],
      isPlaceholderData: false,
    });
  });

  test("pendingQueryResult is waiting for its first data", () => {
    expect(pendingQueryResult()).toMatchObject({
      status: "pending",
      data: undefined,
      isPending: true,
      isSuccess: false,
      fetchStatus: "fetching",
    });
  });

  test("infiniteQueryResult holds the pages and logs page loads", async () => {
    vi.mocked(action).mockImplementation(() => vi.fn());
    const result = infiniteQueryResult([["2026-09"], ["2026-11"]], {
      hasNextPage: true,
    });

    expect(result).toMatchObject({
      status: "success",
      data: { pages: [["2026-09"], ["2026-11"]] },
      hasNextPage: true,
      hasPreviousPage: false,
      isFetchingNextPage: false,
    });
    await expect(result.fetchNextPage()).resolves.toBe(result);
    expect(action).toHaveBeenCalledWith("fetchNextPage");
  });

  test("suspendedQuery throws the same never-settling promise every time", () => {
    const thrown = () => {
      try {
        suspendedQuery();
      } catch (value) {
        return value;
      }
      throw new Error("suspendedQuery returned");
    };

    const first = thrown();
    expect(first).toBeInstanceOf(Promise);
    expect(thrown()).toBe(first);
  });

  test("failedQuery throws its error", () => {
    const error = new Error("boom");

    expect(() => failedQuery(error)).toThrow(error);
  });
});

describe("mutationResult", () => {
  beforeEach(() => {
    vi.mocked(action).mockImplementation(() => vi.fn());
  });

  test("is idle by default", () => {
    expect(mutationResult()).toMatchObject({
      status: "idle",
      isIdle: true,
      isPending: false,
      error: null,
    });
  });

  test("shows the pending state", () => {
    expect(mutationResult({ isPending: true })).toMatchObject({
      status: "pending",
      isPending: true,
    });
  });

  test("shows the error state, which wins over isPending", () => {
    const error = new Error("boom");

    expect(mutationResult({ isPending: true, error })).toMatchObject({
      status: "error",
      error,
      isError: true,
      isPending: false,
      failureReason: error,
    });
  });

  test("mutate and mutateAsync log their variables as actions", () => {
    const mutateLog = vi.fn();
    const mutateAsyncLog = vi.fn();
    vi.mocked(action).mockImplementation((name) =>
      name === "mutateAsync" ? mutateAsyncLog : mutateLog,
    );
    const result = mutationResult<unknown, Error, { month: string }>();

    result.mutate({ month: "2026-09" });
    void result.mutateAsync({ month: "2026-10" });

    expect(mutateLog).toHaveBeenCalledWith({ month: "2026-09" });
    expect(mutateAsyncLog).toHaveBeenCalledWith({ month: "2026-10" });
  });
});
