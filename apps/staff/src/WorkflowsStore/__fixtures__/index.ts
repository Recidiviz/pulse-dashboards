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

import {
  incarcerationStaffFixtures,
  IncarcerationStaffRecord,
  outputFixtureArray,
  supervisionStaffFixtures,
  SupervisionStaffRecord,
} from "~datatypes";

import {
  ClientRecord,
  CombinedUserRecord,
  isUserRecord,
  LocationRecord,
  UserRecord,
  WorkflowsResidentRecord,
} from "../../FirestoreStore";
import { SupervisionOpportunityType } from "../Opportunity/OpportunityConfigs";
import { dateToTimestamp } from "../utils";

const userInfoFixtures = outputFixtureArray(supervisionStaffFixtures).filter(
  isUserRecord,
  // asserting because despite the typeguard, TS can't seem to figure this one out
) as Array<UserRecord>;

export const mockOfficer: CombinedUserRecord = {
  info: {
    ...userInfoFixtures[0],
    stateCode: "US_XX",
    hasCaseload: true,
  },
};

export const mockOfficer2: CombinedUserRecord = {
  info: {
    ...userInfoFixtures[1],
    stateCode: "US_XX",
    hasCaseload: true,
  },
};

export const mockSupervisor: CombinedUserRecord = {
  info: {
    ...userInfoFixtures[2],
    stateCode: "US_XX",
    hasCaseload: false,
  },
};

export const ineligibleClient: ClientRecord = {
  recordId: "us_xx_100",
  personName: {
    givenNames: "TONYE",
    middleNames: "BARBY",
    surname: "THOMPSON",
  },
  personExternalId: "100",
  displayId: "d100",
  pseudonymizedId: "p100",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PAROLEE",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2020-12-20"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2025-12-31"),
  currentBalance: 0,
  lastPaymentAmount: 50,
  lastPaymentDate: dateToTimestamp("2021-11-15"),
  specialConditions: ["SPECIAL CONDITIONS TEST TEST"],
  allEligibleOpportunities: [],
  personType: "CLIENT",
  currentEmployers: [
    {
      name: "Tire store",
      address: "456 Bedrock Lane",
    },
  ],
  milestones: [
    {
      text: "Birthday this month (February 28)",
      type: "BIRTHDAY_THIS_MONTH",
    },
    {
      text: "15 months on supervision",
      type: "MONTHS_ON_SUPERVISION",
    },
    {
      text: "6 months violation-free",
      type: "NO_VIOLATION_WITHIN_6_MONTHS",
    },
  ],
};

export const compliantReportingReferralRecord = {
  stateCode: "US_XX",
  tdocId: "101",
  eligibilityCategory: "c1",
  remainingCriteriaNeeded: 0,
  eligibleLevelStart: dateToTimestamp("2019-12-20"),
  judicialDistrict: "A",
  finesFeesEligible: "regular_payments",
  drugScreensPastYear: [],
  currentOffenses: ["EXAMPLE"],
  pastOffenses: [],
  zeroToleranceCodes: [],
  lifetimeOffensesExpired: ["EXAMPLE"],
  specialConditionsFlag: "current",
};

export const eligibleClient: ClientRecord = {
  personType: "CLIENT",
  recordId: "us_xx_101",
  personName: { givenNames: "LINET", surname: "HANSEN" },
  personExternalId: "101",
  displayId: "d101",
  pseudonymizedId: "p101",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  currentBalance: 221.88,
  specialConditions: ["EXAMPLE OF SPECIAL CONDITIONS HERE"],
  allEligibleOpportunities: [
    "compliantReporting",
  ] as SupervisionOpportunityType[],
  currentEmployers: [
    {
      name: "The Penny Ice Cream Store",
      address: "456 Sweet Drive",
    },
  ],
  milestones: [
    {
      text: "Birthday this month (February 14)",
      type: "BIRTHDAY_THIS_MONTH",
    },
    {
      text: "15 months on supervision",
      type: "MONTHS_ON_SUPERVISION",
    },
    {
      text: "6 months violation-free",
      type: "NO_VIOLATION_WITHIN_6_MONTHS",
    },
  ],
};

export const lsuEligibleClient: ClientRecord = {
  personType: "CLIENT",
  recordId: "us_xx_102",
  personName: { givenNames: "REBEKAH", surname: "CORTES" },
  personExternalId: "102",
  displayId: "d102",
  pseudonymizedId: "p102",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "MISDEMEANOR PROBATIONER",
  supervisionLevel: "STANDARD: MINIMUM",
  supervisionLevelStart: dateToTimestamp("2021-07-05"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  currentBalance: 221.88,
  specialConditions: ["EXAMPLE OF SPECIAL CONDITIONS HERE"],
  allEligibleOpportunities: ["LSU"],
  currentEmployers: [
    {
      name: "Photography Studio",
      address: "392 Telegraph Drive, Nashville, TN 12345",
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
    {
      text: "6 months violation-free",
      type: "NO_VIOLATION_WITHIN_6_MONTHS",
    },
  ],
};

export const lsuAlmostEligibleClient: ClientRecord = {
  personType: "CLIENT",
  recordId: "us_xx_103",
  personName: { givenNames: "CHAD", surname: "KROGER" },
  personExternalId: "103",
  displayId: "d103",
  pseudonymizedId: "p103",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "MISDEMEANOR PROBATIONER",
  supervisionLevel: "STANDARD: MINIMUM",
  supervisionLevelStart: dateToTimestamp("2021-07-05"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  currentBalance: 221.88,
  specialConditions: ["EXAMPLE OF SPECIAL CONDITIONS HERE"],
  allEligibleOpportunities: ["LSU"],
  currentEmployers: [
    {
      name: "Paint Your Own Ceramics",
      address: "593 MLK Blvd",
    },
    {
      name: "Paints-A-Lot",
      address: "595 MLK Blvd",
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
    {
      text: "6 months violation-free",
      type: "NO_VIOLATION_WITHIN_6_MONTHS",
    },
  ],
};

export const milestonesClient: ClientRecord = {
  ...eligibleClient,
  recordId: "us_xx_104",
  personName: { givenNames: "MICKEY", surname: "MOUSE" },
  personExternalId: "104",
  displayId: "d104",
  pseudonymizedId: "p104",
};

export const mockClients = [
  ineligibleClient,
  eligibleClient,
  lsuEligibleClient,
];

export const mockResidents: WorkflowsResidentRecord[] = [
  {
    recordId: "999",
    personType: "RESIDENT",
    admissionDate: "2023-03-23",
    allEligibleOpportunities: ["usMeSCCP"],
    custodyLevel: "MINIMUM",
    facilityId: "MOUNTAIN VIEW CORRECTIONAL FACILITY",
    officerId: "1",
    stateCode: "US_ME",
    personName: {
      givenNames: "Bernie",
      surname: "Sanders",
    },
    pseudonymizedId: "p999",
    releaseDate: "2023-09-22",
    unitId: "UNIT E",
    personExternalId: "999",
    displayId: "d999",
  },
];

export const mockSupervisionOfficers: Array<SupervisionStaffRecord["output"]> =
  outputFixtureArray(supervisionStaffFixtures.slice(0, 2));

export const mockIncarcerationOfficers: Array<
  IncarcerationStaffRecord["output"]
> = outputFixtureArray(incarcerationStaffFixtures.slice(0, 2));

export const mockLocations: LocationRecord[] = [
  {
    id: "FAC1",
    stateCode: "US_MO",
    idType: "facilityId",
    name: "Facility 1",
    system: "INCARCERATION",
  },
  {
    id: "FAC2",
    stateCode: "US_MO",
    idType: "facilityId",
    name: "Facility 2",
    system: "INCARCERATION",
  },
];
