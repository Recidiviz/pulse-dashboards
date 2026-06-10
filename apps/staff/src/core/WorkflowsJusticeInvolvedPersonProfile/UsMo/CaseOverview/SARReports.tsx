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

import "react-loading-skeleton/dist/skeleton.css";

import { ErrorBoundary } from "@sentry/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import React, { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../../components/StoreProvider";
import { SARReportsSection } from "./SARReportsSection";
import { RowLabel, RowWithAction, Section, SectionHeading } from "./styles";

type SARReportsProps = {
  /** Client's `externalId` — the SAR row's `clientId`. Globally unique across
   * states (PK of the `Client` table), so the SAR-by-client query needs no
   * separate `stateCode` parameter; state scoping is implicit in the
   * sentencing-client's per-tenant database segmentation. */
  clientExternalId: string;
};

/**
 * Suspense-query hook for the current client's SARs.
 *
 * Calls `sentencingStore.apiClient.getSARsByClient` directly — there is no
 * `SARStore` indirection because react-query already provides everything a
 * store-layer cache would (per-`clientExternalId` memoization via `queryKey`,
 * retries, GC, dedupe of concurrent renders).
 */
function useSARsForClient(clientExternalId: string) {
  const { sentencingStore } = useRootStore();

  return useSuspenseQuery({
    queryKey: ["sarReportsByClient", clientExternalId] as const,
    queryFn: () => sentencingStore.apiClient.getSARsByClient(clientExternalId),
  });
}

/**
 * Stable fallback for the Sentry `ErrorBoundary` around `SARReports`. Sentry's
 * `FallbackRender` type requires a `ReactElement`, so we render an
 * always-hidden `<span>` instead of `null`. Defined at module scope so the
 * component identity stays stable across renders.
 */
function nullFallback(): React.ReactElement {
  return <span hidden aria-hidden="true" />;
}

/**
 * Loading placeholder for the Reports section. Renders inside the same
 * `<Section>` primitive the real section uses so it sits inside the
 * `CardFrame` divider rule (`& > section + section { border-top }`)
 * identically to the loaded state. Two row placeholders approximate the
 * typical 1–2 SARs we see per client.
 */
function SARReportsSkeleton(): React.ReactElement {
  return (
    <Section
      aria-busy="true"
      aria-label="Loading reports"
      data-testid="sar-reports-skeleton"
    >
      <SectionHeading>Reports</SectionHeading>
      <RowWithAction>
        <RowLabel>
          <Skeleton width={220} />
        </RowLabel>
        <Skeleton width={110} />
      </RowWithAction>
      <RowWithAction>
        <RowLabel>
          <Skeleton width={200} />
        </RowLabel>
        <Skeleton width={110} />
      </RowWithAction>
    </Section>
  );
}

/**
 * Inner component that suspends on the SAR fetch. Split out from `SARReports`
 * so the FV gate stays outside the `<Suspense>` boundary — when the variant
 * is off this never mounts, so no hook runs and no fetch is kicked off.
 */
const SARReportsContent = function SARReportsContent({
  clientExternalId,
}: SARReportsProps): React.ReactElement | null {
  const { data: sars } = useSARsForClient(clientExternalId);

  // Empty list still renders nothing — the section is invisible unless there
  // is at least one SAR row, matching Figma.
  if (sars.length === 0) return null;

  return <SARReportsSection sars={sars} />;
};

/**
 * Container for the SAR Reports rows on the US_MO Case Overview card.
 *
 * Responsibilities:
 * - Gate the section on the `usMoSarInClientsPage` feature variant. With the
 *   variant off, this returns null and nothing is fetched.
 * - Suspend on `sentencingStore.apiClient.getSARsByClient` via react-query
 *   (cached by `clientExternalId`), rendering a skeleton placeholder while
 *   the fetch is pending.
 * - Catch tRPC errors via a Sentry `ErrorBoundary` and render `null`. Sentry
 *   automatically reports the captured error; the Reports section is
 *   supplemental, and a failure here must not take down the rest of the
 *   Case Overview.
 */
export const SARReports = observer(function SARReports({
  clientExternalId,
}: SARReportsProps): React.ReactElement | null {
  const { usMoSarInClientsPage } = useFeatureVariants();
  if (!usMoSarInClientsPage) return null;

  return (
    // Sentry's `FallbackRender` requires a `ReactElement`; render a
    // hidden no-op element so nothing visible appears. Sentry still
    // captures the boundary-caught error to its dashboard. Defined at module
    // scope (see `nullFallback` above) to keep the component identity stable
    // across renders.
    <ErrorBoundary fallback={nullFallback}>
      <Suspense fallback={<SARReportsSkeleton />}>
        <SARReportsContent clientExternalId={clientExternalId} />
      </Suspense>
    </ErrorBoundary>
  );
});

export default SARReports;
