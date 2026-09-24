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

import { ErrorBoundary, FallbackRender } from "@sentry/react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactElement, ReactNode, Suspense } from "react";

import { ErrorPageMainContent } from "~@jii/layout";
import { Loading } from "~design-system";

/**
 * Wraps a `useSuspenseQuery`-backed subtree with its own loading and error
 * states. Defaults to page-level fallbacks - pass your own for a widget-sized
 * boundary (e.g. a single card on a page).
 */
export function SuspenseQueryBoundary({
  children,
  loadingFallback = <Loading />,
  errorFallback = ErrorPageMainContent,
}: {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactElement | FallbackRender;
}) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary onReset={reset} fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
