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
import { Required as RequireKeys } from "utility-types";

import {
  ClientRecord,
  WorkflowsResidentRecord,
} from "../../../../FirestoreStore";
import { dateToTimestamp } from "../../../utils";
import {
  UsMeEarlyTerminationReferralRecordRaw,
  UsMeFurloughReleaseReferralRecordRaw,
  UsMeWorkReleaseReferralRecordRaw,
} from "..";

export const usMePersonRecord: WorkflowsResidentRecord = {
  recordId: "us_me_111",
  personType: "RESIDENT",
  stateCode: "US_ME",
  personName: {
    givenNames: "Manny",
    surname: "Delgado",
  },
  gender: "MALE",
  personExternalId: "111",
  displayId: "d111",
  pseudonymizedId: "p111",
  custodyLevel: "MINIMUM",
  officerId: "CASE_MANAGER_1",
  admissionDate: "2020-03-10",
  releaseDate: "2025-05-20",
  allEligibleOpportunities: [
    "usMeSCCP",
    "usMeFurloughRelease",
    "usMeWorkRelease",
  ],

  metadata: {},
};

export const usMePersonRecordShorterSentence: WorkflowsResidentRecord = {
  recordId: "us_me_112",
  personType: "RESIDENT",
  stateCode: "US_ME",
  personName: {
    givenNames: "Rose",
    surname: "Newton",
  },
  gender: "TRANS_FEMALE",
  personExternalId: "112",
  displayId: "d112",
  pseudonymizedId: "p112",
  custodyLevel: "MINIMUM",
  officerId: "CASE_MANAGER_1",
  admissionDate: "2020-03-10",
  releaseDate: "2024-05-20",
  allEligibleOpportunities: ["usMeSCCP"],

  metadata: {},
};

export const usMeFurloughReleaseEligibleRecordFixture: UsMeFurloughReleaseReferralRecordRaw =
  {
    stateCode: "US_ME",
    externalId: "111",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: { custodyLevel: "COMMUNITY" },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: "2022-08-10",
      },
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: "2022-08-14",
      },
      usMeNoClassAOrBViolationFor90Days: null,
      usMeNoDetainersWarrantsOrOther: null,
      usMeServedHalfOfSentence: {
        eligibleDate: "2022-08-14",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

export const usMeWorkReleaseEligibleRecordFixture: UsMeWorkReleaseReferralRecordRaw =
  {
    stateCode: "US_ME",
    externalId: "111",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: "2022-08-10",
      },
      usMeThreeYearsRemainingOnSentence: {
        eligibleDate: "2022-08-14",
      },
      usMeNoClassAOrBViolationFor90Days: null,
      usMeNoDetainersWarrantsOrOther: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

export const usMeEarlyTerminationEligibleClientRecord: RequireKeys<ClientRecord> =
  {
    personType: "CLIENT",
    recordId: "us_nd_009",
    personName: {
      givenNames: "LAURA",
      surname: "PALMER",
    },
    district: "DISTRICT A",
    personExternalId: "009",
    displayId: "d009",
    pseudonymizedId: "p009",
    stateCode: "US_ME",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: dateToTimestamp("2019-12-20"),
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: dateToTimestamp("2024-12-31"),
    allEligibleOpportunities: ["usMeEarlyTermination"],
    supervisionStartDate: "2020-02-22",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: dateToTimestamp("2022-01-03"),
    specialConditions: [],
    boardConditions: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Bedrock Lane",
      },
    ],
    milestones: [
      {
        text: "8 months without a violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "laura@example.com",
  };

export const usMeEarlyTerminationAlmostEligibleRestitutionClientRecord: RequireKeys<ClientRecord> =
  {
    ...usMeEarlyTerminationEligibleClientRecord,
    recordId: "us_nd_010",
    personName: {
      givenNames: "JENNIFER",
      surname: "LOPEZ",
    },
    personExternalId: "010",
    displayId: "d010",
    pseudonymizedId: "p010",
    emailAddress: "jlo@example.com",
  };

export const usMeEarlyTerminationAlmostEligiblePendingViolationClientRecord: RequireKeys<ClientRecord> =
  {
    ...usMeEarlyTerminationEligibleClientRecord,
    recordId: "us_nd_011",
    personName: {
      givenNames: "MARIAH",
      surname: "CAREY",
    },
    personExternalId: "011",
    displayId: "d011",
    pseudonymizedId: "p011",
    emailAddress: "mc@example.com",
  };

export const usMeEarlyTerminationAlmostEligibleSupervisionStartClientRecord: RequireKeys<ClientRecord> =
  {
    ...usMeEarlyTerminationEligibleClientRecord,
    recordId: "us_nd_012",
    personName: {
      givenNames: "TINA",
      surname: "TURNER",
    },
    personExternalId: "012",
    displayId: "d012",
    pseudonymizedId: "p012",
    emailAddress: "tt@example.com",
  };

export const usMeEarlyTerminationReferralRecord: UsMeEarlyTerminationReferralRecordRaw =
  {
    stateCode: "US_ME",
    externalId: "009",
    eligibleCriteria: {
      usMePaidAllOwedRestitution: {
        amountOwed: 0,
      },
      noConvictionWithin6Months: {},
      usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: {
        eligibleDate: "2024-04-03",
      },
      supervisionLevelIsMediumOrLower: {
        supervisionLevel: "MEDIUM",
      },
      usMeNoPendingViolationsWhileSupervised: {},
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

export const usMeEarlyTerminationRestitutionAlmostEligibleReferralRecord: UsMeEarlyTerminationReferralRecordRaw =
  {
    stateCode: "US_ME",
    externalId: "010",
    eligibleCriteria: {
      noConvictionWithin6Months: {},
      usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: {
        eligibleDate: "2024-04-03",
      },
      supervisionLevelIsMediumOrLower: {
        supervisionLevel: "MEDIUM",
      },
      usMeNoPendingViolationsWhileSupervised: {},
    },
    ineligibleCriteria: {
      usMePaidAllOwedRestitution: {
        amountOwed: 500,
      },
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

export const usMeEarlyTerminationViolationAlmostEligibleReferralRecord: UsMeEarlyTerminationReferralRecordRaw =
  {
    stateCode: "US_ME",
    externalId: "011",
    eligibleCriteria: {
      usMePaidAllOwedRestitution: {},
      noConvictionWithin6Months: {},
      usMeSupervisionPastHalfFullTermReleaseDateFromProbationStart: {
        eligibleDate: "2024-04-03",
      },
      supervisionLevelIsMediumOrLower: {
        supervisionLevel: "MEDIUM",
      },
    },
    ineligibleCriteria: {
      usMeNoPendingViolationsWhileSupervised: {
        currentStatus: "PENDING VIOLATION",
        violationDate: "2023-01-01",
      },
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

export const usMeVerifiedOpportunities = {
  usMeSCCP: {
    type: "usMeSCCP",
    isLoading: false,
    isHydrated: true,
    portionServedRequirement: ["1/2", "2/3"],
  },
  usMeFurloughRelease: {
    type: "usMeFurloughRelease",
    isLoading: false,
    isHydrated: true,
    portionServedRequirement: ["1/2"],
  },
  usMeWorkRelease: {
    type: "usMeWorkRelease",
    isLoading: false,
    isHydrated: true,
  },
  usMeEarlyTermination: {
    type: "usMeEarlyTermination",
    isLoading: false,
    isHydrated: true,
    portionServedRequirement: ["1/2"],
  },
};
