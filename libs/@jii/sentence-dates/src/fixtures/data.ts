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

import { addDays, startOfDay } from "date-fns";

import { SentenceDate, SentenceDatesData } from "../data/types";

export type DateGenerator = () => Array<SentenceDate>;

/**
 * @returns array of date objects expected to trigger default presentation
 * (far in the future)
 */
export function getDefaultDates(): Array<SentenceDate> {
  return [
    {
      id: "parole_eligibility_date",
      date: startOfDay(addDays(new Date(), 95)),
    },
    { id: "max_discharge_date", date: startOfDay(addDays(new Date(), 400)) },
  ];
}

/**
 * Returns a set of fake date objects useful for tests and stories.
 * Dates should be always relative to the current date (including frozen
 * dates in test suites)
 */
export function getSentenceDatesFixtureData(
  generateDates: DateGenerator = getDefaultDates,
): SentenceDatesData {
  return {
    dates: generateDates(),
  };
}

export function getDatesWithUpcoming() {
  const defaultDates = getDefaultDates();
  return [
    {
      id: defaultDates[0].id,
      date: startOfDay(addDays(new Date(), 23)),
    },
    ...defaultDates.slice(1),
  ];
}

export function getDatesWithToday() {
  const defaultDates = getDefaultDates();
  return [
    {
      id: defaultDates[0].id,
      date: startOfDay(new Date()),
    },
    ...defaultDates.slice(1),
  ];
}

export function getDatesWithPast() {
  const defaultDates = getDefaultDates();
  return [
    {
      id: defaultDates[0].id,
      date: startOfDay(addDays(new Date(), -7)),
    },
    ...defaultDates.slice(1),
  ];
}

export function getDatesWithMissing() {
  const defaultDates = getDefaultDates();
  return [
    {
      id: defaultDates[0].id,
      date: undefined,
    },
    ...defaultDates.slice(1),
  ];
}
