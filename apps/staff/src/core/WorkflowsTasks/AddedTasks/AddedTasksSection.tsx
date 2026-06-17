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

import { Sans14, spacing } from "@recidiviz/design-system";
import { when } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { Button, palette } from "~design-system";

import { Client } from "../../../WorkflowsStore";
import { CustomTasks } from "../../../WorkflowsStore/Task/CustomTasks";
import { AddedTaskForm, AddedTaskFormValues } from "./AddedTaskForm";
import { AddedTaskRow } from "./AddedTaskRow";
import { handleMutationFailure } from "./mutationErrors";

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled(Sans14)`
  color: ${palette.slate70};
  padding: ${rem(spacing.md)} 0;
`;

const AddTaskButton = styled(Button).attrs({
  kind: "link" as const,
  type: "button" as const,
})`
  padding-block: ${rem(spacing.md)};
  text-align: start;

  &:hover,
  &:focus {
    color: ${palette.pine3};
  }
`;

const TaskDivider = styled.hr`
  margin: 0 -${rem(spacing.md)};
`;

type AddedTasksSectionProps = {
  person: Client;
  showCompleted: boolean;
};

/**
 * Throws to the parent `<Suspense>` while hydration is in progress, and to
 * the parent `<ErrorBoundary>` on failure. Suspense expects a thrown
 * `Promise<unknown>` and resolves the fallback when it settles; an
 * `ErrorBoundary` expects a thrown value and renders its fallback.
 *
 * `mobx.when(predicate)` returns a real `Promise<void>` that resolves when
 * the predicate becomes true — exactly the shape Suspense wants. Once
 * hydration settles to either `"hydrated"` or `"failed"`, the predicate
 * fires and the suspended render resumes.
 */
function useThrowOnHydrationState(customTasks: CustomTasks | undefined): void {
  if (!customTasks) return;
  const state = customTasks.hydrationState;

  if (state.status === "needs hydration" || state.status === "loading") {
    throw when(
      () =>
        customTasks.hydrationState.status === "hydrated" ||
        customTasks.hydrationState.status === "failed",
    );
  }

  if (state.status === "failed") {
    throw state.error ?? new Error("Failed to load added tasks");
  }
}

/**
 * Renders the "Added Tasks" list for a single client. Only handles the
 * hydrated branch — loading and failure are lifted to the parent
 * `<Suspense>` / `<ErrorBoundary>` via {@link useThrowOnHydrationState}.
 *
 * The `CustomTasks` subscription auto-activates via `onBecomeObserved` when
 * this `observer` reads `hydrationState` / `outstandingOrderedTasks` /
 * `allOrderedTasks`, so no manual `hydrate()` call is needed.
 * `CaseloadTasksHydrator` primes the caseload-wide path separately.
 *
 * Default-exported so it can be loaded via `React.lazy()`.
 */
const AddedTasksSection = observer(function AddedTasksSection({
  person,
  showCompleted,
}: AddedTasksSectionProps) {
  const { customTasks } = person;
  useThrowOnHydrationState(customTasks);

  // View-local state. Kept out of MobX because nothing else needs it.
  // `pendingAddIds` is the list of in-flight new-task form instances; each id
  // is a UUID assigned at click-time so multiple forms can coexist (the CTA
  // stays visible even while a form is open).
  const [pendingAddIds, setPendingAddIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  if (!customTasks) return null;

  const tasks = showCompleted
    ? customTasks.allOrderedTasks
    : customTasks.outstandingOrderedTasks;

  const handleAddSave =
    (pendingId: string) => (values: AddedTaskFormValues) => {
      customTasks
        .addCustomTask({
          title: values.title,
          dueDate: values.dueDate,
          recurrence: values.recurrence,
        })
        .then(() => {
          setPendingAddIds((ids) => ids.filter((id) => id !== pendingId));
        })
        .catch((err) => handleMutationFailure("save", err));
    };

  const handleAddCancel = (pendingId: string) => () => {
    setPendingAddIds((ids) => ids.filter((id) => id !== pendingId));
  };

  return (
    <SectionWrapper>
      {tasks.length === 0 && pendingAddIds.length === 0 && (
        <EmptyState>No added tasks yet.</EmptyState>
      )}
      {tasks.map((task) => (
        <AddedTaskRow
          key={task.id}
          task={task}
          customTasks={customTasks}
          isEditing={editingTaskId === task.id}
          onEditStart={() => setEditingTaskId(task.id)}
          onEditEnd={() => setEditingTaskId(null)}
        />
      ))}
      {pendingAddIds.map((pendingId) => (
        <div key={pendingId}>
          <TaskDivider />
          <AddedTaskForm
            mode="add"
            onSave={handleAddSave(pendingId)}
            onCancel={handleAddCancel(pendingId)}
          />
        </div>
      ))}
      <TaskDivider />
      <AddTaskButton
        onClick={() => setPendingAddIds((ids) => [...ids, crypto.randomUUID()])}
      >
        + Add New Task
      </AddTaskButton>
    </SectionWrapper>
  );
});

export default AddedTasksSection;
