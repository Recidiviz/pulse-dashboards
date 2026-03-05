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
import { startOfDay } from "date-fns";
import { makeAutoObservable } from "mobx";

import { State } from "~@jii/paths";
import { UsAzTFunction } from "~@jii/translation";

import { UsAzDateField } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { UsAzResidentContext } from "../UsAzSingleResidentContext/UsAzSingleResidentContext";

export interface DateEntry {
  dateKey: UsAzDateField;
  date: Date;
  isUpcoming: boolean; // Within 31 days
  isPast: boolean;
  info: string;
  linkUrl: string;
}

export class UsAzImportantDatesPresenter {
  constructor(
    private activeDates: UsAzResidentContext["activeDates"],
    private t: UsAzTFunction,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get dateEntries(): DateEntry[] {
    // Check if DTP exists to determine whether to exclude TPR
    const hasDtpDate = !!this.activeDates.dtpDate;

    // Filter out undefined dates and prioritize acisDtpDates over acisTprDates
    const entries = Object.entries(this.activeDates).flatMap((entry) => {
      // reasserting the type that was lost by Object.entries
      const [field, date] = entry as [UsAzDateField, Date | undefined];
      if (!date) return [];
      if (field === "tprDate" && hasDtpDate) return [];
      return [{ dateKey: field, date }];
    });

    // Sort by earliest date first
    const sortedEntries = entries.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    // Add highlighting and upcoming logic
    const today = startOfDay(new Date());
    const thirtyOneDaysFromNow = new Date(today);
    thirtyOneDaysFromNow.setDate(today.getDate() + 31);

    return sortedEntries.map((entry) => {
      const entryDate = entry.date;
      const isUpcoming =
        entryDate >= today && entryDate <= thirtyOneDaysFromNow;
      const isPast = entryDate < today;

      const infoPageHash = this.getInfoPageHashForDateKey(
        entry.dateKey as UsAzDateField,
      );
      const linkUrl = `${State.Resident.$.UsAzMoreInformation.ImportantDates.buildRelativePath(
        {},
      )}#${infoPageHash}`;

      // default copy for card
      const copyContext: Record<string, unknown> = { linkUrl };
      if (entry.dateKey === "tprDate") {
        copyContext["trLinkUrl"] =
          `${State.Resident.$.UsAzMoreInformation.ImportantDates.buildRelativePath(
            {},
          )}#${this.getInfoPageHashForDateKey("trToAddDate")}`;
      }
      let info = this.t(($) => $.importantDates.dates[entry.dateKey].info, {
        replace: copyContext,
      });
      // copy overrides based on certain date properties
      if (isUpcoming) {
        info = this.t(($) => $.importantDates.upcomingDateMessage, {
          replace: copyContext,
        });
      } else if (isPast) {
        info = this.t(($) => $.importantDates.pastDateMessage, {
          replace: copyContext,
        });
      }

      const result: DateEntry = {
        ...entry,
        isUpcoming,
        isPast,
        info,
        linkUrl,
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
      case "tprDate":
      case "dtpDate":
      case "sedDate":
      case "csedDate":
        return dateKey;
      case "csbdDate":
      case "trToAddDate":
        return "csbdDate-trToAddDate";
      case "ercdDate":
      case "addDate":
        return "ercdDate-addDate";
      default:
        assertNever(dateKey);
    }
  }
}
