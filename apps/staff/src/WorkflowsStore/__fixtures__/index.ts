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

export const mockIneligibleClient: ClientRecord = {
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
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

const mockEligibleClient: ClientRecord = {
  ...mockIneligibleClient,
  recordId: "us_xx_101",
  personName: { givenNames: "Linet", surname: "Hansen" },
  personExternalId: "101",
  displayId: "d101",
  pseudonymizedId: "p101",
  allEligibleOpportunities: ["compliantReporting"],
};

const mockLsuEligibleClient: ClientRecord = {
  ...mockIneligibleClient,
  recordId: "us_xx_102",
  personName: { givenNames: "Rebekah", surname: "Cortes" },
  personExternalId: "102",
  displayId: "d102",
  pseudonymizedId: "p102",
  stateCode: "US_XX",
  allEligibleOpportunities: ["LSU"],
};

export const mockClients = [
  mockIneligibleClient,
  mockEligibleClient,
  mockLsuEligibleClient,
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
