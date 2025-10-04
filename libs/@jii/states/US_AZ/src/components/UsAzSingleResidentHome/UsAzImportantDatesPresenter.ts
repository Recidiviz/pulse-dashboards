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

import { usAzCopy } from "../../configs/copy";

const { dates } = usAzCopy.importantDates;

export interface DateEntry {
  key: string;
  date: string | undefined;
  config: {
    title: string;
    info: string;
    shortName: string;
  };
  isHighlighted: boolean;
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
    const { acisTprDate, csbdDate, ercdDate, sedDate, csedDate } =
      this.metadata;

    // Create date entries
    const entries: Omit<DateEntry, "isHighlighted">[] = [
      {
        key: "acisTprDate",
        date: acisTprDate,
        config: dates.acisTprDate,
      },
      {
        key: "csbd",
        date: csbdDate,
        config: dates.csbd,
      },
      {
        key: "ercd",
        date: ercdDate,
        config: dates.ercd,
      },
      {
        key: "sed",
        date: sedDate,
        config: dates.sed,
      },
      {
        key: "csed",
        date: csedDate,
        config: dates.csed,
      },
    ];

    // Sort by earliest date first, with valid dates before null dates
    const sortedEntries = entries.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Add highlighting to the first valid date
    return sortedEntries.map((entry, index) => ({
      ...entry,
      isHighlighted: index === 0 && entry.date !== undefined,
    }));
  }
}
