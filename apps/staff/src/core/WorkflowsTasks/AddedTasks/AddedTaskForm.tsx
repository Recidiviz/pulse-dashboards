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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { forwardRef, useState } from "react";
import styled from "styled-components";

import { Button, Icon, palette } from "~design-system";

import { CheckboxInput } from "../../../components/Checkbox";
import { DatePicker } from "../../../components/DatePicker";

const CancelButton = styled(Button).attrs({
  kind: "link" as const,
  type: "button" as const,
})`
  color: ${palette.slate70};

  &:hover,
  &:focus {
    color: ${palette.pine3};
  }
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.md)} 0;
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(spacing.sm)};
  align-items: center;

  > input {
    min-width: 0;
  }
`;

const TitleInput = styled.input`
  ${typography.Sans14};
  flex: 1;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.sm)} ${rem(spacing.sm)} ${rem(spacing.sm)}
    ${rem(spacing.md)};
  color: ${palette.pine2};

  &:focus {
    border-color: ${palette.signal.links};
    outline: none;
  }
`;

// Figma node 7661-2835: a flat, pine-coloured `📅 Enter Date` affordance
// (no border, sits inline next to the title field). When a date is picked,
// the same surface displays the formatted date in MM/DD/YYYY.
//
// Uses the design-system `Button` with `kind="link"`, which already gives
// us `padding: 0`, `background: transparent`, `border: none`, and the
// disabled-cursor treatment. We deliberately keep the link variant's
// `padding: 0` so the affordance reads as inline text + icon, with no
// chrome. We only override the color (pine instead of `signal.links`)
// and swap the link's default hover-underline for a colour shift.
const DueDateButton = styled(Button).attrs({
  kind: "link" as const,
  type: "button" as const,
})`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: ${palette.pine4};
  font-weight: 500;
  white-space: nowrap;

  &:hover:not(:disabled),
  &:focus:not(:disabled),
  &:active:not(:disabled) {
    color: ${palette.pine3};
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

// `react-datepicker` clones `customInput` with `value`, `onClick`, `onChange`,
// `onFocus`, `onBlur`, `placeholder`, `disabled`. A button can't emit value
// changes — we only need `value` (for display) and `onClick` (to open the
// popper); the rest are ignored.
type DueDateCustomInputProps = {
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const DueDateCustomInput = forwardRef<
  HTMLButtonElement,
  DueDateCustomInputProps
>(function DueDateCustomInput({ value, onClick, disabled }, ref) {
  return (
    <DueDateButton ref={ref} onClick={onClick} disabled={disabled}>
      <Icon kind="CalendarSimple" size={15} color="currentColor" />
      <span>{value || "Enter Date"}</span>
    </DueDateButton>
  );
});

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(spacing.sm)};
  justify-content: flex-start;
`;

export type AddedTaskFormValues = {
  title: string;
  dueDate: Date;
};

type AddedTaskFormProps = {
  mode: "add" | "edit";
  initialTitle?: string;
  initialDueDate?: Date;
  // Visual-only: the checkbox lives in the form so its layout mirrors the
  // row layout (checkbox / title / date). The checkbox itself is disabled —
  // completion toggling happens via the row's checkbox, not here.
  initialCompleted?: boolean;
  onSave: (values: AddedTaskFormValues) => void;
  onCancel: () => void;
};

const MAX_TITLE_LENGTH = 200;

/**
 * Inline form used for both adding and editing a custom task. State is
 * fully local — the parent decides when to mount/unmount this form, and
 * just receives the saved values via `onSave`. In "edit" mode the
 * `initialTitle` / `initialDueDate` pre-populate the fields.
 */
export function AddedTaskForm({
  mode,
  initialTitle = "",
  initialDueDate,
  initialCompleted = false,
  onSave,
  onCancel,
}: AddedTaskFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [dueDate, setDueDate] = useState<Date | null>(initialDueDate ?? null);

  const isValid = title.trim().length > 0 && dueDate !== null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || !dueDate) return;
    onSave({ title: title.trim(), dueDate });
  };

  return (
    <FormWrapper onSubmit={handleSubmit} aria-label="Added task form">
      <FieldRow>
        <CheckboxInput
          aria-label="Task completion"
          checked={initialCompleted}
          disabled
          readOnly
        />
        <TitleInput
          type="text"
          name="task-title"
          aria-label="Task title"
          placeholder="Enter Task"
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
        />
        <DatePicker
          name="due_date"
          selected={dueDate}
          onChange={(d) => setDueDate(d)}
          minDate={new Date()}
          customInput={<DueDateCustomInput />}
        />
      </FieldRow>
      <ButtonRow>
        <CancelButton onClick={onCancel}>Cancel</CancelButton>
        <Button kind="link" disabled={!isValid} type="submit">
          Save
        </Button>
      </ButtonRow>
    </FormWrapper>
  );
}
