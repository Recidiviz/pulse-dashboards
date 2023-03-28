// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";

import { TransformFunction } from "../subscriptions";
import { fieldToDate } from "../utils";
import { WithCaseNotes } from "./types";

export type UsMiMinimumTelephoneReportingReferralRecord = {
  stateCode: string;
  externalId: string;
  criteria: {
    sixMonthsPastSuperivionStart: {
      eligibleDate: Date;
    };
    usMiNotServingAnOuilOrOwi: {
      ineligibleOffenses: string[];
    };
    initialCompassScoreMinimumOrMedium: {
      assessmentLevel: string;
      eligibleDate: Date;
    };
    usMiNotServingIneligibleOffensesOnSupervision: {
      ineligibleOffenses: string[];
    };
    supervisionNotWithin90DaysOfFullTermDischarge: {
      eligibleDate: Date;
    };
  };
} & WithCaseNotes;

export const transformReferral: TransformFunction<
  UsMiMinimumTelephoneReportingReferralRecord
> = (record) => {
  if (!record) {
    throw new Error("No record found");
  }

  const transformedRecord = cloneDeep(
    record
  ) as UsMiMinimumTelephoneReportingReferralRecord;

  const { criteria } = record;

  transformedRecord.criteria.sixMonthsPastSuperivionStart = {
    eligibleDate: fieldToDate(
      criteria.sixMonthsPastSuperivionStart.eligibleDate
    ),
  };

  transformedRecord.criteria.initialCompassScoreMinimumOrMedium = {
    ...transformedRecord.criteria.initialCompassScoreMinimumOrMedium,
    eligibleDate: fieldToDate(
      criteria.initialCompassScoreMinimumOrMedium.eligibleDate
    ),
  };

  transformedRecord.criteria.supervisionNotWithin90DaysOfFullTermDischarge = {
    eligibleDate: fieldToDate(
      criteria.supervisionNotWithin90DaysOfFullTermDischarge.eligibleDate
    ),
  };

  return transformedRecord as UsMiMinimumTelephoneReportingReferralRecord;
};
