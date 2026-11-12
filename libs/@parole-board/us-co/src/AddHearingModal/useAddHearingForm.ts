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

import { useForm } from "@tanstack/react-form";

import type { CalendarApiConfig, MonthDetail } from "~@parole-board/common";

import { isAllowedDay } from "../model/isAllowedDay";
import { monthDays } from "../model/month";
import { type AddEntryInput, buildAddEntryInput } from "./buildAddEntryInput";
import { hearingChoices } from "./hearingChoices";

/**
 * The Add hearing form's values. A board session and a facility are two
 * fields, and choosing one clears the other, so at most one is set.
 */
export type AddHearingValues = {
  /** The chosen board session's boardSessionValue, or null. */
  boardSession: string | null;
  /** The chosen facility's facilityValue, or null. */
  facility: string | null;
  /** The chosen day as "YYYY-MM-DD", or null. */
  day: string | null;
};

/**
 * The day the dialog opens on: the selected entry's day when it is in the
 * month on an allowed weekday, else the month's first allowed day.
 */
export function defaultDay(
  month: Pick<MonthDetail, "year" | "month">,
  selectedDate: string | null,
  allowedWeekdays: CalendarApiConfig["calendar"]["allowedWeekdays"],
): string | null {
  const days = monthDays(month).filter((date) =>
    isAllowedDay(date, allowedWeekdays),
  );
  return selectedDate && days.includes(selectedDate)
    ? selectedDate
    : days[0] ?? null;
}

/**
 * The entries.add input for the form's values, or null while they can't be
 * added: nothing is chosen, no day is, or the chosen board session or
 * facility is already on that day. This is the rule that enables the add
 * button.
 */
export function addEntryInputFor(
  values: AddHearingValues,
  config: Pick<CalendarApiConfig, "kinds" | "resources">,
  month: Pick<MonthDetail, "id" | "entries">,
): AddEntryInput | null {
  const choice = values.boardSession ?? values.facility;
  if (!choice || !values.day) return null;
  const { boardSessions, facilities } = hearingChoices(
    config,
    month.entries,
    values.day,
  );
  const option = [...boardSessions, ...facilities].find(
    ({ value }) => value === choice,
  );
  if (!option || option.disabled) return null;
  return buildAddEntryInput({
    monthId: month.id,
    date: values.day,
    choice,
    kinds: config.kinds,
  });
}

/**
 * The Add hearing form, a TanStack Form. It submits only values
 * addEntryInputFor accepts, and sends their input.
 *
 * useForm resets an untouched form's values whenever defaultValues changes,
 * comparing them shallowly, so a form the editor hasn't touched follows a
 * new selected day.
 */
export function useAddHearingForm({
  month,
  config,
  defaultValues,
  send,
}: {
  month: Pick<MonthDetail, "id" | "entries">;
  config: CalendarApiConfig;
  defaultValues: AddHearingValues;
  send: (input: AddEntryInput) => Promise<void>;
}) {
  return useForm({
    defaultValues,
    validators: {
      // A guard only: the add button is disabled for the same values, so
      // this message never shows.
      onSubmit: ({ value }) =>
        addEntryInputFor(value, config, month)
          ? undefined
          : "Choose an available hearing and a day.",
    },
    onSubmit: async ({ value }) => {
      const input = addEntryInputFor(value, config, month);
      if (input) await send(input);
    },
  });
}

export type AddHearingFormApi = ReturnType<typeof useAddHearingForm>;
