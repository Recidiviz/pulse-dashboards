// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { transformCompliantReportingReferral } from "../CompliantReportingOpportunity";

// TODO(#3587): Make this a CompliantReportingReferralRecordFullRaw once the
// remaining new schema fields are added to the schema.
const rawRecordOldSchema = {
  stateCode: "US_TN",
  poFirstName: "TEST",
  poLastName: "OFFICER1",
  clientFirstName: "LINDA",
  clientLastName: "SMITH",
  dateToday: "2022-03-25",
  tdocId: "202",
  drugScreensPastYear: [],
  eligibilityCategory: "c3",
  finesFeesEligible: "exempt",
  remainingCriteriaNeeded: 0,
  currentOffenses: ["FAILURE TO APPEAR (FELONY)"],
  sentenceStartDate: "2020-03-07",
  supervisionType: "TN PROBATIONER",
  supervisionFeeArrearaged: false,
  supervisionFeeExemptionType: ["SSDB", "SSDB"],
  mostRecentArrestCheck: "2023-04-01",
  lifetimeOffensesExpired: [],
  courtCostsPaid: false,
  specialConditionsAlcDrugScreen: false,
  specialConditionsAlcDrugAssessmentComplete: false,
  specialConditionsAlcDrugTreatment: false,
  specialConditionsAlcDrugTreatmentCurrent: false,
  specialConditionsCounseling: false,
  specialConditionsCounselingAngerManagementCurrent: false,
  specialConditionsCommunityService: false,
  specialConditionsCommunityServiceCurrent: false,
  specialConditionsProgramming: false,
  specialConditionsProgrammingCognitiveBehavior: false,
  specialConditionsProgrammingCognitiveBehaviorCurrent: false,
  specialConditionsProgrammingSafe: false,
  specialConditionsProgrammingSafeCurrent: false,
  specialConditionsProgrammingVictimImpact: false,
  specialConditionsProgrammingVictimImpactCurrent: false,
  specialConditionsProgrammingFsw: false,
  specialConditionsProgrammingFswCurrent: false,
  externalId: "202",
  eligibleCriteria: {},
  ineligibleCriteria: {},
  formInformation: {},
  metadata: {},
  caseNotes: {},
};

const rawRecordOldSchemaAlmostEligible = {
  ...rawRecordOldSchema,
  almostEligibleCriteria: {
    paymentNeeded: true,
  },
  finesFeesEligible: "ineligible",
  remainingCriteriaNeeded: 1,
};

const formInformation = {
  courtCostsPaid: null,
  courtName: "Circuit Court",
  currentExemptionsAndExpiration: null,
  currentOffenses: ["FAILURE TO APPEAR (FELONY)"],
  dateToday: "2023-07-21",
  docketNumbers: ["10000"],
  driversLicense: null,
  driversLicenseRevoked: null,
  driversLicenseSuspended: null,
  expirationDate: "2030-02-12",
  judicialDistrict: ["1"],
  restitutionAmt: "100.0",
  restitutionMonthlyPayment: "0.0",
  restitutionMonthlyPaymentTo: ["PAYMENT TO"],
  sentenceLengthDays: "3629",
  sentenceStartDate: "2020-03-07",
  supervisionFeeArrearaged: "true",
  supervisionFeeArrearagedAmount: "700.0",
  supervisionFeeAssessed: "700.0",
  supervisionFeeWaived: "false",
};

const metadata = {
  allOffenses: ["FAILURE TO APPEAR (FELONY)", "EVADING ARREST"],
  convictionCounties: ["123ABC"],
  ineligibleOffensesExpired: [],
  mostRecentArrestCheck: {
    contactDate: "2023-04-01",
    contactType: "ARRN",
  },
  mostRecentSpeNote: {
    contactDate: "2019-08-15",
    contactType: "SPET",
  },
  specialConditionsTerminatedDate: "2019-08-15",
};

const eligibleCriteriaExceptFinesFees = {
  hasActiveSentence: { hasActiveSentence: true },
  supervisionLevelIsNotInternalUnknown: null,
  supervisionLevelIsNotInterstateCompact: null,
  supervisionLevelIsNotUnassigned: null,
  supervisionNotPastFullTermCompletionDateOrUpcoming90Days: {
    eligibleDate: "2029-06-06",
  },
  usTnIneligibleOffensesExpired: null,
  usTnNoArrestsInPastYear: null,
  usTnNoDuiOffenseInPast5Years: null,
  usTnNoHighSanctionsInPastYear: null,
  usTnNoMurderConvictions: null,
  usTnNoPriorRecordWithIneligibleCrOffense: null,
  usTnNoRecentCompliantReportingRejections: null,
  usTnNoZeroToleranceCodesSpans: null,
  usTnNotInJudicialDistrict17WhileOnProbation: null,
  usTnNotOnLifeSentenceOrLifetimeSupervision: {
    lifetimeFlag: false,
  },
  usTnNotPermanentlyRejectedFromCompliantReporting: null,
  usTnNotServingIneligibleCrOffense: null,
  usTnNotServingUnknownCrOffense: null,
  usTnOnEligibleLevelForSufficientTime: {
    eligibleDate: "2020-08-01",
    eligibleLevel: "MINIMUM",
  },
  usTnPassedDrugScreenCheck: {
    hasAtLeast1NegativeDrugTestPastYear: {
      latestNegativeScreenDates: ["2023-02-28"],
      latestNegativeScreenResults: ["DRUN"],
    },
    hasAtLeast2NegativeDrugTestsPastYear: {
      latestNegativeScreenDates: ["2023-02-28"],
      latestNegativeScreenResults: ["DRUN"],
    },
    latestAlcoholDrugNeedLevel: "LOW",
    latestDrugTestIsNegative: {
      latestDrugScreenDate: "2023-02-28",
      latestDrugScreenResult: "DRUN",
    },
  },
  usTnSpecialConditionsAreCurrent: { speNoteDue: null },
};

test("transform record, old format", () => {
  expect(
    transformCompliantReportingReferral(rawRecordOldSchema)
  ).toMatchSnapshot();
});

test("transform record, old + new format, eligible", () => {
  const rawRecord = {
    ...rawRecordOldSchema,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria: {
      ...eligibleCriteriaExceptFinesFees,
      usTnFinesFeesEligible: {
        hasFinesFeesBalanceBelow500: { amountOwed: 400 },
        hasPayments3ConsecutiveMonths: {
          amountOwed: 400,
          consecutiveMonthlyPayments: null,
        },
      },
    },
    ineligibleCriteria: {},
  };
  expect(transformCompliantReportingReferral(rawRecord)).toMatchSnapshot();
});

test("transform record, old + new format, almost eligible in both", () => {
  const ineligibleCriteria = {
    usTnFinesFeesEligible: {
      hasFinesFeesBalanceBelow500: { amountOwed: 700 },
      hasPayments3ConsecutiveMonths: {
        amountOwed: 700,
        consecutiveMonthlyPayments: 0,
      },
    },
  };
  const rawRecord = {
    ...rawRecordOldSchemaAlmostEligible,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria: eligibleCriteriaExceptFinesFees,
    ineligibleCriteria,
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);
  expect(
    transformedRecord?.eligibleCriteria.usTnFinesFeesEligible
  ).toBeUndefined();
  expect(transformedRecord?.ineligibleCriteria).toEqual(ineligibleCriteria);
});

test("transform record, old + new format, almost eligible in old only", () => {
  const rawRecord = {
    ...rawRecordOldSchemaAlmostEligible,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria: {
      ...eligibleCriteriaExceptFinesFees,
      usTnFinesFeesEligible: {
        hasFinesFeesBalanceBelow500: { amountOwed: 300 },
        hasPayments3ConsecutiveMonths: {
          amountOwed: 300,
          consecutiveMonthlyPayments: null,
        },
      },
    },
    ineligibleCriteria: {},
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);
  expect(
    transformedRecord?.eligibleCriteria.usTnFinesFeesEligible
  ).toBeUndefined();
  expect(transformedRecord?.ineligibleCriteria.usTnFinesFeesEligible).toEqual({
    hasFinesFeesBalanceBelow500: { amountOwed: 0 },
    hasPayments3ConsecutiveMonths: {
      amountOwed: 0,
      consecutiveMonthlyPayments: 0,
    },
  });
});

test("transform record, old + new format, almost eligible in new only", () => {
  const rawRecord = {
    ...rawRecordOldSchema,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria: eligibleCriteriaExceptFinesFees,
    ineligibleCriteria: {
      usTnFinesFeesEligible: {
        hasFinesFeesBalanceBelow500: { amountOwed: 700 },
        hasPayments3ConsecutiveMonths: {
          amountOwed: 700,
          consecutiveMonthlyPayments: 0,
        },
      },
    },
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);
  expect(
    transformedRecord?.ineligibleCriteria.usTnFinesFeesEligible
  ).toBeUndefined();
  expect(transformedRecord?.eligibleCriteria.usTnFinesFeesEligible).toEqual({
    hasFinesFeesBalanceBelow500: { amountOwed: 0 },
    hasPayments3ConsecutiveMonths: {
      amountOwed: 0,
      consecutiveMonthlyPayments: 0,
    },
    hasPermanentFinesFeesExemption: {
      currentExemptions: ["SSDB", "SSDB"],
    },
  });
});
