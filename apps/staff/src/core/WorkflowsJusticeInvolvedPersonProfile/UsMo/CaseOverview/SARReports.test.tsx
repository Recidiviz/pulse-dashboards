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
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from "vitest";

import { SARByClient, SARsByClient } from "~sentencing-client";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../../components/StoreProvider";
import { SARReports } from "./SARReports";

vi.mock("../../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;

function makeSAR(overrides: Partial<SARByClient> = {}): SARByClient {
  return {
    id: "sar-1",
    externalId: "sar-ext-1",
    status: "InProgress",
    completionDate: null,
    courtDate: null,
    staff: { pseudonymizedId: "staff-1" },
    ...overrides,
  } as SARByClient;
}

type FakeRootStore = {
  sentencingStore: {
    apiClient: { getSARsByClient: Mock };
  };
};

/**
 * Build the minimal root-store stub the container reads. SARReports now calls
 * `sentencingStore.apiClient.getSARsByClient` directly (react-query owns the
 * cache via `useSuspenseQuery`), so this is the only surface to mock.
 */
function buildRootStore(
  getSARsByClient: Mock = vi.fn().mockResolvedValue([]),
): FakeRootStore {
  return { sentencingStore: { apiClient: { getSARsByClient } } };
}

/**
 * Wrap the component under test in a fresh `QueryClientProvider`. Each test
 * gets its own client (retry off, gc immediately) so suspense queries don't
 * leak cached state across tests and don't retry on rejection.
 */
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("SARReports", () => {
  beforeEach(() => {
    // Default: FV on, store returns empty list.
    useFeatureVariantsMock.mockReturnValue({ usMoSarInClientsPage: true });
    useRootStoreMock.mockReturnValue(buildRootStore());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when the feature variant is off, even with populated data", async () => {
    useFeatureVariantsMock.mockReturnValue({});
    const getSARsByClient = vi.fn().mockResolvedValue([makeSAR()]);
    useRootStoreMock.mockReturnValue(buildRootStore(getSARsByClient));

    const { container } = renderWithQueryClient(
      <SARReports clientExternalId="client-ext-1" />,
    );

    // Nothing rendered.
    expect(container.firstChild).toBeNull();
    // And the fetch is never kicked off — the FV gate sits outside the
    // Suspense boundary, so the inner content (with the useSuspenseQuery
    // call) never mounts.
    expect(getSARsByClient).not.toHaveBeenCalled();
  });

  test("returns null with the FV on but an empty SAR list", async () => {
    const getSARsByClient = vi.fn().mockResolvedValue([] as SARsByClient);
    useRootStoreMock.mockReturnValue(buildRootStore(getSARsByClient));

    const { container } = renderWithQueryClient(
      <SARReports clientExternalId="client-ext-1" />,
    );

    await waitFor(() => {
      expect(getSARsByClient).toHaveBeenCalled();
    });
    // Skeleton must clear after the suspense resolves.
    await waitFor(() => {
      expect(
        screen.queryByTestId("sar-reports-skeleton"),
      ).not.toBeInTheDocument();
    });
    expect(container.firstChild).toBeNull();
  });

  test("renders SARReportsSection when the FV is on and the list is populated", async () => {
    const sars: SARsByClient = [
      makeSAR({ id: "s-1", status: "InProgress" }),
      makeSAR({ id: "s-2", status: "NotYetStarted" }),
    ];
    const getSARsByClient = vi.fn().mockResolvedValue(sars);
    useRootStoreMock.mockReturnValue(buildRootStore(getSARsByClient));

    renderWithQueryClient(<SARReports clientExternalId="client-ext-1" />);

    // The skeleton header also reads "Reports", so wait specifically for
    // a populated row before asserting the rest of the section.
    await waitFor(() => {
      expect(screen.getByText("SAR - In Progress")).toBeInTheDocument();
    });
    // After the suspense resolves the skeleton must be gone.
    expect(
      screen.queryByTestId("sar-reports-skeleton"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("SAR - Not yet started")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Go to SAR Builder" }),
    ).toHaveLength(2);
  });

  test("shows the skeleton placeholder while the fetch is pending", async () => {
    // Never-resolving promise: the suspense boundary should show the
    // skeleton fallback and hold off rendering the real section.
    const getSARsByClient = vi.fn().mockReturnValue(
      // Promise executor intentionally never resolves/rejects.
      new Promise<SARsByClient>(() => {
        // no-op: the suspense boundary stays in its pending state forever.
      }),
    );
    useRootStoreMock.mockReturnValue(buildRootStore(getSARsByClient));

    renderWithQueryClient(<SARReports clientExternalId="client-ext-1" />);

    await waitFor(() => {
      expect(getSARsByClient).toHaveBeenCalled();
    });
    // Skeleton is visible while suspended. The skeleton renders its own
    // "Reports" heading so the layout stays stable across suspend / resolve.
    expect(screen.getByTestId("sar-reports-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    // The real list rows are not yet in the DOM.
    expect(screen.queryByText("SAR - In Progress")).not.toBeInTheDocument();
  });

  test("calls getSARsByClient with the supplied clientExternalId", async () => {
    const getSARsByClient = vi.fn().mockResolvedValue([]);
    useRootStoreMock.mockReturnValue(buildRootStore(getSARsByClient));

    renderWithQueryClient(<SARReports clientExternalId="abc-123" />);

    await waitFor(() => {
      expect(getSARsByClient).toHaveBeenCalledWith("abc-123");
    });
  });

  test("silently absorbs fetch errors (no throw, no render)", async () => {
    // Suspense queries on rejected promises throw into the surrounding
    // ErrorBoundary; the Sentry boundary's `fallback={() => null}` renders
    // nothing. React 18 logs the boundary-caught error to the console — silence
    // it here so the test output stays clean.
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {
        // Swallow React's "uncaught error" logs from the boundary fallback.
      });
    const getSARsByClient = vi
      .fn()
      .mockRejectedValue(new Error("trpc kablooie"));
    useRootStoreMock.mockReturnValue(buildRootStore(getSARsByClient));

    renderWithQueryClient(<SARReports clientExternalId="client-ext-1" />);

    await waitFor(() => {
      expect(getSARsByClient).toHaveBeenCalled();
    });
    // The ErrorBoundary swallows the failure: neither the skeleton nor the
    // real section is in the DOM. Sentry's FallbackRender type requires a
    // ReactElement so we render an `aria-hidden`/`hidden` placeholder; assert
    // by the absence of section content rather than `container.firstChild`.
    await waitFor(() => {
      expect(
        screen.queryByTestId("sar-reports-skeleton"),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    expect(screen.queryByText(/SAR - /)).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
