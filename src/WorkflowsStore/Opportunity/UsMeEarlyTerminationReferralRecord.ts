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

export type UsMeEarlyTerminationReferralRecord = {
  stateCode: string;
  externalId: string;
  metadata: {
    supervisionHalfTimeDate: Date;
  };
  criteria: {
    noConvictionWithin6Months: {
      latestConvictions: string[];
    };
    supervisionPastHalfFullTermReleaseDate: {
      sentenceType: string;
      eligibleDate: Date;
    };
  };
} & WithCaseNotes;

export const transformReferral: TransformFunction<
  UsMeEarlyTerminationReferralRecord
> = (record) => {
  if (!record) {
    throw new Error("No record found");
  }

  const { reasons, ...transformedRecord } = cloneDeep(record);

  const { metadata, criteria } = record;

  transformedRecord.metadata.supervisionHalfTimeDate = fieldToDate(
    metadata.supervisionHalfTimeDate
  );

  transformedRecord.criteria.supervisionPastHalfFullTermReleaseDate = {
    ...transformedRecord.criteria.supervisionPastHalfFullTermReleaseDate,
    eligibleDate: fieldToDate(
      criteria.supervisionPastHalfFullTermReleaseDate.eligibleDate
    ),
  };

  return transformedRecord as UsMeEarlyTerminationReferralRecord;
};