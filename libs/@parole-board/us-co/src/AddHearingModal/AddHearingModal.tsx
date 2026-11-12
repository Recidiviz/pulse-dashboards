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

import { useStore } from "@tanstack/react-form";
import { ReactNode, useMemo } from "react";
import toast from "react-hot-toast";

import type {
  CalendarApiConfig,
  EntryDto,
  MonthDetail,
} from "~@parole-board/common";
import {
  getCalendarErrorCode,
  getCalendarErrorMessage,
  ModalForm,
  useAddEntry,
  useCalendarConfig,
  useParoleBoardHost,
  useReportError,
} from "~@parole-board/common";

import { formatMonthDay, formatMonthName } from "../model/month";
import { AddHearingForm } from "./AddHearingForm";
import {
  addEntryInputFor,
  type AddHearingFormApi,
  type AddHearingValues,
  defaultDay,
  useAddHearingForm,
} from "./useAddHearingForm";

/** Shown for any failure whose server message wasn't written for editors. */
export const ADD_ENTRY_ERROR_MESSAGE =
  "We couldn't add this. Try again or contact Recidiviz support.";

// One id, so a second add replaces the first add's toast.
const ADDED_TOAST_ID = "pb-calendar-entry-added";

// One id, so a second refused add replaces the first one's toast.
const LOCKED_TOAST_ID = "pb-calendar-add-entry-locked";

export type AddHearingModalFormProps = {
  /** The form from useAddHearingForm. */
  form: AddHearingFormApi;
  isOpen: boolean;
  /** The month the entry goes in, with its entries. */
  month: MonthDetail;
  config: CalendarApiConfig;
  onCancel: () => void;
  /** The fields, usually AddHearingForm. */
  children: ReactNode;
};

/**
 * The Add hearing dialog around a form and its fields: a ModalForm whose
 * button reads "Add to [Month] [day]" and is enabled once addEntryInputFor
 * accepts the values. Closing it resets the form.
 */
export function AddHearingModalForm({
  form,
  isOpen,
  month,
  config,
  onCancel,
  children,
}: AddHearingModalFormProps) {
  const values = useStore(form.store, (state) => state.values);
  const dayName = values.day
    ? formatMonthDay(values.day)
    : formatMonthName(month);
  const addable = addEntryInputFor(values, config, month);

  return (
    <ModalForm
      form={form}
      isOpen={isOpen}
      contentLabel="Add a hearing"
      submitLabel={`Add to ${dayName}`}
      submitDisabled={!addable}
      errorMessage={ADD_ENTRY_ERROR_MESSAGE}
      onCancel={onCancel}
      onAfterClose={() => form.reset()}
    >
      {children}
    </ModalForm>
  );
}

export interface AddHearingModalProps {
  isOpen: boolean;
  /** The month the entry goes in, with its entries. */
  month: MonthDetail;
  /**
   * The day of the one selected entry, "YYYY-MM-DD", which the dialog opens
   * on; null when no entry, or several, are selected.
   */
  selectedDate: string | null;
  onClose: () => void;
  /** Called with the new entry once the server has added it. */
  onAdded: (entry: EntryDto) => void;
}

/**
 * The Add hearing dialog: choose a board session or a facility and a day,
 * then add it to a draft month. A published month is locked, so the view
 * offers this dialog only for a month canEditMonth allows. It opens with
 * nothing chosen, on the selected entry's day or the month's first allowed
 * one, and Enter in a field adds as the button does. An added entry is
 * tracked, toasted and passed to onAdded. A refused add shows its error
 * above the buttons, except PRECONDITION_FAILED: the month was published
 * meanwhile, so the dialog closes and a toast shows the server's message.
 * It reads the calendar config with Suspense; on the month page the config
 * has already loaded, since the page needs it too.
 */
export function AddHearingModal({
  isOpen,
  month,
  selectedDate,
  onClose,
  onAdded,
}: AddHearingModalProps) {
  const addEntry = useAddEntry();
  const { analyticsStore } = useParoleBoardHost();
  const reportError = useReportError();
  const { data: config } = useCalendarConfig();
  const { allowedWeekdays } = config.calendar;
  const defaultValues = useMemo<AddHearingValues>(
    () => ({
      boardSession: null,
      facility: null,
      day: defaultDay(month, selectedDate, allowedWeekdays),
    }),
    [month, selectedDate, allowedWeekdays],
  );

  const form = useAddHearingForm({
    month,
    config,
    defaultValues,
    send: async (input) => {
      let entry: EntryDto;
      try {
        // The promise settles once the month the server returned is in the
        // cache, so the new entry is already on the grid to select.
        ({ entry } = await addEntry.mutateAsync(input));
      } catch (error) {
        // PRECONDITION_FAILED means the month is published, for example from
        // another tab, so nothing can be added until an editor clicks Edit
        // month. The server's message says so ("September 2026 is published.
        // Click Edit month to change it."), and the refetched month shows it
        // locked. ModalForm shows any other error.
        if (getCalendarErrorCode(error) !== "PRECONDITION_FAILED") throw error;
        toast.error(getCalendarErrorMessage(error), { id: LOCKED_TOAST_ID });
        onClose();
        return;
      }
      // The add has succeeded, so a throw here, such as from the analytics
      // call, is reported rather than shown as a failed add.
      try {
        analyticsStore.trackPbPublicCalendarHearingAdded({
          year: month.year,
          month: month.month,
          kind: entry.kind.code,
        });
      } catch (error) {
        reportError(error);
      }
      toast(`Added ${entry.label} to ${formatMonthDay(entry.date)}`, {
        id: ADDED_TOAST_ID,
      });
      onAdded(entry);
    },
  });

  return (
    <AddHearingModalForm
      form={form}
      isOpen={isOpen}
      month={month}
      config={config}
      onCancel={onClose}
    >
      <AddHearingForm
        form={form}
        month={month}
        config={config}
        entries={month.entries}
      />
    </AddHearingModalForm>
  );
}
