// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { relativeFixtureDate } from "../../../utils/zod";
import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTnCompliantReporting2025PolicyRecord,
  usTnCompliantReporting2025PolicySchema,
} from "./schema";

export const usTnCompliantReporting2025PolicyFixtures = {
  eligible: makeRecordFixture(usTnCompliantReporting2025PolicySchema, {
    stateCode: "US_TN",
    externalId: "100",
    eligibleCriteria: {
      usTnNoArrestsInPast6Months: null,
      usTnNoSupervisionSanctionWithin3Months: null,
      noSupervisionViolationReportWithin6Months: null,
      usTnNoSupervisionViolationsReportWithin6Months: null,
      usTnNotInDayReportingCenterLocation: null,
      usTnNotOnCommunitySupervisionForLife: null,
      usTnNotServingIneligibleCrOffensePolicyB: null,
      latestDrugTestIsNegativeOrMissing: {
        latestDrugScreenDate: relativeFixtureDate({ days: -200 }),
        latestDrugScreenResult: "DRUN",
      },
      onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
        eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
      },
      usTnAssessedNotHighOnStrongRDomains: {
        assessmentDate: relativeFixtureDate({ days: -121 }),
        assessmentMetadata: {
          AGGRESSION_NEED_LEVEL: "LOW",
          ALCOHOL_DRUG_NEED_LEVEL: "MOD",
        },
      },
      usTnFeeScheduleOrPermanentExemption: {
        contactType: null,
        currentExemptions: "SSDB",
        latestFeeContactDate: null,
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      sentenceStartDate: relativeFixtureDate({ years: -2, days: -555 }),
      currentOffenses: ["FAILURE TO APPEAR (FELONY)"],
      driversLicense: "12345678",
      restitutionAmt: 400.0,
      restitutionMonthlyPayment: 0.0,
      restitutionMonthlyPaymentTo: ["2ND JUDICIAL DRUG TASK FORCE"],
      judicialDistrict: ["17"],
    },
    metadata: {
      eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
      convictionCounties: ["123 - ABC", "456 - DEF"],
      ineligibleOffensesExpired: ["HABITUAL TRAFFIC OFFENDER"],
      latestNegativeArrestCheck: {
        contactDate: relativeFixtureDate({ years: -1, days: -33 }),
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: relativeFixtureDate({ days: -222 }),
        contactType: "SPET",
      },
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligible: makeRecordFixture(usTnCompliantReporting2025PolicySchema, {
    stateCode: "US_TN",
    externalId: "104",
    eligibleCriteria: {
      usTnNoArrestsInPast6Months: null,
      usTnNoSupervisionSanctionWithin3Months: null,
      noSupervisionViolationReportWithin6Months: null,
      usTnNoSupervisionViolationsReportWithin6Months: null,
      usTnNotInDayReportingCenterLocation: null,
      usTnNotOnCommunitySupervisionForLife: null,
      usTnNotServingIneligibleCrOffensePolicyB: null,
      latestDrugTestIsNegativeOrMissing: {
        latestDrugScreenDate: relativeFixtureDate({ days: -111 }),
        latestDrugScreenResult: "DRUN",
      },
      onMinimumOrLowMediumSupervisionAtLeastSixMonths: {
        eligibleDate: relativeFixtureDate({ months: -1, days: -5 }),
      },
      usTnAssessedNotHighOnStrongRDomains: {
        assessmentDate: relativeFixtureDate({ days: -33 }),
        assessmentMetadata: {
          AGGRESSION_NEED_LEVEL: "LOW",
          ALCOHOL_DRUG_NEED_LEVEL: "MOD",
        },
      },
      usTnFeeScheduleOrPermanentExemption: {
        contactType: null,
        currentExemptions: "SSDB",
        latestFeeContactDate: null,
      },
    },
    ineligibleCriteria: {
      usTnNoRecentCompliantReportingRejections: {
        contactCode: ["DECF", "DEDU"],
      },
    },
    formInformation: {
      sentenceStartDate: relativeFixtureDate({ months: -20 }),
      expirationDate: relativeFixtureDate({ days: 1000 }),
      sentenceLengthDays: "1700",
      currentOffenses: ["THEFT OF PROPERTY - $10,000-$60,000"],
      supervisionFeeArrearaged: false,
      judicialDistrict: [],
    },
    metadata: {
      eligibleDate: relativeFixtureDate({ days: -15 }),
      tabName: "MISSING_1_CRITERIA",
      convictionCounties: [],
      ineligibleOffensesExpired: ["TNCARE FRAUD"],
      latestNegativeArrestCheck: {
        contactDate: relativeFixtureDate({ months: -1 }),
        contactType: "ARRN",
      },
      mostRecentSpeNote: {
        contactDate: relativeFixtureDate({ months: -1 }),
        contactType: "SPEC",
      },
    },
    caseNotes: {
      "CURRENT OFFENSES": [
        {
          eventDate: null,
          noteBody: "THEFT OF PROPERTY - $10,000-$60,000",
          noteTitle: null,
        },
      ],
    },
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<UsTnCompliantReporting2025PolicyRecord>;
