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

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactNode, Suspense } from "react";

import { Button } from "~design-system";

import { StatusMessage } from "../components/StatusMessage";
import { useReportError } from "../host/ParoleBoardHostContext";
import { ErrorBoundary } from "./ErrorBoundary";

const DEFAULT_ERROR_TITLE = "This part of the page didn't load.";
const ERROR_SUBTITLE = "Try again. If it keeps failing, reload the page.";

/**
 * The error a SuspenseBoundary shows when its content fails to load, with a
 * button that retries it.
 */
export function LoadError({
  title = DEFAULT_ERROR_TITLE,
  onRetry,
}: {
  title?: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert">
      <StatusMessage title={title} subtitle={ERROR_SUBTITLE}>
        <Button kind="secondary" shape="block" onClick={onRetry}>
          Try again
        </Button>
      </StatusMessage>
    </div>
  );
}

/**
 * Shows fallback, a skeleton shaped like children, while children suspend on
 * a query or a lazy import, and LoadError if they throw. "Try again" resets
 * the failed queries (QueryErrorResetBoundary) and renders children again, so
 * they refetch. A change to any of resetKeys, such as the route, clears the
 * error too. Each error goes to the host's reportError, since the host's own
 * error boundary never sees an error caught here.
 */
export function SuspenseBoundary({
  fallback,
  errorTitle,
  resetKeys,
  children,
}: {
  fallback: ReactNode;
  errorTitle?: string;
  resetKeys?: readonly unknown[];
  children: ReactNode;
}) {
  const reportError = useReportError();
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={reportError}
          onReset={reset}
          resetKeys={resetKeys}
          renderFallback={(retry) => (
            <LoadError title={errorTitle} onRetry={retry} />
          )}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
