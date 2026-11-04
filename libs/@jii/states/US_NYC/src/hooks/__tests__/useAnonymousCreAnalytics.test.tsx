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
import { MemoryRouter, Route, Routes } from "react-router-dom";

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

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/new-york-city/abc/resources"]}>
      <Routes>
        <Route
          path="/:stateSlug/:personPseudoId/resources"
          element={<>{children}</>}
        />
      </Routes>
    </MemoryRouter>
  );
}

test("trackSearchQueryAnonymously logs via the server-side mutation with a searchSessionId and never the pseudoId", () => {
  const { result } = renderHook(() => useAnonymousCreAnalytics(), { wrapper });

  result.current.trackSearchQueryAnonymously("housing", 3);

  expect(logSearchQueryMutate).toHaveBeenCalledExactlyOnceWith({
    query: "housing",
    resultCount: 3,
    searchSessionId: expect.any(String),
  });

  const call = logSearchQueryMutate.mock.calls[0][0];
  expect(call).not.toHaveProperty("justiceInvolvedPersonPseudoId");
  // "abc" is this test's personPseudoId, from the wrapper's route - confirms it
  // never ends up anywhere in the mutation's input, not just that the named field
  // is absent.
  expect(JSON.stringify(call)).not.toContain("abc");
});

test("trackSearchQueryAnonymously reuses the same searchSessionId across multiple calls in one session", () => {
  const { result } = renderHook(() => useAnonymousCreAnalytics(), { wrapper });

  result.current.trackSearchQueryAnonymously("housing", 3);
  result.current.trackSearchQueryAnonymously("shelter", 1);

  const [firstCall, secondCall] = logSearchQueryMutate.mock.calls;
  expect(firstCall[0].searchSessionId).toBe(secondCall[0].searchSessionId);
});

test("trackSearchQueryAnonymously gets a fresh searchSessionId once sessionStorage is cleared", () => {
  const { result: first } = renderHook(() => useAnonymousCreAnalytics(), {
    wrapper,
  });
  first.current.trackSearchQueryAnonymously("housing", 3);
  const firstId = logSearchQueryMutate.mock.calls[0][0].searchSessionId;

  sessionStorage.clear();
  logSearchQueryMutate.mockClear();

  const { result: second } = renderHook(() => useAnonymousCreAnalytics(), {
    wrapper,
  });
  second.current.trackSearchQueryAnonymously("shelter", 1);
  const secondId = logSearchQueryMutate.mock.calls[0][0].searchSessionId;

  expect(secondId).not.toBe(firstId);
});

test("trackSearchQueryAnonymously reports a rejected mutation to Sentry instead of throwing", async () => {
  const error = new Error("network blip");
  logSearchQueryMutate.mockRejectedValue(error);
  const { result } = renderHook(() => useAnonymousCreAnalytics(), { wrapper });

  expect(() =>
    result.current.trackSearchQueryAnonymously("housing", 3),
  ).not.toThrow();

  await waitFor(() => {
    expect(captureException).toHaveBeenCalledExactlyOnceWith(error);
  });
});

test("only reads sessionStorage once per hook mount, even across re-renders", () => {
  const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
  const { rerender } = renderHook(() => useAnonymousCreAnalytics(), {
    wrapper,
  });

  const callsAfterMount = getItemSpy.mock.calls.length;
  rerender();
  rerender();

  expect(getItemSpy.mock.calls.length).toBe(callsAfterMount);
});

test("falls back to a working (if unpersisted) searchSessionId when sessionStorage throws", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("SecurityError: storage disabled");
  });

  const { result } = renderHook(() => useAnonymousCreAnalytics(), { wrapper });

  expect(() =>
    result.current.trackSearchQueryAnonymously("housing", 3),
  ).not.toThrow();
  expect(logSearchQueryMutate.mock.calls[0][0].searchSessionId).toEqual(
    expect.any(String),
  );
});
