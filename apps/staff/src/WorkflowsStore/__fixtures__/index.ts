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

import {
  ClientRecord,
  IncarcerationStaffRecord,
  incarcerationStaffRecordSchema,
  makeRecordFixture,
  OpportunityType,
  outputFixtureArray,
  SupervisionStaffRecord,
  supervisionStaffRecordSchema,
} from "~datatypes";

import {
  CombinedUserRecord,
  LocationRecord,
  UserRecord,
  WorkflowsResidentRecord,
} from "../../FirestoreStore";
import { dateToTimestamp } from "../utils";

// INCARCERATION

const incarcerationStaffTestFixtures: Array<IncarcerationStaffRecord> = [
  makeRecordFixture(incarcerationStaffRecordSchema, {
    email: "test-officer-1@example.com",
    id: "INCARCERATION_OFFICER1",
    stateCode: "US_XX",
    givenNames: "TestIncarcerationOfficer1",
    surname: "",
    pseudonymizedId: "p001",
  }),
];

export const mockIncarcerationOfficers: Array<
  IncarcerationStaffRecord["output"]
> = outputFixtureArray(incarcerationStaffTestFixtures);

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
    gender: "MALE",
    personName: {
      givenNames: "Bernie",
      surname: "Sanders",
    },
    pseudonymizedId: "p999",
    releaseDate: "2023-09-22",
    unitId: "UNIT E",
    personExternalId: "999",
    displayId: "d999",
    metadata: {},
  },
];

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

// SUPERVISION STAFF

const supervisionStaffTestFixtures = [
  {
    email: "test-officer-1@example.com",
    district: "DISTRICT 1",
    id: "XX_OFFICER1",
    stateCode: "US_XX",
    givenNames: "TestOfficer",
    surname: "AlphabeticallySecond",
    supervisorExternalId: null,
    pseudonymizedId: "p001",
  },
  {
    email: "test-officer-1@example.com",
    district: "DISTRICT 1",
    id: "XX_OFFICER2",
    stateCode: "US_XX",
    givenNames: "TestOfficer",
    surname: "AlphabeticallyFirst",
    supervisorExternalId: null,
    pseudonymizedId: "p002",
  },
].map((r) => makeRecordFixture(supervisionStaffRecordSchema, r));

export const mockSupervisionOfficers: Array<SupervisionStaffRecord["output"]> =
  outputFixtureArray(supervisionStaffTestFixtures);

export const mockOfficer: CombinedUserRecord = {
  info: {
    ...(mockSupervisionOfficers[0] as UserRecord),
    hasCaseload: true,
  },
};

export const mockOfficer2: CombinedUserRecord = {
  info: {
    ...(mockSupervisionOfficers[1] as UserRecord),
    hasCaseload: true,
  },
};

// CLIENTS

export const ineligibleClient: ClientRecord = {
  recordId: "us_xx_100",
  personName: {
    givenNames: "Tonye",
    middleNames: "Barby",
    surname: "Thompson",
  },
  personExternalId: "100",
  displayId: "d100",
  pseudonymizedId: "p100",
  stateCode: "US_XX",
  officerId: "XX_OFFICER1",
  supervisionType: "TN PAROLEE",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2020-12-20"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: new Date("2025-12-31"),
  currentBalance: 0,
  lastPaymentAmount: 50,
  lastPaymentDate: new Date("2021-11-15"),
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
  personName: { givenNames: "Linet", surname: "Hansen" },
  personExternalId: "101",
  displayId: "d101",
  pseudonymizedId: "p101",
  stateCode: "US_XX",
  officerId: "XX_OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2019-12-20"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: new Date("2024-12-31"),
  currentBalance: 221.88,
  specialConditions: ["EXAMPLE OF SPECIAL CONDITIONS HERE"],
  allEligibleOpportunities: ["compliantReporting"] as OpportunityType[],
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
  personName: { givenNames: "Rebekah", surname: "Cortes" },
  personExternalId: "102",
  displayId: "d102",
  pseudonymizedId: "p102",
  stateCode: "US_XX",
  officerId: "XX_OFFICER1",
  supervisionType: "MISDEMEANOR PROBATIONER",
  supervisionLevel: "STANDARD: MINIMUM",
  supervisionLevelStart: new Date("2021-07-05"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: new Date("2024-12-31"),
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
  personName: { givenNames: "Chad", surname: "Kroger" },
  personExternalId: "103",
  displayId: "d103",
  pseudonymizedId: "p103",
  stateCode: "US_XX",
  officerId: "XX_OFFICER1",
  supervisionType: "MISDEMEANOR PROBATIONER",
  supervisionLevel: "STANDARD: MINIMUM",
  supervisionLevelStart: new Date("2021-07-05"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: new Date("2024-12-31"),
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

export const mockClients = [
  ineligibleClient,
  eligibleClient,
  lsuEligibleClient,
];

// SUPERVISORS

export const mockSupervisor: CombinedUserRecord = {
  info: {
    email: "test-supervisor@example.com",
    id: "XX_SUPERVISOR1",
    stateCode: "US_XX",
    givenNames: "TestSupervisorWithStaff",
    surname: "",
    pseudonymizedId: "s001",
    recordType: "supervisionStaff",
  },
};

// MILESTONES

export const milestonesClient: ClientRecord = {
  ...eligibleClient,
  recordId: "us_xx_104",
  personName: { givenNames: "Mickey", surname: "Mouse" },
  personExternalId: "104",
  displayId: "d104",
  pseudonymizedId: "p104",
};
