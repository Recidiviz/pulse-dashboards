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

import { UsTnSuspensionOfDirectSupervisionReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn/UsTnSuspensionOfDirectSupervisionOpportunity/UsTnSuspensionOfDirectSupervisionReferralRecord";
import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsTnSuspensionOfDirectSupervisionReferralRecordRaw[] = [
  {
    isAlmostEligible: false,
    isEligible: true,
    stateCode: "US_TN",
    externalId: "203",
    ineligibleCriteria: {},
    eligibleCriteria: {
      atLeast12MonthsSinceMostRecentPositiveDrugTest: null,
      latestDrugTestIsNegative: {
        latestDrugScreenDate: relativeFixtureDate({ months: -1 }),
        latestDrugScreenResult: "DRUX",
      },
      noSupervisionViolationReportWithin2Years: null,
      onSupervisionAtLeast2YearsAndAssessedRiskLowWhileOnSupervisionAtLeast2Years:
        {
          combinedEligibleDate: relativeFixtureDate({ years: -5, months: -9 }),
          eligibleDate: relativeFixtureDate({ years: -5, months: -9 }),
          minimumTimeServedDate: relativeFixtureDate({
            years: -10,
            months: -8,
          }),
        },
      usTnNoArrestsInPast2Years: null,
      usTnNoSupervisionSanctionWithin1Year: null,
      usTnNoWarrantWithin2Years: null,
      usTnNotInterstateCompactIncoming: null,
      usTnNotOnCommunitySupervisionForLife: null,
      usTnNotOnSuspensionOfDirectSupervision: null,
    },
    formInformation: {
      convictionCounties: ["092 - WEAKLEY"],
      convictionCharge: "RAPE; ROBBERY-ARMED WITH DEADLY WEAPON",
      sentenceDate: relativeFixtureDate({ years: -53, months: -8 }),
      supervisionDuration: "Life",
      supervisionOfficeLocation: "LOCATION 4",
    },
    metadata: {
      latestNegativeArrestCheck: {
        contactDate: relativeFixtureDate({ months: 8 }),
        contactType: "ARRN",
        contactComment:
          "SUPERVISION FEES AND HOW VERIFIED. HAS JPAY FEES. NO NEW ARRESTS PER CRIMINAL COURT CLERK, TN CASE SEARCH, AND WEBSITE.",
      },
    },
  },
  {
    isAlmostEligible: true,
    isEligible: false,
    stateCode: "US_TN",
    externalId: "104",
    ineligibleCriteria: {
        hasFinesFeesBalanceOf0OrIsExempt: {
            amountOwed: 125,
        }
    },
    eligibleCriteria: {
      atLeast12MonthsSinceMostRecentPositiveDrugTest: null,
      latestDrugTestIsNegative: {
        latestDrugScreenDate: relativeFixtureDate({ months: 3, days: 17 }),
        latestDrugScreenResult: "DRUN",
      },
      noSupervisionViolationReportWithin2Years: null,
      onSupervisionAtLeast2YearsAndAssessedRiskLowWhileOnSupervisionAtLeast2Years:
        {
          combinedEligibleDate: relativeFixtureDate({
            years: -3,
            months: 2,
            days: 1,
          }),
          eligibleDate: relativeFixtureDate({ years: -3, months: 2, days: 1 }),
          minimumTimeServedDate: relativeFixtureDate({
            years: -12,
            months: 3,
            days: 15,
          }),
        },
      usTnNoArrestsInPast2Years: null,
      usTnNoSupervisionSanctionWithin1Year: null,
      usTnNoWarrantWithin2Years: null,
      usTnNotInterstateCompactIncoming: null,
      usTnNotOnCommunitySupervisionForLife: null,
      usTnNotOnSuspensionOfDirectSupervision: null,
    },
    formInformation: {
      convictionCounties: ["016 - COFFEE"],
      convictionCharge: "ATT THEFT OF PROPERTY - $10,000-$60,000",
      sentenceDate: relativeFixtureDate({ years: -15, months: 2, days: 1 }),
      supervisionDuration: "17",
      supervisionOfficeLocation: "REGION 1",
    },
    metadata: {
      tabName: "HAS_FINES_FEES_BALANCE",
      latestNegativeArrestCheck: {
        contactDate: relativeFixtureDate({ months: 2, days: 1 }),
        contactType: "ARRN",
        contactComment:
          "ON THE ABOVE DATE AND TIME, THERE WAS A VIRTUAL FACE TO FACE VISIT CONDUCTED VIA FACETIME. HAS A FEE BALANCE.",
      },
    },
  },
  {
    isAlmostEligible: true,
    isEligible: false,
    stateCode: "US_TN",
    externalId: "107",
    ineligibleCriteria: {
        onSupervisionAtLeast2YearsAndAssessedRiskLowWhileOnSupervisionAtLeast2Years: null,
    },
    eligibleCriteria: {
      atLeast12MonthsSinceMostRecentPositiveDrugTest: null,
      latestDrugTestIsNegative: {
        latestDrugScreenDate: relativeFixtureDate({ months: 1, days: 10 }),
        latestDrugScreenResult: "DRUN",
      },
      noSupervisionViolationReportWithin2Years: null,
      onSupervisionAtLeast2YearsAndAssessedRiskLowWhileOnSupervisionAtLeast2Years:
        {
          combinedEligibleDate: relativeFixtureDate({ days: 3 }),
          eligibleDate: relativeFixtureDate({ days: 3 }),
          minimumTimeServedDate: relativeFixtureDate({ months: -1, days: -14 }),
        },
      usTnNoArrestsInPast2Years: null,
      usTnNoSupervisionSanctionWithin1Year: null,
      usTnNoWarrantWithin2Years: null,
      usTnNotInterstateCompactIncoming: null,
      usTnNotOnCommunitySupervisionForLife: null,
      usTnNotOnSuspensionOfDirectSupervision: null,
    },
    formInformation: {
      convictionCounties: ["072 - RHEA"],
      convictionCharge: "SCHED II DRUGS: METH $100,000 FINE",
      sentenceDate: relativeFixtureDate({ years: -7, months: -9 }),
      supervisionDuration: "4",
      supervisionOfficeLocation: "LOCATION 2",
    },
    metadata: {
      tabName: "INSUFFICIENT_TIME_ACCRUED",
      latestNegativeArrestCheck: {
        contactDate: relativeFixtureDate({ months: 2 }),
        contactType: "ARRN",
        contactComment:
          "THEY REPORTED TO THE COUNTY OFFICE AS INSTRUCTED. EMPLOYMENT VERIFIED. NO NEW ARRESTS PER COUNTY JAIL WEBSITE. FEE BALANCE REMAINS. VOLUNTEERS WITH THE JAIL MINISTRY PROGRAM.",
      },
    },
  },
];

export const usTnSuspensionOfDirectSupervisionFixture: FirestoreFixture<UsTnSuspensionOfDirectSupervisionReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
