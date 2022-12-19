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

import { TransformFunction } from "../subscriptions";
import { fieldToDate, optionalFieldToDate } from "../utils";

export type EarlyTerminationReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
    convictionCounty: string;
    judicialDistrictCode: string;
    criminalNumber: string;
    judgeName: string;
    priorCourtDate: Date;
    sentenceLengthYears: number;
    crimeNames: string[];
    probationExpirationDate: Date;
    probationOfficerFullName: string;
  };
  criteria: {
    supervisionPastEarlyDischargeDate?: { eligibleDate?: Date };
    usNdImpliedValidEarlyTerminationSupervisionLevel?: {
      supervisionLevel?: string;
    };
    usNdImpliedValidEarlyTerminationSentenceType?: { supervisionType?: string };
    usNdNotInActiveRevocationStatus?: { revocationDate?: Date };
  };
  metadata: {
    multipleSentences: boolean;
    outOfState: boolean;
    ICOut: boolean;
  };
};

export type EarlyTerminationDraftData = {
  courtName: string;
  clientName: string;
  convictionCounty: string;
  plaintiff: string;
  finesAndFees: string;
  judicialDistrictCode: string;
  criminalNumber: string;
  judgeName: string;
  priorCourtDate: string;
  sentenceLengthYears: string;
  crimeNames: string;
  probationExpirationDate: string;
  probationOfficerFullName: string;
  statesAttorneyNumber: string;
  statesAttorneyPhoneNumber: string;
  statesAttorneyEmailAddress: string;
  statesAttorneyMailingAddress: string;
  // Extendable to facilitate `additionalDepositionLines` dynamic keys
  [k: string]: string;
};

export const transformReferral: TransformFunction<EarlyTerminationReferralRecord> = (
  record
) => {
  if (!record) {
    throw new Error("No record found");
  }

  const { reasons, ...transformedRecord } = cloneDeep(record);

  const {
    formInformation: {
      priorCourtDate,
      probationExpirationDate,
      sentenceLengthYears,
    },

    criteria,
  } = record;

  transformedRecord.formInformation.priorCourtDate = fieldToDate(
    priorCourtDate
  );
  transformedRecord.formInformation.probationExpirationDate = fieldToDate(
    probationExpirationDate
  );
  transformedRecord.formInformation.sentenceLengthYears = parseInt(
    sentenceLengthYears
  );

  transformedRecord.criteria.supervisionPastEarlyDischargeDate = {
    eligibleDate: fieldToDate(
      criteria.supervisionPastEarlyDischargeDate.eligibleDate
    ),
  };
  transformedRecord.criteria.usNdNotInActiveRevocationStatus = {
    revocationDate: optionalFieldToDate(
      criteria.usNdNotInActiveRevocationStatus.revocationDate
    ),
  };

  return transformedRecord as EarlyTerminationReferralRecord;
};
