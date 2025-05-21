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
        usIaNotExcludedFromEarlyDischargeByParoleConditions: null,
        usIaNotServingIneligibleOffenseForEarlyDischarge: null,
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -16 }),
        },
        usIaSupervisionFeesPaid: null,
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 3",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {},
      eligibleDate: relativeFixtureDate({ months: -12 }),
      metadata: {
        victimFlag: true,
      },
    },
    {
      stateCode: "US_IA",
      externalId: "002",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: true,
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: true,
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
          eligibleDate: relativeFixtureDate({ months: -7 }),
        },
        supervisionCaseTypeIsNotSexOffense: true,
        supervisionTypeIsNotInvestigation: true,
        usIaNoOpenSupervisionModifiers: null,
        usIaNotExcludedFromEarlyDischargeByParoleConditions: null,
        usIaNotServingIneligibleOffenseForEarlyDischarge: null,
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -17 }),
        },
        usIaSupervisionFeesPaid: null,
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 3",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {},
      eligibleDate: relativeFixtureDate({ months: -14 }),
      metadata: {
        victimFlag: true,
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
        supervisionCaseTypeIsNotSexOffense: true,
        supervisionTypeIsNotInvestigation: true,
        usIaNoOpenSupervisionModifiers: true,
        usIaNotExcludedFromEarlyDischargeByParoleConditions: null,
        usIaNotServingIneligibleOffenseForEarlyDischarge: true,
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -2 }),
        },
        usIaSupervisionFeesPaid: null,
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 1",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {},
      eligibleDate: relativeFixtureDate({ months: -17 }),
      metadata: {
        victimFlag: true,
      },
    },
    {
      stateCode: "US_IA",
      externalId: "004",
      eligibleCriteria: {
        noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
        notServingALifeSentenceOnSupervisionOrSupervisionOutOfState: true,
        notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
          eligibleDate: relativeFixtureDate({ months: -3 }),
        },
        supervisionCaseTypeIsNotSexOffense: null,
        supervisionTypeIsNotInvestigation: true,
        usIaNoOpenSupervisionModifiers: null,
        usIaNotExcludedFromEarlyDischargeByParoleConditions: true,
        usIaNotServingIneligibleOffenseForEarlyDischarge: true,
        usIaServingSupervisionCaseAtLeast90Days: {
          supervisionCaseStartDate: relativeFixtureDate({ months: -8 }),
        },
        usIaSupervisionFeesPaid: {
          supervisionFeeBalance: 2000,
        },
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 2",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {},
      eligibleDate: relativeFixtureDate({ months: -18 }),
      metadata: {
        victimFlag: true,
      },
    },
  ]);
