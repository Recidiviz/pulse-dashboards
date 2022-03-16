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

export const mockUser: CombinedUserRecord = {
  info: {
    id: "OFFICER1",
    district: "DISTRICT 1",
    name: "{}",
    stateCode: "US_XX",
    email: "test-officer@example.com",
    hasCaseload: true,
  },
  updates: {
    stateCode: "US_XX",
    email: "test-officer@example.com",
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
    compliantReportingEligible: null,
  },
];

export const mockOfficers: StaffRecord[] = [
  {
    name: "Foo Fakename",
    id: "OFFICER2",
    stateCode: mockUser.info.stateCode,
    district: "1",
    hasCaseload: true,
    email: null,
  },
  {
    name: "Bar Realname",
    id: "OFFICER3",
    stateCode: mockUser.info.stateCode,
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
  stateCode: mockUser.info.stateCode,
};
