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

import { extractHeadingIds } from "~@jii/translation";
import { ResidentRecord } from "~datatypes";

// Shared constant for all US_AZ date field names that exist on metadata
export const US_AZ_METADATA_DATE_FIELDS = [
  "acisTprDate",
  "acisDtpDate",
  "csbdDate",
  "ercdDate",
  "sedDate",
  "csedDate",
] as const;

// All possible date keys that can appear in DateEntry (includes transformed keys)
export const US_AZ_DATE_KEYS = [
  ...US_AZ_METADATA_DATE_FIELDS,
  "addDate",
  "trToAddDate",
] as const;

export type UsAzMetadataDateField = (typeof US_AZ_METADATA_DATE_FIELDS)[number];
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
    const hasAcisDtpDate = !!this.metadata.acisDtpDate;

    // Filter out undefined dates and prioritize acisDtpDates over acisTprDates
    const entries = US_AZ_METADATA_DATE_FIELDS.flatMap((field) => {
      const date = this.metadata[field];
      if (!date) return [];
      if (field === "acisTprDate" && hasAcisDtpDate) return [];

      /* ercd and csbd dates should have different copy based on whether the individual
      has Community Supervision or Probation after their sentence: */
      if (field === "ercdDate") {
        const key =
          this.metadata.ercdOrAdd === "ABSOLUTE DISCHARGE DATE"
            ? "addDate"
            : "ercdDate";
        return [{ key, date }];
      }

      // Use metadata.csbdOrTrToAdd to determine the key for csbdDate
      if (field === "csbdDate") {
        const key =
          this.metadata.csbdOrTrToAdd ===
          "TRANSITION TO ABSOLUTE DISCHARGE DATE"
            ? "trToAddDate"
            : "csbdDate";
        return [{ key, date }];
      }

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

    // Map date keys to their corresponding heading index
    const keyToHeadingIndex: Record<string, number> = {
      acisTprDate: 1,
      acisDtpDate: 2,
      csbdDate: 3,
      trToAddDate: 3,
      ercdDate: 4,
      addDate: 4,
      sedDate: 5,
      csedDate: 6,
    };

    return sortedEntries.map((entry) => {
      const entryDate = new Date(entry.date);
      const headingIndex = keyToHeadingIndex[entry.key];
      const result: DateEntry = {
        ...entry,
        isUpcoming: entryDate >= today && entryDate <= thirtyOneDaysFromNow,
        infoPageHash: this.headingIds[headingIndex] || "",
      };

      if (
        ["acisTprDate", "acisDtpDate"].includes(entry.key) &&
        isUsAzDateField(entry.key)
      ) {
        result.highlightType = entry.key;
      }

      return result;
    });
  }
}
