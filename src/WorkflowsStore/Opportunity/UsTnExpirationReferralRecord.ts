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
import { fieldToDate, OpportunityValidationError } from "../utils";
import { transformCaseNotes, WithCaseNotes } from ".";

export type UsTnExpirationReferralRecord = {
  stateCode: string;
  externalId: string;
  // Form Information structure from https://docs.google.com/spreadsheets/d/1enzAosYDOrSvshOhJVwm4NZuPSdcIaxV3Ec2_cyzjOw/edit#gid=1757109567
  formInformation: {
    // Offender expired his/her probation on ___
    // Try to read from criteria instead of formInformation

    // Offender plead guilty to ___
    currentOffenses?: string[];

    // Offender appeared in the [county] on case [numbers].
    convictionCounties?: string;
    docketNumbers?: string[];

    // ANY SEX OFFENSE HISTORY
    latestPseCode?: string;
    latestPseDate?: Date;
    latestSexOffenses?: string[];

    // GANG AFFILIATION
    gangAffiliation?: string;

    // LAST KNOWN ADDRESS
    // Try to read from client profile instead of formInformation

    // EMPLOYMENT HISTORY
    latestEmpContactCode?: string;
    latestEmpComment?: string;

    // FEE HISTORY
    latestFeeContactCode?: string;
    // pull balance, payment date, and amount from client profile

    // SPECIAL CONDITIONS
    latestSpeContactCode?: string;
    latestSpeContactDate?: Date;
    latestSpeContactComment?: string;
    // pull conditions from client profile

    // VOTERS RIGHTS RESTORATION
    vrrCode?: string;
  };

  criteria: {
    supervisionPastFullTermCompletionDate: { eligibleDate: Date };
    usTnNoZeroToleranceCodes: {
      zeroToleranceCodes?: string[];
    };
    usTnNotOnLifetimeSupervisionOrLifetimeSentence: {
      lifetimeFlag?: boolean;
    };
  };
} & WithCaseNotes;

export const transformReferral: TransformFunction<UsTnExpirationReferralRecord> = (
  record
) => {
  if (!record) return;

  const transformedRecord = cloneDeep(record) as UsTnExpirationReferralRecord;
  const { criteria } = record;

  transformedRecord.criteria.supervisionPastFullTermCompletionDate = {
    eligibleDate: fieldToDate(
      criteria.supervisionPastFullTermCompletionDate.eligibleDate
    ),
  };

  transformedRecord.caseNotes = transformCaseNotes(record.caseNotes);
  return transformedRecord;
};

export type UsTnExpirationDraftData = {
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
  return (record) => {
    if (!record) {
      throw new Error("No record to validate");
    }

    const {
      eligibleDate,
    } = record.criteria.supervisionPastFullTermCompletionDate;

    if (eligibleDate.getTime() !== client.expirationDate?.getTime())
      throw new OpportunityValidationError(
        "Expiration date does not match client record"
      );
    return record as UsTnExpirationReferralRecord;
  };
}
