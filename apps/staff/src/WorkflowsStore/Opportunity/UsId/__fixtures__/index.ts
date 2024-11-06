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

import {} from "date-fns";

import { ClientRecord } from "~datatypes";

import { EarnedDischargeReferralRecordRaw } from "../EarnedDischargeOpportunity";
import { LSUReferralRecordRaw } from "../LSUOpportunity";
import { UsIdPastFTRDReferralRecordRaw } from "../UsIdPastFTRDOpportunity";

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_id_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_ID",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: new Date("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

export const LSUReferralRecordFixture: LSUReferralRecordRaw = {
  stateCode: "US_ID",
  externalId: "001",
  formInformation: {
    chargeDescriptions: [
      "GRAND THEFT BY POSSESSION",
      "POSSESSION OF A CONTROLLED SUBSTANCE",
      "ILLEGAL POSSESSION OF CONTROLLED SUBSTANCE W/INTENT TO DEL",
    ],
    currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
    assessmentDate: "2022-03-02",
    assessmentScore: "25",
    latestNegativeDrugScreenDate: "2022-03-02",
    txDischargeDate: "2022-08-04",
    txNoteTitle: "TX GOAL",
    txNoteBody: "TX Goal: Complete GEO successfully.",
  },
  eligibleCriteria: {
    usIdLsirLevelLowFor90Days: {
      riskLevel: "LOW",
      eligibleDate: "2022-01-03",
    },
    negativeDaWithin90Days: {
      latestUaDates: ["2022-05-28"],
      latestUaResults: [false],
    },
    noFelonyWithin24Months: null,
    usIdIncomeVerifiedWithin3Months: {
      incomeVerifiedDate: "2022-06-03",
    },
    onSupervisionAtLeastOneYear: {
      eligibleDate: "2022-06-01",
    },
    usIdNoActiveNco: {
      activeNco: false,
    },
  },
  ineligibleCriteria: {},
  eligibleStartDate: "2022-11-05",
  caseNotes: {
    "Special Conditions": [
      {
        noteTitle: "MUST JOURNAL",
        noteBody: "Client must journal at least once a week",
        eventDate: "2022-08-22",
      },
    ],
    Treatment: [
      {
        noteTitle: "STARTED",
        noteBody: "Treatment started",
        eventDate: "2022-06-17",
      },
      {
        noteTitle: "COMPLETED",
        noteBody: "Treatment successfully completed",
        eventDate: "2022-09-22",
      },
    ],
  },
  isEligible: true,
  isAlmostEligible: false,
};

export const AlmostEligibleLSUReferralRecordFixture: LSUReferralRecordRaw = {
  stateCode: "US_ID",
  externalId: "us_xx_103",
  formInformation: {
    chargeDescriptions: [
      "GRAND THEFT BY POSSESSION",
      "POSSESSION OF A CONTROLLED SUBSTANCE",
      "ILLEGAL POSSESSION OF CONTROLLED SUBSTANCE W/INTENT TO DEL",
    ],
    currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
    assessmentDate: "2022-03-02",
    assessmentScore: "25",
    latestNegativeDrugScreenDate: "2022-03-02",
    txDischargeDate: "2022-08-04",
    txNoteTitle: "TX GOAL",
    txNoteBody: "TX Goal: Complete GEO successfully.",
  },
  eligibleCriteria: {
    usIdLsirLevelLowFor90Days: {
      riskLevel: "LOW",
      eligibleDate: "2022-01-03",
    },
    negativeDaWithin90Days: {
      latestUaDates: ["2022-05-28"],
      latestUaResults: [false],
    },
    noFelonyWithin24Months: null,
    onSupervisionAtLeastOneYear: {
      eligibleDate: "2022-06-01",
    },
    usIdNoActiveNco: {
      activeNco: false,
    },
  },
  ineligibleCriteria: {
    usIdIncomeVerifiedWithin3Months: null,
  },
  eligibleStartDate: "2022-10-05",
  caseNotes: {
    "Special Conditions": [
      {
        noteTitle: "MUST JOURNAL",
        noteBody: "Client must journal at least once a week",
        eventDate: "2022-08-22",
      },
    ],
    Treatment: [
      {
        noteTitle: "STARTED",
        noteBody: "Treatment started",
        eventDate: "2022-06-17",
      },
      {
        noteTitle: "COMPLETED",
        noteBody: "Treatment successfully completed",
        eventDate: "2022-09-22",
      },
    ],
  },
  isEligible: false,
  isAlmostEligible: true,
};

export const EarnedDischargeReferralRecordFixture: EarnedDischargeReferralRecordRaw =
  {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeDaWithin90Days: {
        latestUaDates: ["2022-05-28"],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: null,
      usIdParoleDualSupervisionPastEarlyDischargeDate: {
        eligibleDate: "2022-03-17",
        sentenceType: "DUAL",
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: "2022-10-05",
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: "2022-08-22",
        },
      ],
      Treatment: [
        {
          noteTitle: "STARTED",
          noteBody: "Treatment started",
          eventDate: "2022-06-17",
        },
        {
          noteTitle: "COMPLETED",
          noteBody: "Treatment successfully completed",
          eventDate: "2022-09-22",
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  };

export const earnedDischargeAlmostEligibleSupervisionLength: EarnedDischargeReferralRecordRaw =
  {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeDaWithin90Days: {
        latestUaDates: ["2022-05-28"],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: null,
    },
    ineligibleCriteria: {
      onProbationAtLeastOneYear: {
        eligibleDate: "2023-12-10",
      },
    },
    eligibleStartDate: "2022-10-05",
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: "2022-08-22",
        },
      ],
      Treatment: [
        {
          noteTitle: "STARTED",
          noteBody: "Treatment started",
          eventDate: "2022-06-17",
        },
        {
          noteTitle: "COMPLETED",
          noteBody: "Treatment successfully completed",
          eventDate: "2022-09-22",
        },
      ],
    },
    isEligible: false,
    isAlmostEligible: true,
  };

export const LSUEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["LSU"],
};

export const EarnedDischargeEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  supervisionStartDate: new Date("2019-12-20"),
  allEligibleOpportunities: ["earnedDischarge"],
};

export const pastFTRDRecordEligibleFixture: UsIdPastFTRDReferralRecordRaw = {
  stateCode: "US_ID",
  externalId: "001",
  eligibleCriteria: {
    supervisionPastFullTermCompletionDate: {
      eligibleDate: "2022-01-03",
    },
  },
  ineligibleCriteria: {},
  caseNotes: {},
  isEligible: true,
  isAlmostEligible: false,
};

export const pastFTRDAlmostEligibleFixture: UsIdPastFTRDReferralRecordRaw = {
  stateCode: "US_ID",
  externalId: "002",
  eligibleCriteria: {},
  ineligibleCriteria: {
    supervisionPastFullTermCompletionDate: {
      eligibleDate: "2022-09-01",
    },
  },
  caseNotes: {},
  isEligible: false,
  isAlmostEligible: true,
};

export const pastFTRDEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["pastFTRD"],
};
