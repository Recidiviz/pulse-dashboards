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
import { useId, useState } from "react";
import styled from "styled-components";

import { Button, Icon, palette } from "~design-system";

import { CheckboxInput } from "../../../components/Checkbox";
import { formatWorkflowsDate } from "../../../utils";

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
  align-items: stretch;

  > * {
    min-width: 0;
  }
`;

const TitleInput = styled.input`
  ${typography.Sans14};
  flex: 2;
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

const DueDatePickerWrapper = styled.label`
  ${typography.Sans14};
  align-items: center;
  color: ${palette.pine4};
  cursor: pointer;
  display: inline-flex;
  flex: 1;
  font-weight: 500;
  gap: ${rem(spacing.xs)};
  padding: ${rem(spacing.sm)} ${rem(spacing.sm)} ${rem(spacing.sm)}
    ${rem(spacing.md)};
  position: relative;

  &:hover,
  &:focus-within {
    color: ${palette.pine3};
  }

  svg {
    fill: currentColor;
  }

  input[type="date"] {
    cursor: pointer;
    inset: 0;
    opacity: 0;
    position: absolute;
  }
`;

const DueDateText = styled.span`
  white-space: nowrap;
`;

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
 * Format a `Date` as the `yyyy-MM-dd` literal that `<input type="date">`
 * expects. Uses local-date parts (NOT `toISOString()`) so the rendered
 * picker shows the same calendar day the user picked, regardless of TZ.
 */
function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a `yyyy-MM-dd` string from `<input type="date">` into a JS Date
 * anchored at local midnight. Returns null when the string is empty or
 * malformed so the caller can keep the Save button disabled.
 */
function fromDateInputValue(value: string): Date | null {
  if (!value) return null;
  // Native `new Date("2026-05-14")` parses as UTC midnight, which can
  // shift the apparent date by one day in negative-offset zones. Split
  // the parts and build at local midnight instead.
  const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

type DueDatePickerProps = {
  value: string;
  label: string;
};

const DueDatePicker = ({
  label,
  ...props
}: DueDatePickerProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const parsedDueDate = fromDateInputValue(props.value || "");
  const id = useId();

  return (
    <DueDatePickerWrapper
      htmlFor={props.id ?? id}
      onClick={(e) => {
        e.stopPropagation();
        (e.currentTarget.control as HTMLInputElement)?.showPicker();
      }}
    >
      <Icon kind="CalendarSimple" size={15} />
      <DueDateText>
        {parsedDueDate ? formatWorkflowsDate(parsedDueDate) : label}
      </DueDateText>
      <input id={props.id ?? id} type="date" aria-label={label} {...props} />
    </DueDatePickerWrapper>
  );
};

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
  const [dueDateString, setDueDateString] = useState(
    initialDueDate ? toDateInputValue(initialDueDate) : "",
  );

  const isValid = title.trim().length > 0 && dueDateString;

  const minDueDate = toDateInputValue(new Date());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedDueDate = fromDateInputValue(dueDateString);
    if (!isValid || !parsedDueDate) return;
    onSave({ title: title.trim(), dueDate: parsedDueDate });
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
        <DueDatePicker
          name="due_date"
          label="Enter Date"
          value={dueDateString}
          onChange={(e) => setDueDateString(e.target.value)}
          min={minDueDate}
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
