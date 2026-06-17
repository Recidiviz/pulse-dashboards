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

import { Sans12, Sans14, spacing } from "@recidiviz/design-system";
import { addDays, isPast } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { Button, palette } from "~design-system";

import { CheckboxInput } from "../../../components/Checkbox";
import { describeRecurrence } from "../../../components/DatePicker";
import { CustomTaskRecord } from "../../../FirestoreStore";
import { formatDueDateFromToday } from "../../../utils";
import { CustomTasks } from "../../../WorkflowsStore/Task/CustomTasks";
import {
  getNextDueDate,
  isTaskCompleted,
} from "../../../WorkflowsStore/Task/customTaskStatus";
import { AddedTaskForm, AddedTaskFormValues } from "./AddedTaskForm";
import { AddedTaskKebab } from "./AddedTaskKebab";
import { handleMutationFailure } from "./mutationErrors";

// Outer container per row. Always rendered regardless of the row's current
// state (display / editing / confirming delete) so the inter-row divider
// stays stable — earlier the divider lived on the grid wrapper directly, so
// switching to the edit form or the delete-confirm row swapped out the
// element that owned the `::after` line and visually dropped the divider.
const RowWrapper = styled.div`
  position: relative;

  &:not(:last-of-type)::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background-color: ${palette.slate10};
  }
`;

const RowContent = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: ${rem(spacing.sm)};
  align-items: center;
  padding: ${rem(spacing.md)} 0;
`;

const RowTitleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const RowTitle = styled(Sans14)<{ $completed: boolean }>`
  color: ${({ $completed }) => ($completed ? palette.slate70 : palette.pine2)};
`;

const RowRecurrenceCaption = styled(Sans12)<{ $completed: boolean }>`
  color: ${({ $completed }) =>
    $completed ? palette.slate60 : palette.slate70};
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowDueDate = styled(Sans14)<{ $completed: boolean; $overdue: boolean }>`
  color: ${({ $completed, $overdue }) => {
    if ($completed) return palette.slate60;
    if ($overdue) return palette.signal.error;
    return palette.slate70;
  }};
  white-space: nowrap;
`;

const ConfirmWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.md)} 0;
`;

const ConfirmText = styled(Sans14)`
  color: ${palette.slate85};
  flex: 1;
`;

const ConfirmButton = styled(Button).attrs({
  kind: "link" as const,
  type: "button" as const,
})`
  color: ${palette.signal.error};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
`;

const CancelButton = styled(Button).attrs({
  kind: "link" as const,
  type: "button" as const,
})`
  color: ${palette.slate70};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
`;

type AddedTaskRowProps = {
  task: CustomTaskRecord;
  customTasks: CustomTasks;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
};

function dueDateAsDate(value: Date | Timestamp): Date {
  return value instanceof Timestamp ? value.toDate() : value;
}

/**
 * One row in the Added Tasks list. Owns its own delete-confirmation
 * state (view-local; not surfaced to MobX) but defers edit-mode
 * coordination upward so only one row can be in edit mode at a time.
 */
export const AddedTaskRow = observer(function AddedTaskRow({
  task,
  customTasks,
  isEditing,
  onEditStart,
  onEditEnd,
}: AddedTaskRowProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const recurrenceCaption = describeRecurrence(task.recurrence ?? null);
  // Derived "is this task currently done?" — for recurring tasks this rolls
  // over automatically once `now` passes the next scheduled occurrence,
  // without any backend write.
  const completed = isTaskCompleted(task);
  const nextDueDate = getNextDueDate(task);
  // Mirror the supervision-task overdue rule (`Task.isOverdue`): a task is
  // overdue once `now` is past its due date plus a two-day grace window.
  // Completed rows keep their muted styling, so overdue is forced false.
  const overdue = !completed && isPast(addDays(nextDueDate, 2));

  if (isEditing) {
    return (
      <RowWrapper>
        <AddedTaskForm
          mode="edit"
          initialTitle={task.title}
          initialDueDate={dueDateAsDate(task.dueDate)}
          initialRecurrence={task.recurrence ?? null}
          initialCompleted={task.completedOn != null}
          onSave={(values: AddedTaskFormValues) => {
            customTasks
              .editCustomTask(task.id, {
                title: values.title,
                dueDate: values.dueDate,
                recurrence: values.recurrence,
              })
              .then(() => {
                onEditEnd();
              })
              .catch((err) => handleMutationFailure("save", err));
          }}
          onCancel={onEditEnd}
        />
      </RowWrapper>
    );
  }

  if (isConfirmingDelete) {
    return (
      <RowWrapper>
        <ConfirmWrapper role="alertdialog" aria-label="Confirm delete task">
          <ConfirmText>Delete this task?</ConfirmText>
          <ConfirmButton
            onClick={() => {
              customTasks
                .deleteCustomTask(task.id)
                .catch((err) => handleMutationFailure("delete", err));
              setIsConfirmingDelete(false);
            }}
          >
            Confirm
          </ConfirmButton>
          <CancelButton onClick={() => setIsConfirmingDelete(false)}>
            Cancel
          </CancelButton>
        </ConfirmWrapper>
      </RowWrapper>
    );
  }

  return (
    <RowWrapper>
      <RowContent>
        <CheckboxInput
          aria-label={`Mark "${task.title}" as ${
            completed ? "incomplete" : "complete"
          }`}
          checked={completed}
          onChange={(e) =>
            customTasks
              .toggleCustomTaskCompleted(task.id, e.target.checked)
              .catch((err) => handleMutationFailure("update", err))
          }
        />
        <RowTitleColumn>
          <RowTitle $completed={completed}>{task.title}</RowTitle>
          {recurrenceCaption && (
            <RowRecurrenceCaption $completed={completed}>
              Repeats {recurrenceCaption}
            </RowRecurrenceCaption>
          )}
        </RowTitleColumn>
        <RowDueDate $completed={completed} $overdue={overdue}>
          Due {formatDueDateFromToday(nextDueDate)}
        </RowDueDate>
        <AddedTaskKebab
          onEditClick={completed ? undefined : onEditStart}
          onDeleteClick={() => setIsConfirmingDelete(true)}
        />
      </RowContent>
    </RowWrapper>
  );
});
