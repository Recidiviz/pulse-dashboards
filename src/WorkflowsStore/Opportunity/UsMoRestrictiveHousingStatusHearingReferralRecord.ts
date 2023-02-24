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

export type UsMoRestrictiveHousingStatusHearingReferralRecord = {
  stateCode: string;
  externalId: string;
  metadata: {
    mostRecentHearingDate: Date;
    mostRecentHearingType: string;
    mostRecentHearingFacility: string;
    currentFacility: string;
    restrictiveHousingStartDate: Date;
    bedNumber: string;
    roomNumber: string;
    complexNumber: string;
    buildingNumber: string;
    housingUseCode: string;
  };
  criteria: {
    usMoHasUpcomingHearing: {
      nextReviewDate: Date;
    };
    usMoInRestrictiveHousing: {
      confinementType: string;
    };
  };
};

export const transformReferral: TransformFunction<
  UsMoRestrictiveHousingStatusHearingReferralRecord
> = (record) => {
  if (!record) {
    throw new Error("No record found");
  }

  const transformedRecord = cloneDeep(
    record
  ) as UsMoRestrictiveHousingStatusHearingReferralRecord;
  const { criteria, metadata } = record;

  transformedRecord.criteria.usMoHasUpcomingHearing = {
    nextReviewDate: fieldToDate(criteria.usMoHasUpcomingHearing.nextReviewDate),
  };

  transformedRecord.metadata.mostRecentHearingDate = fieldToDate(
    metadata.mostRecentHearingDate
  );
  transformedRecord.metadata.restrictiveHousingStartDate = fieldToDate(
    metadata.restrictiveHousingStartDate
  );

  return transformedRecord;
};
