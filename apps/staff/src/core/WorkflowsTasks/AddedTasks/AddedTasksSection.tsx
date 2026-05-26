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
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { Button, palette } from "~design-system";

import { Client } from "../../../WorkflowsStore";
import { AddedTaskForm, AddedTaskFormValues } from "./AddedTaskForm";
import { AddedTaskRow } from "./AddedTaskRow";
import { AddedTasksError } from "./AddedTasksError";
import { AddedTasksSkeleton } from "./AddedTasksSkeleton";

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
};

/**
 * Renders the "Added Tasks" UI for a single client: a hydration-aware list
 * of `CustomTaskRecord`s plus inline add/edit forms.
 *
 * Hydration ownership: this component triggers `customTasks.hydrate()` on
 * mount (and when the `customTasks` reference changes). The shape mirrors
 * `CaseloadTasksHydrator`'s `autorun`, but is scoped to one person rather
 * than iterating the caseload — we don't want a flag-only client to incur
 * the caseload-wide subscription cost.
 *
 * Default-exported so it can be loaded via `React.lazy()`.
 */
const AddedTasksSection = observer(function AddedTasksSection({
  person,
}: AddedTasksSectionProps) {
  const { customTasks } = person;

  // View-local state. Kept out of MobX because nothing else needs it.
  // `pendingAddIds` is the list of in-flight new-task form instances; each id
  // is a UUID assigned at click-time so multiple forms can coexist (the CTA
  // stays visible even while a form is open).
  const [pendingAddIds, setPendingAddIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!customTasks) return;
    return autorun(() => {
      customTasks.hydrate();
    });
  }, [customTasks]);

  if (!customTasks) return null;

  const { hydrationState, orderedTasks } = customTasks;

  if (
    hydrationState.status === "needs hydration" ||
    hydrationState.status === "loading"
  ) {
    return <AddedTasksSkeleton />;
  }

  if (hydrationState.status === "failed") {
    return <AddedTasksError onRetry={() => customTasks.hydrate()} />;
  }

  const handleAddSave =
    (pendingId: string) => (values: AddedTaskFormValues) => {
      customTasks.addCustomTask({
        title: values.title,
        dueDate: values.dueDate,
      });
      setPendingAddIds((ids) => ids.filter((id) => id !== pendingId));
    };

  const handleAddCancel = (pendingId: string) => () => {
    setPendingAddIds((ids) => ids.filter((id) => id !== pendingId));
  };

  return (
    <SectionWrapper>
      {orderedTasks.length === 0 && pendingAddIds.length === 0 && (
        <EmptyState>No added tasks yet.</EmptyState>
      )}
      {orderedTasks.map((task) => (
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
