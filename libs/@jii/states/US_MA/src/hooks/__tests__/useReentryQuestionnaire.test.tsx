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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Suspense } from "react";

import { useRootStore } from "~@jii/data";

import { useReentryQuestionnaire } from "../useReentryQuestionnaire";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

vi.mock("react-router-typesafe-routes/dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useTypedParams: () => ({ personPseudoId: "test-pseudo-id" }),
}));

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal()),
  captureException: vi.fn(),
}));

const QUERY_KEY = ["reentry-questionnaire"];

const upsertAnswers = vi.fn();

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  upsertAnswers.mockReset().mockResolvedValue({});

  vi.mocked(captureException).mockClear();

  vi.mocked(useRootStore).mockReturnValue({
    apiClient: {
      trpc: {
        state: {
          usMa: {
            upsertReentryQuestionnaireAnswers: { mutate: upsertAnswers },
          },
        },
      },
      trpcQuerier: {
        state: {
          usMa: {
            getReentryQuestionnaire: {
              queryOptions: vi
                .fn()
                .mockReturnValue({ queryKey: QUERY_KEY, queryFn: vi.fn() }),
            },
          },
        },
      },
    },
  } as unknown as ReturnType<typeof useRootStore>);
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

const render = () => renderHook(() => useReentryQuestionnaire(), { wrapper });

describe("reading", () => {
  test("with no record, returns no answers and NOT_STARTED", () => {
    queryClient.setQueryData(QUERY_KEY, null);
    const { result } = render();
    expect(result.current.questionnaire).toBeNull();
    expect(result.current.answers).toEqual({});
    expect(result.current.status).toBe("NOT_STARTED");
  });

  test("returns the record's saved answers and status", () => {
    queryClient.setQueryData(QUERY_KEY, {
      id: "record-id",
      completedAt: new Date(),
      answers: { HOUSING: "OWN_PLACE" },
    });
    const { result } = render();
    expect(result.current.answers).toEqual({ HOUSING: "OWN_PLACE" });
    expect(result.current.status).toBe("COMPLETED");
  });
});

describe("saving", () => {
  test("saves the answers, storing RADIO answers as strings", async () => {
    queryClient.setQueryData(QUERY_KEY, {
      id: "record-id",
      completedAt: null,
      answers: {},
    });
    const { result } = render();

    act(() =>
      result.current.save({
        answers: { HOUSING: ["FAMILY"], TRANSPORTATION: ["BIKE", "OWN_CAR"] },
        isCompleted: false,
      }),
    );

    await waitFor(() =>
      expect(upsertAnswers).toHaveBeenCalledWith({
        pseudonymizedId: "test-pseudo-id",
        answers: { HOUSING: "FAMILY", TRANSPORTATION: ["BIKE", "OWN_CAR"] },
        isCompleted: false,
      }),
    );
  });

  test("a failed save is reported, without running onSuccess", async () => {
    queryClient.setQueryData(QUERY_KEY, {
      id: "record-id",
      completedAt: null,
      answers: {},
    });
    upsertAnswers.mockRejectedValueOnce(new Error("Save failed"));
    const onSuccess = vi.fn();
    const { result } = render();

    act(() =>
      result.current.save(
        { answers: { HOUSING: ["FAMILY"] }, isCompleted: false },
        { onSuccess },
      ),
    );

    await waitFor(() => expect(captureException).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
