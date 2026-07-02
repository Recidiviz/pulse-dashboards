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
import { useQueryClient } from "@tanstack/react-query";

import {
  downloadSARPdf,
  loadSARInsight,
  SARByClient,
} from "~sentencing-client";

import { useRootStore } from "../../../../components/StoreProvider";

/** Reuse a warmed entry for a few minutes so a hover prefetch is consumed by
 * the click rather than refetched. */
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Drives the row actions on the US_MO Case Overview SAR rows and owns all of
 * their analytics, so the container can stay free of `analyticsStore` access.
 *
 * The full SAR (`getSARDetails`) plus its Historical Outcome insight
 * (`loadSARInsight`) are fetched together into a single react-query cache entry
 * keyed by `sarId`, so a **hover** prefetch warms exactly what the **click**
 * consumes. Both handlers hit the same entry via `ensureQueryData`; the only
 * difference is hover ignores the result while click awaits it and renders the
 * PDF through the shared `downloadSARPdf` (identical output to the SAR Summary
 * page's Download button).
 *
 * The per-row in-flight lock lives in `SARReportAction`, not here: a single
 * shared `downloadingId` would be overwritten the moment a second row was
 * clicked, so each row owns its own lock around the awaited `downloadSAR`.
 */
export function useDownloadSARReport() {
  const { sentencingStore, analyticsStore, userStore } = useRootStore();
  const queryClient = useQueryClient();

  const queryOptions = (sar: SARByClient) => ({
    queryKey: ["sarDownloadData", sar.id] as const,
    queryFn: async () => {
      const { apiClient } = sentencingStore;
      const details = await apiClient.getSARDetails(sar.id);
      const insight = await loadSARInsight(apiClient, details);
      return { sar: details, insight };
    },
    staleTime: STALE_TIME_MS,
  });

  /** Warm the cache on hover/focus. Best-effort: a failed prefetch is silent —
   * the error will surface on the actual click instead. */
  const prefetchSAR = (sar: SARByClient): void => {
    void queryClient.ensureQueryData(queryOptions(sar)).catch(() => undefined);
  };

  /** Render + download the SAR PDF on click, reusing the prefetched entry.
   * Errors are reported to Sentry and swallowed; the caller's in-flight lock
   * clears regardless because this resolves either way. */
  const downloadSAR = async (sar: SARByClient): Promise<void> => {
    analyticsStore.trackSARDownloadReportClicked({
      viewedBy: sar.staff?.pseudonymizedId,
      caseId: sar.id,
    });
    try {
      const { sar: details, insight } = await queryClient.ensureQueryData(
        queryOptions(sar),
      );
      // TODO(OBT-29467): remove spread once import skips manually-updated SARs
      const showImported =
        userStore.activeFeatureVariants.SARImportEmploymentRecords;
      const sarForPdf = showImported
        ? details
        : {
            ...details,
            employmentHistories: details.employmentHistories.filter(
              (h) => !h.importedFromDOC,
            ),
          };
      await downloadSARPdf(sarForPdf, userStore.activeFeatureVariants, insight);
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  /** Track a "Go to SAR Builder" click on a not-yet-archived row. The link
   * itself does the navigation; this only records the intent, kept here so all
   * Reports-section analytics live in one place alongside the download event. */
  const trackBuilderLinkClick = (sar: SARByClient): void => {
    analyticsStore.trackSARClientsPageBuilderLinkClicked({
      viewedBy: sar.staff?.pseudonymizedId,
      caseId: sar.id,
    });
  };

  return { prefetchSAR, downloadSAR, trackBuilderLinkClick };
}
