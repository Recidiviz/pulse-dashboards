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

import { relativeFixtureDate } from "~datatypes";

import { UsIaEarlyDischargeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsIa";
import { fixtureWithIdKey } from "./utils";

export const usIaEarlyDischargeReferralsFixture =
  fixtureWithIdKey<UsIaEarlyDischargeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_IA",
      externalId: "001",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: null,
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
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
    },
    {
      stateCode: "US_IA",
      externalId: "002",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: {
          latestViolationReportDates: null,
          violationExpirationDate: relativeFixtureDate({ months: -6 }),
        },
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: {
          lifeSentence: false,
          ineligibleOffenses: null,
        },
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
          eligibleDate: relativeFixtureDate({ months: -7 }),
        },
        supervisionCaseTypeIsNotSexOffense: {
          rawSexOffenseCaseTypes: null,
        },
        supervisionTypeIsNotInvestigation: {
          rawSupervisionTypes: null,
        },
        usIaNoOpenSupervisionModifiers: null,
        usIaNotExcludedFromEarlyDischargeByParoleCondition: null,
        usIaNotServingIneligibleOffenseForEarlyDischarge: null,
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -17 }),
        },
        usIaSupervisionFeesPaid: null,
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 3",
        },
        supervisionLevelIsNotResidentialProgram: {
          supervisionLevelRawText: "LEVEL 1",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {
        USCitizenshipStatus: "Non-Citizen",
        charges: [
          {
            causeNumber: "CN456",
            crimeCdOffenseType: "Misdemeanor",
            jurisdiction: "County Court",
            classificationTypeRawText: "Misdemeanor",
            counts: 2,
            description: "Another sample offense",
            statute: "ABC-789",
            tdd: "2026-05-05",
            sdd: "",
            chargeExternalId: "CHARGE-003",
          },
        ],
        penalties: [
          {
            penaltyValue: "1, 0, 5",
            sentencePenaltyModifier: "Reduced",
            sentencePenaltyType: "Probation",
            sentenceDate: "2024-05-05",
            chargeExternalId: "CHARGE-003",
          },
        ],
        staffAttributes: [
          {
            staffTitle: "Officer",
            workUnit: "Special Unit",
            officerExternalId: "OFFICER-002",
          },
        ],
      },
      eligibleDate: relativeFixtureDate({ months: -14 }),
      metadata: {
        victimFlag: true,
        victimContactInfo: [
          {
            VictimFirstNm: "Jane",
            VictimLastNm: "Smith",
            EmailAddress: "jane.smith@email.com",
            CellPhone: "000-555-1234",
            Address1: "123 Fake St",
            City: "Des Moines",
            State: "IA",
            ZipCode: "50309",
          },
          {
            VictimFirstNm: "Alice",
            VictimMiddleNm: "B.",
            VictimLastNm: "Johnson",
            EmailAddress: "alice.johnson@email.com",
            CellPhone: "000-555-5555",
            Address1: "456 Fake Ave",
            City: "Cedar Rapids",
            State: "IA",
            ZipCode: "52401",
            Country: "USA",
          },
        ],
        violationsPast6MonthsFlag: true,
      },
    },
    {
      stateCode: "US_IA",
      externalId: "003",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: null,
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
          eligibleDate: relativeFixtureDate({ months: -1 }),
        },
        supervisionCaseTypeIsNotSexOffense: {
          rawSexOffenseCaseTypes: null,
        },
        supervisionTypeIsNotInvestigation: {
          rawSupervisionTypes: null,
        },
        usIaNoOpenSupervisionModifiers: {
          openSupervisionModifiers: null,
        },
        usIaNotExcludedFromEarlyDischargeByParoleCondition: null,
        usIaNotServingIneligibleOffenseForEarlyDischarge: {
          ineligibleOffenses: null,
        },
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -2 }),
        },
        usIaSupervisionFeesPaid: null,
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 1",
        },
        supervisionLevelIsNotResidentialProgram: {
          supervisionLevelRawText: null,
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {
        USCitizenshipStatus: "US Citizen",
        charges: [
          {
            causeNumber: "CN789",
            crimeCdOffenseType: "Felony",
            jurisdiction: "Municipal Court",
            classificationTypeRawText: "Felony",
            counts: 1,
            description: "Minor offense",
            statute: "XYZ-456",
            tdd: "2025-07-01",
            sdd: "",
            chargeExternalId: "CHARGE-004",
          },
        ],
        penalties: [
          {
            penaltyValue: "$18.42",
            sentencePenaltyModifier: "None",
            sentencePenaltyType: "Fine",
            sentenceDate: "2023-07-01",
            chargeExternalId: "CHARGE-004",
          },
        ],
        staffAttributes: [
          {
            staffTitle: "Parole Officer",
            workUnit: "Central Unit",
            officerExternalId: "OFFICER-003",
          },
        ],
      },
      eligibleDate: relativeFixtureDate({ months: -17 }),
      metadata: {
        victimFlag: true,
        victimContactInfo: [
          {
            VictimFirstNm: "Alice",
            VictimMiddleNm: "B.",
            VictimLastNm: "Johnson",
            EmailAddress: "alice.johnson@email.com",
            CellPhone: "000-555-5555",
            Address1: "456 Fake Ave",
            City: "Cedar Rapids",
            State: "IA",
            ZipCode: "52401",
            Country: "USA",
          },
        ],
        dnaRequirementStatus: "Maybe Required",
        dnaSubmittedFlag: true,
        mostRecentDnaSubmittedDate: relativeFixtureDate({ days: -10 }),
      },
    },
    {
      stateCode: "US_IA",
      externalId: "004",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: {
          lifeSentence: false,
          ineligibleOffenses: null,
        },
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
          eligibleDate: relativeFixtureDate({ months: -3 }),
        },
        supervisionCaseTypeIsNotSexOffense: null,
        supervisionTypeIsNotInvestigation: {
          rawSupervisionTypes: null,
        },
        usIaNoOpenSupervisionModifiers: null,
        usIaNotExcludedFromEarlyDischargeByParoleCondition: {
          conditions: null,
        },
        usIaNotServingIneligibleOffenseForEarlyDischarge: {
          ineligibleOffenses: null,
        },
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -8 }),
        },
        usIaSupervisionFeesPaid: {
          initialBalance: 2000,
          currentBalance: 2000,
        },
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 2",
        },
        supervisionLevelIsNotResidentialProgram: null,
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {
        USCitizenshipStatus: "US Citizen",
        charges: [
          {
            causeNumber: "CN987",
            crimeCdOffenseType: "Misdemeanor",
            jurisdiction: "District Court",
            classificationTypeRawText: "Misdemeanor",
            counts: 1,
            description: "Example offense",
            statute: "ABC-123",
            tdd: "2026-10-10",
            sdd: "",
            chargeExternalId: "CHARGE-001",
          },
        ],
        penalties: [
          {
            penaltyValue: "2, 1, 15",
            sentencePenaltyModifier: "Increased",
            sentencePenaltyType: "Incarceration",
            sentenceDate: "2024-10-10",
            chargeExternalId: "CHARGE-001",
          },
        ],
        staffAttributes: [
          {
            staffTitle: "Supervisor",
            workUnit: "Department X",
            officerExternalId: "OFFICER-004",
          },
        ],
      },
      eligibleDate: relativeFixtureDate({ months: -18 }),
      metadata: {},
    },
    {
      stateCode: "US_IA",
      externalId: "005",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: {
          lifeSentence: false,
          ineligibleOffenses: null,
        },
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
          eligibleDate: relativeFixtureDate({ months: -3 }),
        },
        supervisionCaseTypeIsNotSexOffense: null,
        supervisionTypeIsNotInvestigation: {
          rawSupervisionTypes: null,
        },
        usIaNoOpenSupervisionModifiers: null,
        usIaNotExcludedFromEarlyDischargeByParoleCondition: {
          conditions: null,
        },
        usIaNotServingIneligibleOffenseForEarlyDischarge: {
          ineligibleOffenses: null,
        },
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -8 }),
        },
        usIaSupervisionFeesPaid: {
          initialBalance: 2000,
          currentBalance: 2000,
        },
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 2",
        },
        supervisionLevelIsNotResidentialProgram: null,
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {
        USCitizenshipStatus: "US Citizen",
        charges: [
          {
            causeNumber: "CN989",
            crimeCdOffenseType: "Misdemeanor",
            jurisdiction: "District Court",
            classificationTypeRawText: "Misdemeanor",
            counts: 1,
            description: "Example offense",
            statute: "ABC-123",
            tdd: "2026-10-10",
            sdd: "",
            chargeExternalId: "CHARGE-001",
          },
        ],
        penalties: [
          {
            penaltyValue: "2, 1, 15",
            sentencePenaltyModifier: "Increased",
            sentencePenaltyType: "Incarceration",
            sentenceDate: "2024-10-10",
            chargeExternalId: "CHARGE-001",
          },
        ],
        staffAttributes: [
          {
            staffTitle: "Supervisor",
            workUnit: "Department X",
            officerExternalId: "OFFICER-004",
          },
        ],
      },
      eligibleDate: relativeFixtureDate({ months: -18 }),
      metadata: {},
    },
  ]);
