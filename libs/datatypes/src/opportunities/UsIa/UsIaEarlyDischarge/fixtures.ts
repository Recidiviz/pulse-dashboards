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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import { UsIaEarlyDischargeRecord, usIaEarlyDischargeSchema } from "./schema";

export const usIaEarlyDischargeFixtures = {
  fullyEligible: makeRecordFixture(usIaEarlyDischargeSchema, {
    stateCode: "US_IA",
    externalId: "001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      usIaNoSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
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
      ],
      penalties: [
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
  }),
  almostEligible: makeRecordFixture(usIaEarlyDischargeSchema, {
    stateCode: "US_IA",
    externalId: "002",
    isEligible: false,
    isAlmostEligible: true,
    eligibleCriteria: {
      usIaNoSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
      notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: null,
      notSupervisionPastGroupFullTermCompletionDateOrUpcoming30Days: {
        eligibleDate: relativeFixtureDate({ months: -7 }),
      },
      supervisionCaseTypeIsNotSexOffense: null,
      supervisionTypeIsNotInvestigation: null,
      usIaNoOpenSupervisionModifiers: null,
      usIaNotExcludedFromEarlyDischargeByParoleCondition: null,
      usIaNotServingIneligibleOffenseForEarlyDischarge: null,
      usIaServingSupervisionCaseAtLeast90Days: {
        supervisionCaseStartDate: relativeFixtureDate({ months: -9 }),
      },
      usIaSupervisionFeesPaid: null,
      usIaSupervisionLevelIs0NotAvailable12Or3: {
        supervisionLevelRawText: "LEVEL 2",
      },
      supervisionLevelIsNotResidentialProgram: null,
    },
    ineligibleCriteria: {},
    formInformation: {},
    metadata: {
      victimFlag: true,
      violationsPast6MonthsFlag: true,
    },
  }),
} satisfies FixtureMapping<UsIaEarlyDischargeRecord>;
