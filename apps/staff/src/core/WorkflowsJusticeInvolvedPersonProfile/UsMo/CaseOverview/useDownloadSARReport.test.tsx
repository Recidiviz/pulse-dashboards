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

import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import {
  downloadSARPdf,
  loadSARInsight,
  SARByClient,
} from "~sentencing-client";

import { useRootStore } from "../../../../components/StoreProvider";
import { useDownloadSARReport } from "./useDownloadSARReport";

vi.mock("../../../../components/StoreProvider");
vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));
// Override only the two helpers; keep the rest of the lib real so the
// transitive RootStore import graph (routing paths, etc.) still resolves.
vi.mock("~sentencing-client", async (importActual) => ({
  ...(await importActual<typeof import("~sentencing-client")>()),
  downloadSARPdf: vi.fn(),
  loadSARInsight: vi.fn(),
}));

const useRootStoreMock = useRootStore as Mock;
const downloadSARPdfMock = downloadSARPdf as Mock;
const loadSARInsightMock = loadSARInsight as Mock;
const captureExceptionMock = Sentry.captureException as Mock;

const getSARDetails = vi.fn();
const trackSARDownloadReportClicked = vi.fn();
const trackSARClientsPageBuilderLinkClicked = vi.fn();

const sar = {
  id: "sar-1",
  staff: { pseudonymizedId: "officer-pseudo-1" },
} as SARByClient;

/** Fresh QueryClient per hook instance so each test is isolated. */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useDownloadSARReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSARDetails.mockResolvedValue({ id: "sar-1", client: { fullName: "X" } });
    loadSARInsightMock.mockResolvedValue(null);
    downloadSARPdfMock.mockResolvedValue(undefined);
    useRootStoreMock.mockReturnValue({
      sentencingStore: { apiClient: { getSARDetails } },
      analyticsStore: {
        trackSARDownloadReportClicked,
        trackSARClientsPageBuilderLinkClicked,
      },
    });
  });

  it("prefetches once on hover and the click reuses the warmed cache entry", async () => {
    const { result } = renderHook(() => useDownloadSARReport(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.prefetchSAR(sar));
    await waitFor(() => expect(getSARDetails).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.downloadSAR(sar);
    });

    // Reused, not refetched.
    expect(getSARDetails).toHaveBeenCalledTimes(1);
    expect(loadSARInsightMock).toHaveBeenCalledTimes(1);
    expect(downloadSARPdfMock).toHaveBeenCalledTimes(1);
  });

  it("tracks the download click with the SAR's staff + id", async () => {
    const { result } = renderHook(() => useDownloadSARReport(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.downloadSAR(sar);
    });

    expect(trackSARDownloadReportClicked).toHaveBeenCalledWith({
      viewedBy: "officer-pseudo-1",
      caseId: "sar-1",
    });
  });

  it("tracks the builder-link click with the SAR's staff + id", () => {
    const { result } = renderHook(() => useDownloadSARReport(), {
      wrapper: createWrapper(),
    });

    result.current.trackBuilderLinkClick(sar);

    expect(trackSARClientsPageBuilderLinkClicked).toHaveBeenCalledWith({
      viewedBy: "officer-pseudo-1",
      caseId: "sar-1",
    });
  });

  it("captures fetch errors to Sentry, skips the download, and resolves", async () => {
    getSARDetails.mockRejectedValue(new Error("trpc kablooie"));

    const { result } = renderHook(() => useDownloadSARReport(), {
      wrapper: createWrapper(),
    });

    // Resolves (never rejects) so the caller's in-flight lock always clears.
    await act(async () => {
      await result.current.downloadSAR(sar);
    });

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(downloadSARPdfMock).not.toHaveBeenCalled();
  });
});
