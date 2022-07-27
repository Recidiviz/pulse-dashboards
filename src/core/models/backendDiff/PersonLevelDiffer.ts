/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { isEqual } from "lodash";

import { PrisonPopulationPersonLevelRecord, TimePeriod } from "../types";
import { Differ } from "./Differ";

/**
 * Differ that compares counts between records with records with keys of a specific type.
 */
/* eslint-disable class-methods-use-this */
export class PersonLevelDiffer extends Differ<
  PrisonPopulationPersonLevelRecord,
  PrisonPopulationPersonLevelRecord
> {
  emptyValue = undefined;

  constructor(maxDiffs: number) {
    super();
    this.maxDiffs = maxDiffs;
  }

  getKey(result: PrisonPopulationPersonLevelRecord): string {
    // Concatenate ID, time period, and age group to get something that's probably unique.
    return `${result.stateId}${
      result.timePeriod ? `|${this.convertTimePeriod(result.timePeriod)}` : ""
    }|${result.ageGroup}`;
  }

  getValue(
    result: PrisonPopulationPersonLevelRecord
  ): PrisonPopulationPersonLevelRecord {
    return result;
  }

  compare(
    value: PrisonPopulationPersonLevelRecord,
    other: PrisonPopulationPersonLevelRecord
  ): boolean {
    if (value === undefined || other === undefined) {
      // if both are undefined, something has gone wrong, and we'll see it in the diff
      return false;
    }
    return isEqual(
      this.transformForComparison(value),
      this.transformForComparison(other)
    );
  }

  transformForComparison(
    record: PrisonPopulationPersonLevelRecord
  ): PrisonPopulationPersonLevelRecord {
    const transformed = {
      ...record,
      // new backend doesn't return admissionReason for PrisonToSupervision
      admissionReason: record.admissionReason || "Unknown",
      // new backend doesn't return lastUpdated
      lastUpdated: new Date(9999, 12, 31),
    };
    if (record.timePeriod) {
      // new backend returns timePeriod as a "months_" string instead of a TimePeriod
      transformed.timePeriod = this.convertTimePeriod(record.timePeriod);
    }

    return transformed;
  }

  convertTimePeriod(timePeriod: TimePeriod): TimePeriod {
    switch (timePeriod.toString()) {
      case "months_0_6":
        return "6";
      case "months_7_12":
        return "12";
      case "months_13_24":
        return "24";
      case "months_25_60":
        return "60";
      default:
        return timePeriod;
    }
  }
}
