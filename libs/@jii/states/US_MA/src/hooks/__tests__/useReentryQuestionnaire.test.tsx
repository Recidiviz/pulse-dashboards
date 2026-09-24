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
import { renderHook } from "@testing-library/react";
import { Suspense } from "react";

import { useReentryQuestionnaire } from "../useReentryQuestionnaire";

const QUERY_KEY = ["stub-reentry-questionnaire"];

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

test("status is NOT_STARTED when there is no record", () => {
  queryClient.setQueryData(QUERY_KEY, null);

  const { result } = renderHook(() => useReentryQuestionnaire(), { wrapper });

  expect(result.current.questionnaire).toBeNull();
  expect(result.current.status).toBe("NOT_STARTED");
});

test("status is IN_PROGRESS when answers exist but completedAt doesn't", () => {
  queryClient.setQueryData(QUERY_KEY, {
    completedAt: null,
    answers: { housing: "OWN_PLACE" },
  });

  const { result } = renderHook(() => useReentryQuestionnaire(), { wrapper });

  expect(result.current.status).toBe("IN_PROGRESS");
});

test("status is COMPLETED when completedAt is set", () => {
  queryClient.setQueryData(QUERY_KEY, {
    completedAt: new Date(),
    answers: { housing: "OWN_PLACE" },
  });

  const { result } = renderHook(() => useReentryQuestionnaire(), { wrapper });

  expect(result.current.status).toBe("COMPLETED");
});

test("getAnswer reads from the current record's answers", () => {
  queryClient.setQueryData(QUERY_KEY, {
    completedAt: null,
    answers: { housing: "OWN_PLACE" },
  });

  const { result } = renderHook(() => useReentryQuestionnaire(), { wrapper });

  expect(result.current.getAnswer("housing")).toBe("OWN_PLACE");
  expect(result.current.getAnswer("transportation")).toBeUndefined();
});

test("getAnswer returns undefined for every question when there is no record", () => {
  queryClient.setQueryData(QUERY_KEY, null);

  const { result } = renderHook(() => useReentryQuestionnaire(), { wrapper });

  expect(result.current.getAnswer("housing")).toBeUndefined();
});
