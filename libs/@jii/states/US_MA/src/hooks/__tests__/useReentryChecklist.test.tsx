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
import { freeze } from "timekeeper";

import { useRootStore } from "~@jii/data";

import { useReentryChecklist } from "../useReentryChecklist";

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

const QUERY_KEY = ["reentry-checklist"];

const fetchSavedItems = vi.fn();
const updateItem = vi.fn();

const neverFinishes = () => new Promise(() => undefined);

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  queryClient.setQueryData(QUERY_KEY, [
    { itemId: "HOUSING_PLAN_AGREEMENT", checked: false },
    { itemId: "BACKUP_HOUSING", checked: true },
  ]);

  updateItem.mockResolvedValue({});

  vi.mocked(useRootStore).mockReturnValue({
    apiClient: {
      trpc: {
        state: {
          usMa: {
            updateReentryChecklistItemState: { mutate: updateItem },
          },
        },
      },
      trpcQuerier: {
        state: {
          usMa: {
            getReentryChecklistItemStates: {
              queryOptions: vi.fn().mockReturnValue({
                queryKey: QUERY_KEY,
                queryFn: fetchSavedItems,
              }),
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

const render = () => renderHook(() => useReentryChecklist(), { wrapper });

const isChecked = (
  result: { current: ReturnType<typeof useReentryChecklist> },
  id: string,
) => result.current.items.find((item) => item.id === id)?.checked;

test("saves the change", async () => {
  const { result } = render();

  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));

  await waitFor(() =>
    expect(updateItem).toHaveBeenCalledWith({
      pseudonymizedId: "test-pseudo-id",
      itemId: "HOUSING_PLAN_AGREEMENT",
      checked: true,
    }),
  );
});

test("shows clicks right away, even several in a row", async () => {
  updateItem.mockImplementation(neverFinishes);
  const { result } = render();

  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
  act(() => result.current.setChecked("BACKUP_HOUSING", false));

  await waitFor(() => {
    expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(true);
    expect(isChecked(result, "BACKUP_HOUSING")).toBe(false);
  });
});

test("shows the latest of several pending clicks on the same item", async () => {
  updateItem.mockImplementation(neverFinishes);
  const { result } = render();

  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
  // The test setup freezes the clock, so move it forward to give the second
  // click a later submittedAt. setupTests re-freezes it before each test.
  freeze(new Date(Date.now() + 1));
  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", false));

  await waitFor(() => expect(updateItem).toHaveBeenCalled());
  expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(false);
});

test("keeps showing a saved click until the refetch arrives", async () => {
  fetchSavedItems.mockImplementation(neverFinishes);
  const { result } = render();

  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
  await waitFor(() => expect(fetchSavedItems).toHaveBeenCalled());

  expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(true);
});

test("a failed save is reported, and the item goes back", async () => {
  updateItem.mockRejectedValue(new Error("Save failed"));
  const { result } = render();

  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));

  await waitFor(() => expect(captureException).toHaveBeenCalled());
  await waitFor(() =>
    expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(false),
  );
});

test("sends one save at a time", async () => {
  updateItem.mockImplementation(neverFinishes);
  const { result } = render();

  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
  act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", false));

  await waitFor(() => expect(updateItem).toHaveBeenCalled());
  expect(updateItem).toHaveBeenCalledTimes(1);
});

describe("back-to-back clicks", () => {
  // Stands in for the database: saves write to it and refetches read from it,
  // so these tests check where things end up and not just what was sent.
  let server: Record<string, boolean>;
  const toRows = () =>
    Object.entries(server).map(([itemId, checked]) => ({ itemId, checked }));
  const saveToServer = async ({
    itemId,
    checked,
  }: {
    itemId: string;
    checked: boolean;
  }) => {
    server[itemId] = checked;
    return { itemId, checked };
  };

  const waitUntilIdle = async () => {
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  };

  beforeEach(() => {
    server = {
      HOUSING_PLAN_AGREEMENT: false,
      BACKUP_HOUSING: false,
      FINALIZED_HOUSING: false,
    };
    queryClient.setQueryData(QUERY_KEY, toRows());
    fetchSavedItems.mockImplementation(async () => toRows());
    updateItem.mockImplementation(saveToServer);
  });

  test("on the same item, ends on the last successful click when one in the middle fails", async () => {
    // The first save succeeds, the second fails, and any after that succeed.
    updateItem
      .mockImplementationOnce(saveToServer)
      .mockRejectedValueOnce(new Error("Save failed"));
    const { result } = render();

    act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
    act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", false));
    act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
    await waitUntilIdle();

    expect(updateItem.mock.calls.map(([change]) => change.checked)).toEqual([
      true,
      false,
      true,
    ]);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(server["HOUSING_PLAN_AGREEMENT"]).toBe(true);
    expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(true);
  });

  test("keeps showing a later click when an earlier save's refetch lands", async () => {
    // Save 1 goes through; save 2 stays in flight.
    updateItem
      .mockImplementationOnce(saveToServer)
      .mockImplementationOnce(neverFinishes);
    const { result } = render();

    act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
    act(() => result.current.setChecked("BACKUP_HOUSING", true));
    // Only save 2 left pending means save 1 and its refetch have finished.
    await waitFor(() => expect(queryClient.isMutating()).toBe(1));

    expect(server["HOUSING_PLAN_AGREEMENT"]).toBe(true);
    expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(true);
    expect(isChecked(result, "BACKUP_HOUSING")).toBe(true);
  });

  test("across items, still saves the clicks after one that fails", async () => {
    // The first save succeeds, the second fails, and any after that succeed.
    updateItem
      .mockImplementationOnce(saveToServer)
      .mockRejectedValueOnce(new Error("Save failed"));
    const { result } = render();

    act(() => result.current.setChecked("HOUSING_PLAN_AGREEMENT", true));
    act(() => result.current.setChecked("BACKUP_HOUSING", true));
    act(() => result.current.setChecked("FINALIZED_HOUSING", true));
    await waitUntilIdle();

    expect(updateItem).toHaveBeenCalledTimes(3);
    expect(server).toEqual({
      HOUSING_PLAN_AGREEMENT: true,
      BACKUP_HOUSING: false,
      FINALIZED_HOUSING: true,
    });
    expect(isChecked(result, "HOUSING_PLAN_AGREEMENT")).toBe(true);
    expect(isChecked(result, "BACKUP_HOUSING")).toBe(false);
    expect(isChecked(result, "FINALIZED_HOUSING")).toBe(true);
  });
});
