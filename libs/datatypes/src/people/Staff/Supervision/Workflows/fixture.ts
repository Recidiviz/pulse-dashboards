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

import { makeRecordFixture } from "../../../../utils/zod/object/makeRecordFixture";
import { SupervisionStaffRecord, supervisionStaffRecordSchema } from "./schema";

export const usIdSupervisionStaffFixtures: Array<
  SupervisionStaffRecord["input"]
> = [
  {
    email: "test-officer-4@example.com",
    district: "DISTRICT 1",
    id: "OFFICER4",
    stateCode: "US_ID",
    givenNames: "Walter",
    surname: "Harris",
    supervisorExternalId: "SUPER847",
  },
];

export const supervisionStaffFixtures: Array<SupervisionStaffRecord> = [
  // US_CA - CALIFORNIA
  {
    email: "test-officer-1@example.com",
    district: "DISTRICT 1",
    id: "OFFICER1",
    stateCode: "US_CA",
    givenNames: "Test",
    surname: "Agent1",
    supervisorExternalId: "SUPERVISOR1",
  },
  {
    email: "test-officer-1@example.com",
    district: "DISTRICT 1",
    id: "OFFICER2",
    stateCode: "US_CA",
    givenNames: "Test",
    surname: "Agent2",
    supervisorExternalId: null,
  },
  // US_ID - IDAHO
  ...usIdSupervisionStaffFixtures,

  // US_ME - MAINE
  {
    email: "test-officer-8@example.com",
    id: "OFFICER8",
    stateCode: "US_ME",
    givenNames: "Test",
    surname: "Officer8",
    supervisorExternalId: null,
  },

  // US_MI - MICHIGAN
  {
    email: "test-officer-8@example.com",
    id: "OFFICER8",
    stateCode: "US_MI",
    givenNames: "Test",
    surname: "Officer8",
    supervisorExternalId: "1290831",
  },

  // US_ND - NORTH DAKOTA
  {
    email: "test-officer-3@example.com",
    district: "DISTRICT 1",
    id: "OFFICER3",
    stateCode: "US_ND",
    givenNames: "Test",
    surname: "Officer3",
    supervisorExternalId: null,
  },

  // US_OR - OREGON
  {
    email: null,
    id: "271828",
    stateCode: "US_OR",
    givenNames: "271828",
    surname: "271828",
    supervisorExternalId: null,
  },
  {
    email: null,
    id: "314159",
    stateCode: "US_OR",
    givenNames: "314159",
    surname: "314159",
    supervisorExternalId: "SUPER221",
  },

  // US_PA - PENNSYLVANIA
  {
    email: "test-officer@example.com",
    id: "OFFICER1",
    stateCode: "US_PA",
    givenNames: "TEST",
    surname: "OFFICER1",
    supervisorExternalId: "25-1239123A",
  },
  {
    email: "test-officer@example.com",
    id: "OFFICER2",
    stateCode: "US_PA",
    givenNames: "TEST",
    surname: "OFFICER2",
    supervisorExternalId: null,
  },

  // US_TN - TENNESSEE
  {
    email: "test-officer@example.com",
    district: "DISTRICT 50",
    id: "OFFICER1",
    stateCode: "US_TN",
    givenNames: "Test",
    surname: "Officer1",
    supervisorExternalId: "SUPERVISOR1",
  },
  {
    email: null,
    district: "DISTRICT 50",
    id: "OFFICER2",
    stateCode: "US_TN",
    givenNames: "Test",
    surname: "Officer2",
    supervisorExternalId: "SUPERVISOR1",
  },
  {
    email: "test-supervisor@example.com",
    district: "DISTRICT 50",
    id: "SUPERVISOR1",
    stateCode: "US_TN",
    givenNames: "Test",
    surname: "Supervisor",
    supervisorExternalId: null,
  },
  {
    email: null,
    district: "DISTRICT 50",
    id: "OFFICER3",
    stateCode: "US_TN",
    givenNames: "Test",
    surname: "Officer3",
    supervisorExternalId: null,
  },
].map((r) => makeRecordFixture(supervisionStaffRecordSchema, r));