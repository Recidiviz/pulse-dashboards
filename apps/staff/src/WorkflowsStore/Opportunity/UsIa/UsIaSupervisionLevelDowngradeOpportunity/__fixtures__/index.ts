// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ClientRecord, relativeFixtureDate } from "~datatypes";

import { UsIaEarlyDischargeReferralRecordRaw } from "../../UsIaEarlyDischargeOpportunity";
import { UsIaSupervisionLevelDowngradeReferralRecordRaw } from "../UsIaSupervisionLevelDowngradeReferralRecord";

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_ia_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_IA",
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

export const usIaSupervisionLevelDowngradeRecordFixture: UsIaSupervisionLevelDowngradeReferralRecordRaw =
  {
    stateCode: "US_IA",
    externalId: "001",
    eligibleCriteria: {
      usIaSupervisionFeesPaid: {
        supervisionFeesPaidDate: relativeFixtureDate({ months: -12 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    eligibleDate: relativeFixtureDate({ months: -12 }),
  };

export const usIaEarlyDischargeRecordFixture: UsIaEarlyDischargeReferralRecordRaw =
  {
    stateCode: "US_IA",
    externalId: "001",
    eligibleCriteria: {
      noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
      notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: null,
      notSupervisionPastGroupFullTermCompletionDateOrUpcoming30Days: {
        eligibleDate: relativeFixtureDate({ months: -11 }),
      },
      supervisionCaseTypeIsNotSexOffense: null,
      supervisionTypeIsNotInvestigation: null,
      usIaNoOpenSupervisionModifiers: null,
      usIaNotExcludedFromEarlyDischargeByParoleCondition: null,
      usIaNotServingIneligibleOffenseForEarlyDischarge: null,
      usIaServingSupervisionCaseAtLeast90Days: {
        supervisionCaseStartDate: relativeFixtureDate({ months: -16 }),
      },
      usIaSupervisionFeesPaid: null,
      usIaSupervisionLevelIs0NotAvailable12Or3: {
        supervisionLevelRawText: "LEVEL 3",
      },
      supervisionLevelIsNotResidentialProgram: {
        supervisionLevelRawText: "LEVEL 3",
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    formInformation: {
      USCitizenshipStatus: "US Citizen",
      charges: [
        {
          causeNumber: "CN123",
          crimeCdOffenseType: "Felony",
          jurisdiction: "Polk",
          classificationTypeRawText: "Felony",
          counts: 1,
          description: "Sample offense",
          statute: "XYZ-123",
          tdd: "2025-01-01",
          sdd: "",
          chargeExternalId: "CHARGE-001",
        },
        {
          causeNumber: "FT987",
          crimeCdOffenseType: "Felony",
          jurisdiction: "Monroe",
          classificationTypeRawText: "Felony",
          counts: 2,
          description: "Some other offense",
          statute: "LMN-444",
          tdd: "2025-03-01",
          sdd: "",
          chargeExternalId: "CHARGE-002",
        },
      ],
      penalties: [
        {
          penaltyValue: "$20.00",
          sentencePenaltyModifier: "None",
          sentencePenaltyType: "Fine",
          sentenceDate: "2023-01-01",
          chargeExternalId: "CHARGE-002",
        },
        {
          penaltyValue: "1, 3, 21",
          sentencePenaltyModifier: "Increased",
          sentencePenaltyType: "Jail",
          sentenceDate: "2024-01-01",
          chargeExternalId: "CHARGE-001",
        },
      ],
      staffAttributes: [
        {
          staffTitle: "Probation Officer",
          workUnit: "Case Management",
          officerExternalId: "OFFICER-001",
        },
      ],
    },
    eligibleDate: relativeFixtureDate({ months: -12 }),
    metadata: {
      victimFlag: true,
    },
  };

export const usIaSupervisionLevelDowngradeEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["usIaSupervisionLevelDowngrade"],
};
