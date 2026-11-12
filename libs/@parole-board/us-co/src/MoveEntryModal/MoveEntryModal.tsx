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

import { useForm, useStore } from "@tanstack/react-form";
import { rem } from "polished";
import { useId } from "react";
import styled from "styled-components";

import {
  type CalendarMonthRef,
  ModalForm,
  semantics,
} from "~@parole-board/common";
import { pluralize } from "~utils";

import {
  DayLabel,
  Eyebrow,
  Title,
  VisuallyHidden,
} from "../AddHearingModal/AddHearingModal.styles";
import { DayPicker } from "../DayPicker/DayPicker";
import { formatMonthDay, formatMonthYear, joinLabels } from "../model/month";

const { space, text, type } = semantics;

const TitleOverLabels = styled(Title)`
  margin-bottom: ${rem(space.xs)};
`;

const Labels = styled.p`
  ${type.Sans14}
  margin: 0 0 ${rem(space.md)};
  color: ${text.secondary};
`;

// The day's note already says "current day" to screen readers.
const NOW_CAPTION = <span aria-hidden="true">Now</span>;

/** Shown for a failed move whose server message wasn't written for editors. */
export const MOVE_FAILED_MESSAGE =
  "We couldn't move this. Try again or contact Recidiviz support.";

/** Whether day can take the move: a day is chosen, and it isn't currentDate. */
const canMoveTo = (
  day: string | null,
  currentDate: string | null,
): day is string => day !== null && day !== currentDate;

export interface MoveEntryModalProps {
  isOpen: boolean;
  month: CalendarMonthRef;
  /**
   * The names of the entries that move, as the grid shows them, such as
   * ["FCF"]. With one, the heading reads "Move FCF"; with several, "Move 3
   * hearings" over the list of names. A name listed twice can't land on any
   * one day, so every day but the current one is disabled.
   */
  labels: readonly string[];
  /**
   * The day the entries are on now, "YYYY-MM-DD". It starts chosen and
   * carries a "Now" caption, and the move button stays disabled while it is
   * chosen. Null when several entries sit on different days; then no day
   * starts chosen.
   */
  currentDate: string | null;
  /**
   * Whether a day can't take the entries because of its weekday, usually
   * isAllowedDay negated with the calendar's allowed weekdays.
   */
  isDisabled?: (date: string) => boolean;
  /**
   * The moving entries' labels that another entry already holds on each day,
   * keyed by "YYYY-MM-DD", such as { "2026-09-16": ["CCF"] }. Those days are
   * disabled and screen readers hear "already has CCF" for them. The current
   * day is never disabled.
   */
  alreadyOn?: Readonly<Record<string, readonly string[]>>;
  /** Called by "Cancel", Escape and a click outside, except while moving. */
  onCancel: () => void;
  /**
   * Called by "Move to [Month] [day]", or Enter on a day, with the chosen
   * day, "YYYY-MM-DD"; the button reads "Move to…" until a day is chosen. The
   * dialog waits until the promise settles, and a rejection shows above the
   * buttons: the server's message when it was written for editors, and
   * MOVE_FAILED_MESSAGE otherwise.
   */
  onMove: (date: string) => Promise<void>;
  /**
   * Called once the dialog has closed and returned focus to the element that
   * opened it, so a caller can move focus somewhere else.
   */
  onAfterClose?: () => void;
}

/**
 * The "Move to…" dialog, the keyboard path for moving hearings to another
 * day of the month: a ModalForm whose one field is the day. Its container
 * finds the versions, sends the move and closes the dialog on success. It
 * follows the Add a hearing dialog in the Calendar Unit Dashboard design,
 * since the design has no "Move to…" dialog of its own.
 *
 * Focus starts on the chosen day, so arrow keys pick another day at once.
 * While the move runs, every control is disabled and Escape does nothing,
 * because closing can't stop a request already sent. Each open starts on the
 * current day again.
 */
export function MoveEntryModal({
  isOpen,
  month,
  labels,
  currentDate,
  isDisabled,
  alreadyOn = {},
  onCancel,
  onMove,
  onAfterClose,
}: MoveEntryModalProps) {
  // useForm resets an untouched form's values when defaultValues changes, so
  // the dialog opens on the day of the entries it was opened for.
  const form = useForm({
    defaultValues: { day: currentDate },
    validators: {
      onSubmit: ({ value }) =>
        canMoveTo(value.day, currentDate) ? undefined : "Choose another day.",
    },
    onSubmit: async ({ value }) => {
      if (canMoveTo(value.day, currentDate)) await onMove(value.day);
    },
  });
  const dayLabelId = useId();
  const day = useStore(form.store, (state) => state.values.day);
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  const heading =
    labels.length === 1
      ? `Move ${labels[0]}`
      : `Move ${pluralize(labels.length, "hearing")}`;
  const taken = (date: string) => alreadyOn[date] ?? [];
  const repeated = labels.find(
    (label, index) => labels.indexOf(label) !== index,
  );

  return (
    <ModalForm
      form={form}
      isOpen={isOpen}
      contentLabel={heading}
      submitLabel={day ? `Move to ${formatMonthDay(day)}` : "Move to…"}
      submitDisabled={!canMoveTo(day, currentDate)}
      errorMessage={MOVE_FAILED_MESSAGE}
      onCancel={onCancel}
      onAfterOpen={(options) => {
        const contentEl = options?.contentEl;
        (
          contentEl?.querySelector<HTMLInputElement>(
            'input[type="radio"]:checked',
          ) ??
          contentEl?.querySelector<HTMLInputElement>(
            'input[type="radio"]:not(:disabled)',
          )
        )?.focus();
      }}
      onAfterClose={() => {
        form.reset();
        onAfterClose?.();
      }}
    >
      <Eyebrow>{formatMonthYear(month)}</Eyebrow>
      {labels.length > 1 ? (
        <>
          <TitleOverLabels>{heading}</TitleOverLabels>
          <Labels>{joinLabels(labels)}</Labels>
        </>
      ) : (
        <Title>{heading}</Title>
      )}

      <DayLabel id={dayLabelId}>Day</DayLabel>
      <form.Field name="day">
        {(field) => (
          <DayPicker
            month={month}
            value={field.state.value}
            onChange={field.handleChange}
            isDisabled={(date) =>
              date !== currentDate &&
              (repeated !== undefined ||
                taken(date).length > 0 ||
                (isDisabled?.(date) ?? false))
            }
            legend="Day"
            labelledBy={dayLabelId}
            disabled={submitting}
            renderDayCaption={(date) =>
              date === currentDate ? NOW_CAPTION : null
            }
            dayNote={(date) => {
              if (date === currentDate) return "current day";
              if (repeated !== undefined) return `would have ${repeated} twice`;
              const labelsThere = taken(date);
              return labelsThere.length > 0
                ? `already has ${joinLabels(labelsThere)}`
                : undefined;
            }}
          />
        )}
      </form.Field>

      <VisuallyHidden role="status">
        {submitting && day ? `Moving to ${formatMonthDay(day)}…` : ""}
      </VisuallyHidden>
    </ModalForm>
  );
}
