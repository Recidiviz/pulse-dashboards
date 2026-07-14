// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { UsTnExpirationRecord } from "~datatypes";

import { OpportunityValidationError } from "../../../../errors";
import { Client } from "../../..";
import { ValidateFunction } from "../../../subscriptions";

export type UsTnExpirationReferralRecord = UsTnExpirationRecord["output"];
export type UsTnExpirationReferralRecordRaw = UsTnExpirationRecord["input"];

export type Contact = {
  contactDate: Date;
  contactType: string;
  contactComment?: string;
};

export type UsTnExpirationDraftData = {
  contactTypes: string;
  expirationDate: string;
  currentOffenses: string;
  convictionCounties: string;
  docketNumbers: string;
  sexOffenseInformation: string;
  alcoholDrugInformation: string;
  address: string;
  employmentInformation: string;
  feeHistory: string;
  specialConditions: string;
  revocationHearings: string;
  newOffenses: string;
  historyOfPriorViolenceEtc: string;
  transferHistory: string;
  medicalPsychologicalHistory: string;
  gangAffiliation: string;
  victimInformation: string;
  votersRightsInformation: string;
  additionalNotes: string;
};

export function getUsTnExpirationValidator(
  client: Client,
): ValidateFunction<UsTnExpirationReferralRecord> {
  return (transformedRecord) => {
    // we only want to validate the eligibility date for elibible/almost eligible records
    // as ineligible (never eligible) clients do not have records
    if (transformedRecord.isEligible || transformedRecord.isAlmostEligible) {
      const { eligibleDate } =
        transformedRecord.eligibleCriteria
          .supervisionPastFullTermCompletionDate;

      if (eligibleDate.getTime() !== client.expirationDate?.getTime())
        throw new OpportunityValidationError(
          "Expiration date does not match client record",
        );
    }
  };
}
