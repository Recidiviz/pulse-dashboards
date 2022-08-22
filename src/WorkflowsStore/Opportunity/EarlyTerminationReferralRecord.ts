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

type EarlyTerminationReason = {
  eligibleDate?: string;
  supervisionType?: string;
  revocationDate?: string;
  supervisionLevel?: string;
};

export type EarlyTerminationCriteria = {
  criteriaName: string;
  reason: EarlyTerminationReason;
};

export type EarlyTerminationReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
    convictionCounty: string;
    judicialDistrictCode: string;
    criminalNumber: string;
    judgeName: string;
    priorCourtDate: string;
    sentenceLengthYears: string;
    crimeNames: string[];
    probationExpirationDate: string;
    probationOfficerFullName: string;
  };
  reasons: EarlyTerminationCriteria[];
  metadata: {
    multipleSentences: boolean;
    outOfState: boolean;
    ICOut: boolean;
  };
};

export interface TransformedEarlyTerminationReferral {
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
  reasons: {
    pastEarlyDischarge?: { eligibleDate?: Date };
    eligibleSupervisionLevel?: { supervisionLevel?: string };
    eligibleSupervisionType?: { supervisionType?: string };
    notActiveRevocationStatus?: { revocationDate?: Date };
  };
  metadata: {
    multipleSentences: boolean;
    outOfState: boolean;
    ICOut: boolean;
  };
}

// Extends Record to facilitate `additionalDepositionLines` dynamic keys
export interface EarlyTerminationDraftData extends Record<string, string> {
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
  sentenceLength: string;
}
