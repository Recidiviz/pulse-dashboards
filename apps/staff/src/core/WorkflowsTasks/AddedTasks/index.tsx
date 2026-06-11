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

import { ErrorBoundary } from "@sentry/react";
import React, { Suspense } from "react";

import { useLazyWithRetry } from "../../../utils/lazyWithRetry";
import { Client } from "../../../WorkflowsStore";
import { AddedTasksError } from "./AddedTasksError";
import { AddedTasksSkeleton } from "./AddedTasksSkeleton";

type AddedTasksProps = {
  client: Client;
  /**
   * Renders the heading + body scaffolding around the section. Called once
   * with the live body (`<Suspense>` wrapping the lazy section) and again
   * inside the boundary fallback with `<AddedTasksError />`, so the heading
   * stays attached to the body whether the section is loading, hydrated,
   * or failed.
   */
  renderShell: (body: React.ReactNode) => React.ReactElement;
};

/**
 * Single-owner of the Added Tasks lifecycle stack:
 *
 *   - `useLazyWithRetry` wraps the section import so a failed chunk fetch
 *     can be re-attempted after `resetError()`.
 *   - `<ErrorBoundary>` (Sentry-reporting) catches both chunk-load failures
 *     and the hydration-failure throw from `useThrowOnHydrationState` inside
 *     the section.
 *   - `<Suspense>` catches both the lazy fetch and the hydration-loading
 *     throw from the section; falls back to `<AddedTasksSkeleton>`.
 *   - Each host supplies its heading/layout primitives via `renderShell`,
 *     which is re-invoked inside the fallback so the heading + body
 *     collapse together on failure.
 */
function AddedTasks({
  client,
  renderShell,
}: AddedTasksProps): React.ReactElement {
  const [AddedTasksSection, retryLazy] = useLazyWithRetry(
    () => import("./AddedTasksSection"),
  );

  const fallback = ({
    resetError,
  }: {
    resetError: () => void;
  }): React.ReactElement =>
    renderShell(
      <AddedTasksError
        customTasks={client.customTasks}
        resetError={() => {
          retryLazy();
          resetError();
        }}
      />,
    );

  return (
    <ErrorBoundary fallback={fallback}>
      {renderShell(
        <Suspense fallback={<AddedTasksSkeleton />}>
          <AddedTasksSection person={client} />
        </Suspense>,
      )}
    </ErrorBoundary>
  );
}

export default AddedTasks;
export { AddedTasksSkeleton } from "./AddedTasksSkeleton";
