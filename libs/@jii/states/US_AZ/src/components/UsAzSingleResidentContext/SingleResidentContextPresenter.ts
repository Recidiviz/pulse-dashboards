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

import { makeAutoObservable } from "mobx";

import { dateStringSchema, ResidentMetadata } from "~datatypes";

// Shared constant for all US_AZ date field names that we expect to use
const US_AZ_DATE_KEYS = [
  "tprDate",
  "dtpDate",
  "csbdDate",
  "ercdDate",
  "sedDate",
  "csedDate",
  "addDate",
  "trToAddDate",
] as const;
/**
 * Normalized date ID literals that represent the types of dates found in
 * resident metadata but are not necessarily the same as the metadata
 * field names themselves
 */
export type UsAzDateField = (typeof US_AZ_DATE_KEYS)[number];
export interface DateEntry {
  dateKey: UsAzDateField;
  date: Date;
  isUpcoming: boolean; // Within 31 days
  isPast: boolean;
  info: string;
  linkUrl: string;
}
export type UsAzDisplayedDates = Pick<DateEntry, "dateKey" | "date">[];

/**
 * Maps each normalized date ID to the resident_metadata field that holds
 * the corresponding non-DPR (TIS) date.
 */
const TIS_METADATA_FIELD_BY_DATE_KEY = {
  tprDate: "acisTprDate",
  dtpDate: "acisDtpDate",
  csbdDate: "csbdDateV2",
  ercdDate: "ercdDateV2",
  sedDate: "sedDate",
  csedDate: "csedDate",
  addDate: "addDate",
  trToAddDate: "trToAddDate",
} as const satisfies Record<UsAzDateField, keyof ResidentMetadata<"US_AZ">>;

function parseDate(value: string | Date | undefined): Date | undefined {
  if (typeof value === "string") {
    return dateStringSchema.parse(value);
  }
  return value;
}

/**
 * Capitalizes the first letter, leaving the remainder unchained.
 * If the input is a literal or union of strings, the return type will be transformed as well
 * (i.e. `(input: "foo" | "bar") => "Foo" | "Bar"`, but `(input: string) => string`)
 */
function capitalize<S extends string>(input: S) {
  return (input.charAt(0).toUpperCase() + input.slice(1)) as Capitalize<S>;
}

export class SingleResidentContextPresenter {
  constructor(public metadata: ResidentMetadata<"US_AZ">) {
    makeAutoObservable(this);
  }

  /**
   * "Qualified" here means they meet the basic eligibility criteria
   * but have not yet completed the required programming
   */
  get isDprQualified(): boolean {
    return Boolean(
      this.metadata.isDprEligible && !this.metadata.hasAnyDprProgramCompleted,
    );
  }

  /**
   * "Active" means the DPR versions of their dates are already in effect
   */
  get isDprActive(): boolean {
    return Boolean(
      this.metadata.isDprEligible && this.metadata.hasAnyDprProgramCompleted,
    );
  }

  /**
   * This is a mapping of normalized date identifiers to the values that are currently in
   * effect for the resident. The metadata contains multiple alternative sets of date fields
   * that may apply to the resident under different conditions, but only one value is actually
   * effective (others may be used for projection or illustration), and this property
   * encapsulates the logic that determines the effective value for each date type.
   */
  get activeDates(): Record<UsAzDateField, Date | undefined> {
    return Object.fromEntries(
      US_AZ_DATE_KEYS.map((key) => {
        let dateValue: Date | undefined;
        // SED is unaffected by DPR status
        if (key === "sedDate") {
          dateValue = parseDate(this.metadata.sedDate);
          // DPR-active residents read from the standalone ingested DPR date fields.
        } else if (this.isDprActive) {
          dateValue = parseDate(this.metadata[`dpr${capitalize(key)}`]);
        } else {
          // Non-DPR case: read from the standalone ingested fields.
          dateValue = parseDate(
            this.metadata[TIS_METADATA_FIELD_BY_DATE_KEY[key]],
          );
        }
        return [key, dateValue];
      }),
      // TS can't infer the keys correctly, but we have generated this object by mapping the list of constants
    ) as Record<UsAzDateField, Date | undefined>;
  }

  /**
   * Dates filtered down to only those that should be displayed for this person on the
   * home page and the personalized section of the date description page.
   *
   * The order of results is not meaningful/guaranteed.
   */
  get displayedDates(): UsAzDisplayedDates {
    // Check if DTP exists to determine whether to exclude TPR
    const hasDtpDate = !!this.activeDates.dtpDate;

    // Filter out undefined dates and prioritize acisDtpDates over acisTprDates
    return Object.entries(this.activeDates).flatMap((entry) => {
      // reasserting the type that was lost by Object.entries
      const [field, date] = entry as [UsAzDateField, Date | undefined];
      if (!date) return [];
      if (field === "tprDate" && hasDtpDate) return [];
      return [{ dateKey: field, date }];
    });
  }
}
