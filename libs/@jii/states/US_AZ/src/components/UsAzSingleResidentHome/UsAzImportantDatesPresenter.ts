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

import { parseISO } from "date-fns";
import { makeAutoObservable } from "mobx";

import { extractHeadingIds } from "~@jii/translation";
import { ResidentRecord } from "~datatypes";

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

function isUsAzDateField(key: string): key is UsAzDateField {
  return US_AZ_DATE_KEYS.includes(key as UsAzDateField);
}

export interface DateEntry {
  key: string;
  date: string;
  isUpcoming: boolean; // Within 31 days
  highlightType?: UsAzDateField;
  infoPageHash: string;
}

export class UsAzImportantDatesPresenter {
  private readonly headingIds: string[];

  constructor(
    public readonly resident: ResidentRecord,
    markdownContent: string,
  ) {
    this.headingIds = extractHeadingIds(markdownContent);
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get metadata() {
    const { metadata } = this.resident;
    if (metadata.stateCode !== "US_AZ") {
      throw new Error(
        `Invalid state code for UsAzImportantDatesPresenter: ${metadata.stateCode}`,
      );
    }

    return metadata;
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

      if (
        ["acisTprDateRaw", "acisDtpDateRaw"].includes(entry.key) &&
        isUsAzDateField(entry.key)
      ) {
        result.highlightType = entry.key;
      }

      return result;
    });
  }

  get hasNoDates(): boolean {
    return this.dateEntries.length === 0;
  }

  getInfoPageHashForDateKey(dateKey: UsAzDateField): string {
    const keyToHeadingIndex: Record<string, number> = {
      acisTprDateRaw: 1,
      acisDtpDateRaw: 2,
      csbdDateRaw: 3,
      trToAddDateRaw: 3,
      ercdDateRaw: 4,
      addDateRaw: 4,
      sedDateRaw: 5,
      csedDateRaw: 6,
    };

    const headingIndex = keyToHeadingIndex[dateKey];
    return this.headingIds[headingIndex] || "";
  }
}
