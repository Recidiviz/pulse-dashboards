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

import { captureException } from "@sentry/react";
import { renderHook, waitFor } from "@testing-library/react";

import { useRootStore } from "~@jii/data";

import { useAnonymousCreAnalytics } from "../useAnonymousCreAnalytics";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
}));

const logSearchQueryMutate = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  logSearchQueryMutate.mockReset().mockResolvedValue({ success: true });
  vi.mocked(captureException).mockClear();

  vi.mocked(useRootStore).mockReturnValue({
    apiClient: {
      trpc: {
        resident: {
          resources: {
            logSearchQueryAnonymously: { mutate: logSearchQueryMutate },
          },
        },
      },
    },
  } as unknown as ReturnType<typeof useRootStore>);
});

test("trackSearchQueryAnonymously logs via the server-side mutation", () => {
  const { result } = renderHook(() => useAnonymousCreAnalytics());

  result.current.trackSearchQueryAnonymously("sober", 3);

  expect(logSearchQueryMutate).toHaveBeenCalledExactlyOnceWith({
    query: "sober",
    resultCount: 3,
    searchSessionId: expect.any(String),
  });
});

test("gets a fresh anonymous session id once sessionStorage is cleared", () => {
  const { result: first } = renderHook(() => useAnonymousCreAnalytics());
  first.current.trackSearchQueryAnonymously("sober", 3);
  const firstId = logSearchQueryMutate.mock.calls[0][0].searchSessionId;

  sessionStorage.clear();
  logSearchQueryMutate.mockClear();

  const { result: second } = renderHook(() => useAnonymousCreAnalytics());
  second.current.trackSearchQueryAnonymously("shelter", 1);
  const secondId = logSearchQueryMutate.mock.calls[0][0].searchSessionId;

  expect(secondId).not.toBe(firstId);
});

test("reports a rejected mutation to Sentry instead of throwing", async () => {
  const error = new Error("network blip");
  logSearchQueryMutate.mockRejectedValue(error);
  const { result } = renderHook(() => useAnonymousCreAnalytics());

  expect(() =>
    result.current.trackSearchQueryAnonymously("sober", 3),
  ).not.toThrow();

  await waitFor(() => {
    expect(captureException).toHaveBeenCalledExactlyOnceWith(error);
  });
});

test("falls back to a working (if unpersisted) session id when sessionStorage throws", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("SecurityError: storage disabled");
  });

  const { result } = renderHook(() => useAnonymousCreAnalytics());

  expect(() =>
    result.current.trackSearchQueryAnonymously("sober", 3),
  ).not.toThrow();
  expect(logSearchQueryMutate.mock.calls[0][0].searchSessionId).toEqual(
    expect.any(String),
  );
});
