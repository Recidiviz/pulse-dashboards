// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  ClientUpdateRecord,
  CombinedUserRecord,
  StaffRecord,
} from "../../firestore";
import { dateToTimestamp } from "../utils";

export const mockOfficer: CombinedUserRecord = {
  info: {
    id: "OFFICER1",
    district: "DISTRICT 1",
    name: "Test Officer",
    stateCode: "US_XX",
    email: "test-officer@example.com",
    hasCaseload: true,
  },
  updates: {
    stateCode: "US_XX",
    email: "test-officer@example.com",
  },
};

export const mockSupervisor: CombinedUserRecord = {
  info: {
    id: "SUPERVISOR1",
    district: "DISTRICT 1",
    name: "Test Supervisor",
    stateCode: "US_XX",
    email: "test-supervisor@example.com",
    hasCaseload: false,
  },
  updates: {
    stateCode: "US_XX",
    email: "test-supervisor@example.com",
  },
};

export const mockDirector: CombinedUserRecord = {
  info: {
    id: "DIRECTOR1",
    name: "Test Director",
    stateCode: "US_XX",
    email: "test-director@example.com",
    hasCaseload: false,
  },
  updates: {
    stateCode: "US_XX",
    email: "test-director@example.com",
  },
};

export const mockClients: ClientRecord[] = [
  {
    personName: {
      givenNames: "TONYE",
      middleName: "BARBY",
      surname: "THOMPSON",
    },
    personExternalId: "100",
    stateCode: "US_XX",
    officerId: "OFFICER1",
    supervisionType: "TN PAROLEE",
    supervisionLevel: "STANDARD: MEDIUM",
    supervisionLevelStart: dateToTimestamp("2019-10-26"),
    address: "123 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: dateToTimestamp("2025-12-31"),
    currentBalance: 0,
    lastPaymentAmount: 50,
    lastPaymentDate: dateToTimestamp("2021-11-15"),
    specialConditions: "SPECIAL CONDITIONS TEST TEST",
    compliantReportingEligible: null,
  },
  {
    personName: { givenNames: "LINET", surname: "HANSEN" },
    personExternalId: "101",
    stateCode: "US_XX",
    officerId: "OFFICER1",
    supervisionType: "TN PROBATIONER",
    supervisionLevel: "STANDARD: MEDIUM",
    supervisionLevelStart: dateToTimestamp("2019-12-20"),
    address: "123 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: dateToTimestamp("2024-12-31"),
    currentBalance: 221.88,
    specialConditions: "EXAMPLE OF SPECIAL CONDITIONS HERE",
    compliantReportingEligible: {
      judicialDistrict: "A",
      lastDrugNegative: [],
      lastSanction: null,
      offenseType: ["EXAMPLE"],
    },
  },
];

export const mockOfficers: StaffRecord[] = [
  {
    name: "Foo Fakename",
    id: "OFFICER2",
    stateCode: mockOfficer.info.stateCode,
    district: "1",
    hasCaseload: true,
    email: null,
  },
  {
    name: "Bar Realname",
    id: "OFFICER3",
    stateCode: mockOfficer.info.stateCode,
    district: "1",
    hasCaseload: true,
    email: null,
  },
];

export const mockClientUpdate: ClientUpdateRecord = {
  personExternalId: "100",
  personName: {
    givenNames: "TONYE",
    surname: "THOMPSON",
    middleName: "BARBY",
  },
  stateCode: mockOfficer.info.stateCode,
};
