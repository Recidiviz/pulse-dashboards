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
import { Required as RequireKeys } from "utility-types";

import { ClientRecord, ResidentRecord } from "../../../firestore";
import { dateToTimestamp } from "../../utils";
import { SupervisionOpportunityType } from "..";
import { CompliantReportingReferralRecord } from "../CompliantReportingReferralRecord";
import { EarlyTerminationReferralRecord } from "../EarlyTerminationReferralRecord";
import { EarnedDischargeReferralRecord } from "../EarnedDischargeReferralRecord";
import { LSUReferralRecord } from "../LSUReferralRecord";
import { PastFTRDReferralRecord } from "../PastFTRDReferralRecord";
import { UsMeSCCPReferralRecord } from "../UsMeSCCPReferralRecord";
import { UsTnExpirationReferralRecord } from "../UsTnExpirationReferralRecord";

//
// Tennessee
//

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_xx_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  pseudonymizedId: "p001",
  stateCode: "US_XX",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

export const compliantReportingEligibleClientRecord: ClientRecord = {
  recordId: "us_xx_cr-eligible-1",
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-eligible-1",
  pseudonymizedId: "pseudo-cr-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: [
    "compliantReporting",
  ] as SupervisionOpportunityType[],
  personType: "CLIENT",
};

export const compliantReportingReferralRecord: Partial<CompliantReportingReferralRecord> =
  {
    eligibilityCategory: "c1",
    remainingCriteriaNeeded: 0,
    mostRecentArrestCheck: parseISO("2022-05-28"),
    eligibleLevelStart: parseISO("2019-12-20"),
    judicialDistrict: "A",
    finesFeesEligible: "regular_payments",
    drugScreensPastYear: [{ result: "DRUN", date: parseISO("2022-01-04") }],
    sanctionsPastYear: [],
    currentOffenses: ["EXAMPLE CURRENT"],
    pastOffenses: [],
    lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
    specialConditionsFlag: "current",
    lastSpecialConditionsNote: parseISO("2022-03-15"),
  };

export const compliantReportingAlmostEligibleCriteria: Required<
  NonNullable<CompliantReportingReferralRecord["almostEligibleCriteria"]>
> = {
  passedDrugScreenNeeded: true,
  paymentNeeded: true,
  currentLevelEligibilityDate: parseISO("2022-08-15"),
  seriousSanctionsEligibilityDate: parseISO("2022-08-15"),
  recentRejectionCodes: ["TEST1"],
};

export const compliantReportingAlmostEligibleReferralRecord: Partial<CompliantReportingReferralRecord> =
  {
    almostEligibleCriteria: compliantReportingAlmostEligibleCriteria,
    eligibilityCategory: "c1",
    remainingCriteriaNeeded: 1,
    mostRecentArrestCheck: parseISO("2022-05-28"),
    eligibleLevelStart: parseISO("2019-12-20"),
    judicialDistrict: "A",
    finesFeesEligible: "regular_payments",
    drugScreensPastYear: [],
    sanctionsPastYear: [],
    currentOffenses: ["EXAMPLE CURRENT"],
    pastOffenses: [],
    lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
    specialConditionsFlag: "current",
    lastSpecialConditionsNote: parseISO("2022-03-15"),
  };

export const compliantReportingAlmostEligibleClientRecord: ClientRecord = {
  recordId: "us_xx_cr-almost-eligible-1",
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-almost-eligible-1",
  pseudonymizedId: "pseudo-cr-almost-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditions: [],
  allEligibleOpportunities: [
    "compliantReporting",
  ] as SupervisionOpportunityType[],
  personType: "CLIENT",
};

export const UsTnExpirationEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["usTnExpiration"],
};

export const UsTnExpirationReferralRecordFixture: UsTnExpirationReferralRecord =
  {
    stateCode: "US_TN",
    externalId: "101",
    formInformation: {
      offenses: ["Charge A", "Charge B"],
      docketNumbers: ["12345"],
      convictionCounties: ["123", "456"],
      sexOffenses: [],
      latestEmp: {
        contactDate: parseISO("2022-01-01"),
        contactType: "EMPV",
        contactComment: "EMPLOYMENT VERIFIED",
      },
    },
    criteria: {
      supervisionPastFullTermCompletionDateOrUpcoming60Day: {
        eligibleDate: parseISO("2022-02-02"),
      },
      usTnNoZeroToleranceCodesSpans: {},
      usTnNotOnLifeSentenceOrLifetimeSupervision: {
        lifetimeFlag: false,
      },
    },
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: parseISO("2022-08-22"),
        },
      ],
    },
  };

//
// North Dakota
//

export const earlyTerminationEligibleClientRecord: RequireKeys<ClientRecord> = {
  personType: "CLIENT",
  recordId: "us_nd_110",
  personName: {
    givenNames: "JAMIE",
    surname: "JONES",
  },
  personExternalId: "110",
  pseudonymizedId: "p110",
  stateCode: "US_ND",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: ["earlyTermination"],
  supervisionStartDate: "2020-02-22",
  currentBalance: 0,
  lastPaymentAmount: 125.75,
  lastPaymentDate: dateToTimestamp("2022-01-03"),
  specialConditions: [],
  boardConditions: [],
};

export const earlyTerminationReferralRecord: EarlyTerminationReferralRecord = {
  stateCode: "US_ND",
  externalId: "110",
  formInformation: {
    clientName: "Jamie Jones",
    convictionCounty: "NORTH_CENTRAL",
    judgeName: "JUDGE 1",
    priorCourtDate: parseISO("2020-01-03"),
    sentenceLengthYears: 3,
    crimeNames: ["CHARGE 1", "CHARGE 2"],
    probationExpirationDate: parseISO("2022-12-02"),
    probationOfficerFullName: "Karl Fog",
    criminalNumber: "12345",
    judicialDistrictCode: "BISMARCK",
  },
  criteria: {
    supervisionPastEarlyDischargeDate: {
      eligibleDate: parseISO("2022-01-03"),
    },
    usNdNotInActiveRevocationStatus: {
      revocationDate: undefined,
    },
    usNdImpliedValidEarlyTerminationSupervisionLevel: {
      supervisionLevel: "MEDIUM",
    },
    usNdImpliedValidEarlyTerminationSentenceType: {
      supervisionType: "PROBATION",
    },
  },
  metadata: {
    multipleSentences: true,
    outOfState: false,
    ICOut: false,
  },
};

//
// Idaho
//

export const LSUReferralRecordFixture: LSUReferralRecord = {
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
    assessmentScore: 25,
    latestNegativeDrugScreenDate: "2022-03-02",
    txDischargeDate: "2022-08-04",
    txNoteTitle: "TX GOAL",
    txNoteBody: "TX Goal: Complete GEO successfully.",
  },
  eligibleCriteria: {
    usIdLsirLevelLowFor90Days: {
      riskLevel: "LOW",
      eligibleDate: parseISO("2022-01-03"),
    },
    negativeUaWithin90Days: {
      latestUaDates: [parseISO("2022-05-28")],
      latestUaResults: [false],
    },
    noFelonyWithin24Months: {
      latestFelonyConvictions: [],
    },
    noViolentMisdemeanorWithin12Months: {
      latestViolentConvictions: [],
    },
    usIdIncomeVerifiedWithin3Months: {
      incomeVerifiedDate: parseISO("2022-06-03"),
    },
    onSupervisionAtLeastOneYear: {
      eligibleDate: parseISO("2022-06-01"),
    },
    usIdNoActiveNco: {
      activeNco: false,
    },
  },
  ineligibleCriteria: {},
  eligibleStartDate: new Date(2022, 10, 5),
  caseNotes: {
    "Special Conditions": [
      {
        noteTitle: "MUST JOURNAL",
        noteBody: "Client must journal at least once a week",
        eventDate: parseISO("2022-08-22"),
      },
    ],
    Treatment: [
      {
        noteTitle: "STARTED",
        noteBody: "Treatment started",
        eventDate: parseISO("2022-06-17"),
      },
      {
        noteTitle: "COMPLETED",
        noteBody: "Treatment successfully completed",
        eventDate: parseISO("2022-09-22"),
      },
    ],
  },
};

export const AlmostEligibleLSUReferralRecordFixture: LSUReferralRecord = {
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
    assessmentScore: 25,
    latestNegativeDrugScreenDate: "2022-03-02",
    txDischargeDate: "2022-08-04",
    txNoteTitle: "TX GOAL",
    txNoteBody: "TX Goal: Complete GEO successfully.",
  },
  eligibleCriteria: {
    usIdLsirLevelLowFor90Days: {
      riskLevel: "LOW",
      eligibleDate: parseISO("2022-01-03"),
    },
    negativeUaWithin90Days: {
      latestUaDates: [parseISO("2022-05-28")],
      latestUaResults: [false],
    },
    noFelonyWithin24Months: {
      latestFelonyConvictions: [],
    },
    noViolentMisdemeanorWithin12Months: {
      latestViolentConvictions: [],
    },

    onSupervisionAtLeastOneYear: {
      eligibleDate: parseISO("2022-06-01"),
    },
    usIdNoActiveNco: {
      activeNco: false,
    },
  },
  ineligibleCriteria: {
    usIdIncomeVerifiedWithin3Months: {},
  },
  eligibleStartDate: new Date(2022, 10, 5),
  caseNotes: {
    "Special Conditions": [
      {
        noteTitle: "MUST JOURNAL",
        noteBody: "Client must journal at least once a week",
        eventDate: parseISO("2022-08-22"),
      },
    ],
    Treatment: [
      {
        noteTitle: "STARTED",
        noteBody: "Treatment started",
        eventDate: parseISO("2022-06-17"),
      },
      {
        noteTitle: "COMPLETED",
        noteBody: "Treatment successfully completed",
        eventDate: parseISO("2022-09-22"),
      },
    ],
  },
};

export const EarnedDischargeReferralRecordFixture: EarnedDischargeReferralRecord =
  {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: parseISO("2022-01-03"),
      },
      negativeUaWithin90Days: {
        latestUaDates: [parseISO("2022-05-28")],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: {
        latestFelonyConvictions: [],
      },
      noViolentMisdemeanorWithin12Months: {
        latestViolentConvictions: [],
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: parseISO("2022-06-03"),
      },
      pastEarnedDischargeEligibleDate: {
        eligibleDate: parseISO("2022-03-17"),
        sentenceType: "DUAL",
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: new Date(2022, 10, 5),
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: parseISO("2022-08-22"),
        },
      ],
      Treatment: [
        {
          noteTitle: "STARTED",
          noteBody: "Treatment started",
          eventDate: parseISO("2022-06-17"),
        },
        {
          noteTitle: "COMPLETED",
          noteBody: "Treatment successfully completed",
          eventDate: parseISO("2022-09-22"),
        },
      ],
    },
  };

export const earnedDischargeAlmostEligibleSupervisionLength: EarnedDischargeReferralRecord =
  {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: parseISO("2022-01-03"),
      },
      negativeUaWithin90Days: {
        latestUaDates: [parseISO("2022-05-28")],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: {
        latestFelonyConvictions: [],
      },
      noViolentMisdemeanorWithin12Months: {
        latestViolentConvictions: [],
      },
      pastEarnedDischargeEligibleDate: {
        eligibleDate: parseISO("2022-03-17"),
        sentenceType: "PAROLE",
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: parseISO("2022-06-03"),
      },
    },
    ineligibleCriteria: {
      onProbationAtLeastOneYear: {
        eligibleDate: parseISO("2023-12-10"),
      },
    },
    eligibleStartDate: new Date(2022, 10, 5),
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: parseISO("2022-08-22"),
        },
      ],
      Treatment: [
        {
          noteTitle: "STARTED",
          noteBody: "Treatment started",
          eventDate: parseISO("2022-06-17"),
        },
        {
          noteTitle: "COMPLETED",
          noteBody: "Treatment successfully completed",
          eventDate: parseISO("2022-09-22"),
        },
      ],
    },
  };

export const earnedDischargeAlmostEligibleVerifiedIncome: EarnedDischargeReferralRecord =
  {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: parseISO("2022-01-03"),
      },
      negativeUaWithin90Days: {
        latestUaDates: [parseISO("2022-05-28")],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: {
        latestFelonyConvictions: [],
      },
      noViolentMisdemeanorWithin12Months: {
        latestViolentConvictions: [],
      },
      pastEarnedDischargeEligibleDate: {
        eligibleDate: parseISO("2022-03-17"),
        sentenceType: "PAROLE",
      },
    },
    ineligibleCriteria: {
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: undefined,
      },
    },
    eligibleStartDate: new Date(2022, 10, 5),
    caseNotes: {
      "Special Conditions": [
        {
          noteTitle: "MUST JOURNAL",
          noteBody: "Client must journal at least once a week",
          eventDate: parseISO("2022-08-22"),
        },
      ],
      Treatment: [
        {
          noteTitle: "STARTED",
          noteBody: "Treatment started",
          eventDate: parseISO("2022-06-17"),
        },
        {
          noteTitle: "COMPLETED",
          noteBody: "Treatment successfully completed",
          eventDate: parseISO("2022-09-22"),
        },
      ],
    },
  };

export const LSUEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["LSU"],
};

export const EarnedDischargeEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["earnedDischarge"],
};

export const pastFTRDRecordFixture: PastFTRDReferralRecord = {
  stateCode: "US_ID",
  externalId: "001",
  formInformation: {
    clientName: "Betty Rubble",
  },
  criteria: {
    supervisionPastFullTermCompletionDate: {
      eligibleDate: parseISO("2022-01-03"),
    },
  },
};

export const pastFTRDEligibleClientRecord: ClientRecord = {
  ...ineligibleClientRecord,
  allEligibleOpportunities: ["pastFTRD"],
};

//
// Maine
//

export const usMePersonRecord: ResidentRecord = {
  recordId: "us_me_111",
  personType: "RESIDENT",
  stateCode: "US_ME",
  personName: {
    givenNames: "Manny",
    surname: "Delgado",
  },
  personExternalId: "111",
  pseudonymizedId: "p111",
  custodyLevel: "MINIMUM",
  officerId: "CASE_MANAGER_1",
  admissionDate: "2020-03-10",
  releaseDate: "2025-05-20",
  allEligibleOpportunities: ["usMeSCCP"],
};

export const usMePersonRecordShorterSentence: ResidentRecord = {
  recordId: "us_me_112",
  personType: "RESIDENT",
  stateCode: "US_ME",
  personName: {
    givenNames: "Rose",
    surname: "Newton",
  },
  personExternalId: "112",
  pseudonymizedId: "p112",
  custodyLevel: "MINIMUM",
  officerId: "CASE_MANAGER_1",
  admissionDate: "2020-03-10",
  releaseDate: "2024-05-20",
  allEligibleOpportunities: ["usMeSCCP"],
};

export const usMeSCCPEligibleRecordFixture: UsMeSCCPReferralRecord = {
  stateCode: "US_ME",
  externalId: "111",
  ineligibleCriteria: {},
  eligibleCriteria: {
    usMeMinimumOrCommunityCustody: { custodyLevel: "COMMUNITY" },
    usMeServedXPortionOfSentence: {
      eligibleDate: parseISO("2022-10-12"),
      xPortionServed: "2/3",
    },
    usMeXMonthsRemainingOnSentence: {
      eligibleDate: parseISO("2022-08-14"),
    },
    usMeNoClassAOrBViolationFor90Days: null,
    usMeNoDetainersWarrantsOrOther: null,
  },
  caseNotes: {
    foo: [
      {
        noteTitle: "A title",
        noteBody: "A body",
        eventDate: parseISO("2022-06-28"),
      },
    ],
  },
};

export const usMeSCCPEligibleRecordHalfPortionFixture: UsMeSCCPReferralRecord =
  {
    stateCode: "US_ME",
    externalId: "112",
    ineligibleCriteria: {},
    eligibleCriteria: {
      usMeMinimumOrCommunityCustody: { custodyLevel: "COMMUNITY" },
      usMeServedXPortionOfSentence: {
        eligibleDate: parseISO("2022-04-15"),
        xPortionServed: "1/2",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: parseISO("2021-12-20"),
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: parseISO("2022-06-28"),
        },
      ],
    },
  };

export const usMeSCCPAlmostEligibleXMonthsRecordFixture: UsMeSCCPReferralRecord =
  {
    stateCode: "US_ME",
    externalId: "111",
    ineligibleCriteria: {
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: parseISO("2023-06-14"),
      },
    },
    eligibleCriteria: {
      usMeMinimumOrCommunityCustody: { custodyLevel: "COMMUNITY" },
      usMeServedXPortionOfSentence: {
        eligibleDate: parseISO("2022-10-12"),
        xPortionServed: "2/3",
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: parseISO("2022-06-28"),
        },
      ],
    },
  };

export const usMeSCCPAlmostEligibleViolationRecordFixture: UsMeSCCPReferralRecord =
  {
    stateCode: "US_ME",
    externalId: "111",
    ineligibleCriteria: {
      usMeNoClassAOrBViolationFor90Days: {
        eligibleDate: parseISO("2023-02-15"),
      },
    },
    eligibleCriteria: {
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: parseISO("2022-06-14"),
      },
      usMeMinimumOrCommunityCustody: { custodyLevel: "COMMUNITY" },
      usMeServedXPortionOfSentence: {
        eligibleDate: parseISO("2022-10-12"),
        xPortionServed: "2/3",
      },
      usMeNoDetainersWarrantsOrOther: null,
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: parseISO("2022-06-28"),
        },
      ],
    },
  };

export const usMeSCCPAlmostEligibleXPortionOfSentenceRecordFixture: UsMeSCCPReferralRecord =
  {
    stateCode: "US_ME",
    externalId: "111",
    ineligibleCriteria: {
      usMeServedXPortionOfSentence: {
        eligibleDate: parseISO("2023-04-12"),
        xPortionServed: "2/3",
      },
    },
    eligibleCriteria: {
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: parseISO("2022-06-14"),
      },
      usMeMinimumOrCommunityCustody: { custodyLevel: "COMMUNITY" },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: {
        eligibleDate: parseISO("2022-10-15"),
      },
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: parseISO("2022-06-28"),
        },
      ],
    },
  };
