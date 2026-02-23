// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import assertNever from "assert-never";
import { parseISO } from "date-fns";
import { makeAutoObservable } from "mobx";

import { ResidentMetadata } from "~datatypes";

// Shared constant for all US_AZ date field names that exist on metadata
export const US_AZ_DATE_KEYS = [
  "acisTprDateRaw",
  "acisDtpDateRaw",
  "csbdDateRaw",
  "ercdDateRaw",
  "sedDateRaw",
  "csedDateRaw",
  "addDateRaw",
  "trToAddDateRaw",
] as const;

export type UsAzDateField = (typeof US_AZ_DATE_KEYS)[number];

export interface DateEntry {
  key: UsAzDateField;
  date: string;
  isUpcoming: boolean; // Within 31 days
  infoPageHash: string;
}

export class UsAzImportantDatesPresenter {
  constructor(public readonly metadata: ResidentMetadata<"US_AZ">) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get dateEntries(): DateEntry[] {
    // Check if acisDtpDate exists to determine whether to exclude acisTprDate
    const hasAcisDtpDate = !!this.metadata.acisDtpDateRaw;

    // Filter out undefined dates and prioritize acisDtpDates over acisTprDates
    const entries = US_AZ_DATE_KEYS.flatMap((field) => {
      const date = this.metadata[field];
      if (!date) return [];
      if (field === "acisTprDateRaw" && hasAcisDtpDate) return [];
      return [{ key: field, date }];
    });

    // Sort by earliest date first
    const sortedEntries = entries.sort((a, b) => {
      return parseISO(a.date).getTime() - parseISO(b.date).getTime();
    });

    // Add highlighting and upcoming logic
    const today = new Date();
    const thirtyOneDaysFromNow = new Date(today);
    thirtyOneDaysFromNow.setDate(today.getDate() + 31);

    return sortedEntries.map((entry) => {
      const entryDate = parseISO(entry.date);
      const result: DateEntry = {
        ...entry,
        isUpcoming: entryDate >= today && entryDate <= thirtyOneDaysFromNow,
        infoPageHash: this.getInfoPageHashForDateKey(
          entry.key as UsAzDateField,
        ),
      };

      return result;
    });
  }

  get hasNoDates(): boolean {
    return this.dateEntries.length === 0;
  }

  getInfoPageHashForDateKey(dateKey: UsAzDateField): string {
    //  these headings have been explicitly added to the Markdown document
    // for this page. You need to ensure they remain in sync if anything changes!
    switch (dateKey) {
      case "acisTprDateRaw":
      case "acisDtpDateRaw":
      case "sedDateRaw":
      case "csedDateRaw":
        return dateKey;
      case "csbdDateRaw":
      case "trToAddDateRaw":
        return "csbdDateRaw-trToAddDateRaw";
      case "ercdDateRaw":
      case "addDateRaw":
        return "ercdDateRaw-addDateRaw";
      default:
        assertNever(dateKey);
    }
  }
}
