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

import { makeAutoObservable } from "mobx";

import { ResidentRecord } from "~datatypes";

// Shared constant for all US_AZ date field names
export const US_AZ_DATE_FIELDS = [
  "acisTprDate",
  "acisDtpDate",
  "csbdDate",
  "ercdDate",
  "sedDate",
  "csedDate",
] as const;
export type UsAzDateField = (typeof US_AZ_DATE_FIELDS)[number];

export interface DateEntry {
  key: string;
  date: string;
  isUpcoming: boolean; // Within 31 days
  highlightType?: UsAzDateField;
}

export class UsAzImportantDatesPresenter {
  constructor(public readonly resident: ResidentRecord) {
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
    const hasAcisDtpDate = !!this.metadata.acisDtpDate;

    // Filter out undefined dates and prioritize acisDtpDates over acisTprDates
    const entries = US_AZ_DATE_FIELDS.flatMap((field) => {
      const date = this.metadata[field];
      if (!date) return [];
      if (field === "acisTprDate" && hasAcisDtpDate) return [];
      return [{ key: field, date }];
    });

    // Sort by earliest date first
    const sortedEntries = entries.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Add highlighting and upcoming logic
    const today = new Date();
    const thirtyOneDaysFromNow = new Date(today);
    thirtyOneDaysFromNow.setDate(today.getDate() + 31);

    return sortedEntries.map((entry) => {
      const entryDate = new Date(entry.date);
      const result: DateEntry = {
        ...entry,
        isUpcoming: entryDate >= today && entryDate <= thirtyOneDaysFromNow,
      };

      if (["acisTprDate", "acisDtpDate"].includes(entry.key)) {
        result.highlightType = entry.key;
      }

      return result;
    });
  }
}
