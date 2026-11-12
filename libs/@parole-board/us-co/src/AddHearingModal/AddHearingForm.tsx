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
import { useId, useMemo } from "react";

import {
  type CalendarApiConfig,
  type CalendarMonthRef,
  type EntryDto,
  RadioGridField,
  RadioGridItem,
} from "~@parole-board/common";
import { DropdownMenuItem } from "~design-system";

import { DayPicker } from "../DayPicker/DayPicker";
import { isAllowedDay } from "../model/isAllowedDay";
import {
  formatMonthDay,
  formatMonthName,
  formatMonthYear,
} from "../model/month";
import {
  BoardSessionTiles,
  DayLabel,
  Eyebrow,
  FacilitiesDropdown,
  FacilitiesMenu,
  FacilitiesToggle,
  FacilityFullName,
  FacilityLabel,
  Title,
  VisuallyHidden,
} from "./AddHearingModal.styles";
import { type FacilityOption, hearingChoices } from "./hearingChoices";
import type { AddHearingFormApi } from "./useAddHearingForm";

export interface AddHearingFormProps {
  /** The form from useAddHearingForm, which holds the choices and the day. */
  form: AddHearingFormApi;
  month: CalendarMonthRef;
  /** The calendar config whose kinds, resources and weekdays it offers. */
  config: Pick<CalendarApiConfig, "kinds" | "resources" | "calendar">;
  /** The month's entries; choices already on the chosen day are disabled. */
  entries: readonly Pick<EntryDto, "date" | "slotKey">[];
}

function facilityName({ label, fullName }: FacilityOption) {
  return fullName && fullName !== label ? `${label} — ${fullName}` : label;
}

/**
 * The fields of the Add hearing dialog: a board session or a facility, then
 * a day, each a field of the form. ModalForm adds the buttons around them.
 * The choices come from the config through hearingChoices, and the ones
 * already on the chosen day are disabled, with screen readers hearing
 * "already on [Month D]" for each. Every field is disabled while the add is
 * in flight. Matches the Add a hearing dialog in the Calendar Unit Dashboard
 * design, inside the standard ~design-system Modal.
 */
export function AddHearingForm({
  form,
  month,
  config,
  entries,
}: AddHearingFormProps) {
  const dayLabelId = useId();
  const day = useStore(form.store, (state) => state.values.day);
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  const { boardSessions, facilities } = useMemo(
    () => hearingChoices(config, entries, day),
    [config, entries, day],
  );
  const dayName = day ? formatMonthDay(day) : formatMonthName(month);
  const alreadyOnDay = day && (
    <VisuallyHidden>{` (already on ${dayName})`}</VisuallyHidden>
  );

  return (
    <>
      <Eyebrow>{formatMonthYear(month)}</Eyebrow>
      <Title>Add a hearing</Title>

      <form.Field
        name="boardSession"
        listeners={{
          onChange: () => form.setFieldValue("facility", null),
        }}
      >
        {(field) => (
          <BoardSessionTiles>
            <RadioGridField
              field={field}
              columns={2}
              ariaLabel="Board session"
              disabled={submitting}
            >
              {boardSessions.map((option) => (
                <RadioGridItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                  {option.disabled && alreadyOnDay}
                </RadioGridItem>
              ))}
            </RadioGridField>
          </BoardSessionTiles>
        )}
      </form.Field>

      <form.Field
        name="facility"
        listeners={{
          onChange: () => form.setFieldValue("boardSession", null),
        }}
      >
        {(field) => {
          const chosen = facilities.find(
            ({ value }) => value === field.state.value,
          );
          return (
            <FacilitiesDropdown>
              <FacilitiesToggle showCaret disabled={submitting}>
                {chosen ? (
                  <span>
                    <VisuallyHidden>Facility: </VisuallyHidden>
                    {facilityName(chosen)}
                  </span>
                ) : (
                  "Facilities"
                )}
              </FacilitiesToggle>
              <FacilitiesMenu ariaLabel="Facilities">
                {facilities.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    disabled={option.disabled}
                    onClick={() => field.handleChange(option.value)}
                  >
                    <FacilityLabel>{option.label}</FacilityLabel>
                    {option.fullName && option.fullName !== option.label && (
                      <FacilityFullName>{option.fullName}</FacilityFullName>
                    )}
                    {option.disabled && alreadyOnDay}
                    {option === chosen && (
                      <VisuallyHidden> (selected)</VisuallyHidden>
                    )}
                  </DropdownMenuItem>
                ))}
              </FacilitiesMenu>
            </FacilitiesDropdown>
          );
        }}
      </form.Field>

      <DayLabel id={dayLabelId}>Day</DayLabel>
      <form.Field name="day">
        {(field) => (
          <DayPicker
            month={month}
            value={field.state.value}
            onChange={field.handleChange}
            isDisabled={(date) =>
              !isAllowedDay(date, config.calendar.allowedWeekdays)
            }
            legend="Day"
            labelledBy={dayLabelId}
            disabled={submitting}
          />
        )}
      </form.Field>
    </>
  );
}
