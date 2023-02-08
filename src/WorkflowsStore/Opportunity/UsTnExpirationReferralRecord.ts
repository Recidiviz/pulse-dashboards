// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { Client } from "..";
import { TransformFunction, ValidateFunction } from "../subscriptions";
import {
  fieldToDate,
  OpportunityValidationError,
  optionalFieldToDateArray,
} from "../utils";
import { transformCaseNotes, WithCaseNotes } from ".";

export type Contact = {
  contactDate: Date;
  contactType: string;
  contactComment?: string;
};

export type UsTnExpirationReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    latestPse?: Contact;
    latestEmp?: Contact;
    latestSpe?: Contact;
    latestVrr?: Contact;
    latestFee?: Contact;
    sexOffenses: string[];
    offenses: string[];
    docketNumbers: string[];
    convictionCounties: string[];
    gangAffiliationId?: string;
  };

  criteria: {
    supervisionPastFullTermCompletionDateOrUpcoming1Day: {
      eligibleDate: Date;
    };
    usTnNoZeroToleranceCodesSpans?: {
      zeroToleranceCodeDates?: Date[];
    };
    usTnNotOnLifeSentenceOrLifetimeSupervision: {
      lifetimeFlag: boolean;
    };
  };
} & WithCaseNotes;

export const transformReferral: TransformFunction<
  UsTnExpirationReferralRecord
> = (record) => {
  if (!record) {
    throw new Error("Record not found");
  }

  const transformedRecord = cloneDeep(record) as UsTnExpirationReferralRecord;
  const { criteria } = record;

  transformedRecord.criteria.supervisionPastFullTermCompletionDateOrUpcoming1Day =
    {
      eligibleDate: fieldToDate(
        criteria.supervisionPastFullTermCompletionDateOrUpcoming1Day
          .eligibleDate
      ),
    };
  transformedRecord.criteria.usTnNoZeroToleranceCodesSpans = {
    zeroToleranceCodeDates: optionalFieldToDateArray(
      criteria.usTnNoZeroToleranceCodesSpans?.zeroToleranceCodeDates
    ),
  };

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);
  return transformedRecord;
};

export type UsTnExpirationDraftData = {
  contactTypes: string;
  expirationDate: string;
  currentOffenses: string;
  convictionCounties: string;
  docketNumbers: string;
  sexOffenseInformation: string;
  address: string;
  employmentInformation: string;
  feeHistory: string;
  specialConditions: string;
  votersRightsInformation: string;
};

export function getValidator(
  client: Client
): ValidateFunction<UsTnExpirationReferralRecord> {
  return (transformedRecord) => {
    const { eligibleDate } =
      transformedRecord.criteria
        .supervisionPastFullTermCompletionDateOrUpcoming1Day;

    if (eligibleDate.getTime() !== client.expirationDate?.getTime())
      throw new OpportunityValidationError(
        "Expiration date does not match client record"
      );
  };
}
