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

import { parseISO } from "date-fns";
import tk from "timekeeper";

import {
  CompliantReportingReferralRecordFullRaw,
  transformCompliantReportingReferral,
} from "../CompliantReportingOpportunity";

const rawRecordOldSchema: CompliantReportingReferralRecordFullRaw = {
  stateCode: "US_TN",
  poFirstName: "TEST",
  poLastName: "OFFICER1",
  clientFirstName: "LINDA",
  clientLastName: "SMITH",
  dateToday: "2022-03-25",
  tdocId: "202",
  drugScreensPastYear: [
    {
      date: "2023-02-28",
      result: "DRUN",
    },
    {
      date: "2023-01-28",
      result: "DRUN",
    },
  ],
  eligibilityCategory: "c3",
  finesFeesEligible: "exempt",
  remainingCriteriaNeeded: 0,
  currentOffenses: ["FAILURE TO APPEAR (FELONY)"],
  sentenceStartDate: "2020-03-07",
  expirationDate: "2030-02-12",
  sentenceLengthDays: "3629",
  supervisionType: "TN PROBATIONER",
  supervisionFeeAssessed: 700,
  supervisionFeeArrearagedAmount: 700,
  supervisionFeeArrearaged: false,
  supervisionFeeWaived: false,
  supervisionFeeExemptionType: ["SSDB", "SSDB"],
  mostRecentArrestCheck: "2023-04-01",
  lifetimeOffensesExpired: [],
  courtCostsPaid: false,
  specialConditionsFlag: "current",
  lastSpecialConditionsNote: "2022-01-10",
  nextSpecialConditionsCheck: "2022-09-10",
  eligibleLevelStart: "2019-09-01",
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
  driversLicense: "ABC123",
  restitutionAmt: 100,
  restitutionMonthlyPayment: 0,
  restitutionMonthlyPaymentTo: ["PAYMENT TO"],
  allDockets: '["10000"]',
  judicialDistrict: "1",
  convictionCounties: ["123ABC"],
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
  courtName: "Circuit Court",
  currentOffenses: ["STOLEN PROPERTY"],
  dateToday: "2023-07-21",
  docketNumbers: ["10000"],
  expirationDate: "2030-02-12",
  judicialDistrict: ["1"],
  restitutionAmt: 100.0,
  restitutionMonthlyPayment: 0.0,
  restitutionMonthlyPaymentTo: ["PAYMENT TO"],
  sentenceLengthDays: "3629",
  sentenceStartDate: "2020-03-07",
  supervisionFeeArrearaged: true,
  supervisionFeeArrearagedAmount: 700.0,
  supervisionFeeAssessed: 700.0,
  supervisionFeeWaived: false,
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

const eligibleCriteria = {
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
    startDateOnEligibleLevel: "2019-08-01",
  },
  usTnPassedDrugScreenCheck: {
    hasAtLeast1NegativeDrugTestPastYear: [
      {
        negativeScreenDate: "2023-02-28",
        negativeScreenResult: "DRUN",
      },
      {
        negativeScreenDate: "2023-01-28",
        negativeScreenResult: "DRUN",
      },
    ],
    latestDrugTestIsNegative: {
      latestDrugScreenDate: "2023-02-28",
      latestDrugScreenResult: "DRUN",
    },
  },
  usTnSpecialConditionsAreCurrent: { speNoteDue: null },
  usTnFinesFeesEligible: {
    hasFinesFeesBalanceBelow500: { amountOwed: 400 },
    hasPayments3ConsecutiveMonths: {
      amountOwed: 400,
      consecutiveMonthlyPayments: null,
    },
  },
};

const { usTnFinesFeesEligible, ...eligibleCriteriaExceptFinesFees } =
  eligibleCriteria;

beforeEach(() => {
  tk.freeze(new Date("2023-12-01"));
});

afterEach(() => {
  tk.reset();
});

test("transform record, old format", () => {
  expect(
    transformCompliantReportingReferral(rawRecordOldSchema),
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
    transformedRecord?.eligibleCriteria.usTnFinesFeesEligible,
  ).toBeUndefined();
  expect(transformedRecord?.ineligibleCriteria).toEqual(ineligibleCriteria);
});

test("transform record, old + new format, almost eligible but for fines/fees in old only", () => {
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
  expect(transformedRecord?.eligibleCriteria.usTnFinesFeesEligible).toEqual(
    rawRecord.eligibleCriteria.usTnFinesFeesEligible,
  );
  expect(
    transformedRecord?.ineligibleCriteria.usTnFinesFeesEligible,
  ).toBeUndefined();
});

test("transform record, old + new format, almost eligible but for sanctions in new only", () => {
  const { usTnNoHighSanctionsInPastYear, ...eligibleCriteriaExceptSanctions } =
    eligibleCriteria;
  const rawRecord = {
    ...rawRecordOldSchema,
    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria: eligibleCriteriaExceptSanctions,
    ineligibleCriteria: {
      usTnNoHighSanctionsInPastYear: {
        latestHighSanctionDate: "2022-10-01",
      },
    },
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);
  expect(
    transformedRecord?.eligibleCriteria.usTnNoHighSanctionsInPastYear,
  ).toBeUndefined();
  expect(
    transformedRecord?.ineligibleCriteria.usTnNoHighSanctionsInPastYear,
  ).toEqual({
    latestHighSanctionDate: parseISO("2022-10-01"),
  });
});

test("transform record, old + new format, almost eligible but for sanctions in old only", () => {
  const rawRecord = {
    ...rawRecordOldSchema,
    almostEligibleCriteria: {
      seriousSanctionsEligibilityDate: "2023-10-01",
    },
    remainingCriteriaNeeded: 1,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria,
    ineligibleCriteria: {},
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);
  expect(
    transformedRecord?.eligibleCriteria.usTnNoHighSanctionsInPastYear,
  ).toEqual({});
  expect(
    transformedRecord?.ineligibleCriteria.usTnNoHighSanctionsInPastYear,
  ).toBeUndefined();
});

test("transform record, old format, almost eligible but for recent rejections in old only", () => {
  const rawRecord = {
    ...rawRecordOldSchema,
    almostEligibleCriteria: {
      recentRejectionCodes: ["DEDU", "DECF"],
    },
    remainingCriteriaNeeded: 1,
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);

  // old says almost, new says nothing, use data from old
  expect(
    transformedRecord?.eligibleCriteria
      .usTnNoRecentCompliantReportingRejections,
  ).toBeUndefined();
  expect(
    transformedRecord?.ineligibleCriteria
      .usTnNoRecentCompliantReportingRejections,
  ).toEqual({
    contactCode: ["DEDU", "DECF"],
  });
});

test("transform record, old + new format, almost eligible but for recent rejections in old only", () => {
  const rawRecord = {
    ...rawRecordOldSchema,
    almostEligibleCriteria: {
      recentRejectionCodes: ["DEDU", "DECF"],
    },
    remainingCriteriaNeeded: 1,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria,
    ineligibleCriteria: {},
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);

  // old says almost, new says eligible, use data from new
  expect(
    transformedRecord?.eligibleCriteria
      .usTnNoRecentCompliantReportingRejections,
  ).toEqual({});
  expect(
    transformedRecord?.ineligibleCriteria
      .usTnNoRecentCompliantReportingRejections,
  ).toBeUndefined();
});

test("transform record, old + new format, almost eligible but for recent rejections in new only", () => {
  const {
    usTnNoRecentCompliantReportingRejections,
    ...eligibleCriteriaExceptRecentRejections
  } = eligibleCriteria;

  const rawRecord = {
    ...rawRecordOldSchema,

    formInformation,
    metadata,
    caseNotes: {},
    eligibleCriteria: eligibleCriteriaExceptRecentRejections,
    ineligibleCriteria: {
      usTnNoRecentCompliantReportingRejections: {
        contactCode: ["DEDU", "DECF"],
      },
    },
  };

  const transformedRecord = transformCompliantReportingReferral(rawRecord);

  // old says eligible, new says almost, use data from new
  expect(
    transformedRecord?.eligibleCriteria
      .usTnNoRecentCompliantReportingRejections,
  ).toBeUndefined();
  expect(
    transformedRecord?.ineligibleCriteria
      .usTnNoRecentCompliantReportingRejections,
  ).toEqual({
    contactCode: ["DEDU", "DECF"],
  });
});

test("transform record, old + new format, almost eligible but for fines/fees in new only", () => {
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
    transformedRecord?.eligibleCriteria.usTnFinesFeesEligible,
  ).toBeUndefined();
  expect(transformedRecord?.ineligibleCriteria.usTnFinesFeesEligible).toEqual(
    rawRecord.ineligibleCriteria.usTnFinesFeesEligible,
  );
});