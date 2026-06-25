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
import React, { Suspense, useState } from "react";

import { useLazyWithRetry } from "../../../utils/lazyWithRetry";
import { Client } from "../../../WorkflowsStore";
import { TaskSectionFilter } from "../TaskSectionFilter";
import { AddedTasksError } from "./AddedTasksError";
import { AddedTasksSkeleton } from "./AddedTasksSkeleton";

type AddedTasksProps = {
  client: Client;
  /**
   * Renders the heading + body scaffolding around the section. Called once
   * with the live body (`<Suspense>` wrapping the lazy section) and again
   * inside the boundary fallback with `<AddedTasksError />`, so the heading
   * stays attached to the body whether the section is loading, hydrated,
   * or failed. The second argument is the "Show Completed" filter node, so
   * the host can place it in the section heading in every state.
   */
  renderShell: (
    body: React.ReactNode,
    filter: React.ReactNode,
  ) => React.ReactElement;
};

/**
 * Single-owner of the Added Tasks lifecycle stack:
 *
 *   - `useLazyWithRetry` wraps the section import so a failed chunk fetch
 *     can be re-attempted after `resetError()`.
 *   - `<ErrorBoundary>` (Sentry-reporting) catches chunk-load failures from the
 *     lazy import. (Hydration *failures* are handled inline by the section,
 *     which renders `<AddedTasksError>` itself — see AddedTasksSection.)
 *   - `<Suspense>` catches the lazy chunk fetch; falls back to
 *     `<AddedTasksSkeleton>`. (Hydration loading is rendered as an inline
 *     skeleton by the section itself, not thrown to Suspense.)
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

  const [showCompleted, setShowCompleted] = useState(false);

  const filter = (
    <TaskSectionFilter
      label="Show Completed"
      checked={showCompleted}
      onChange={setShowCompleted}
      testId="added-tasks-filter"
    />
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
      filter,
    );

  return (
    <ErrorBoundary fallback={fallback}>
      {renderShell(
        <Suspense fallback={<AddedTasksSkeleton />}>
          <AddedTasksSection person={client} showCompleted={showCompleted} />
        </Suspense>,
        filter,
      )}
    </ErrorBoundary>
  );
}

export default AddedTasks;
export { AddedTasksSkeleton } from "./AddedTasksSkeleton";
