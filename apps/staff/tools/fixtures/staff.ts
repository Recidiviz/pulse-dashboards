// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY, without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================
import { StaffRecord } from "../../src/FirestoreStore";
import { FixtureData } from "../workflowsFixtures";

const data: StaffRecord[] = [
  // US_CA - CALIFORNIA
  {
    email: "test-officer-1@example.com",
    district: "DISTRICT 1",
    id: "OFFICER1",
    stateCode: "US_CA",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Agent1",
  },
  {
    email: "test-officer-1@example.com",
    district: "DISTRICT 1",
    id: "OFFICER2",
    stateCode: "US_CA",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Agent2",
  },
  // US_ID - IDAHO
  {
    email: "test-officer-4@example.com",
    district: "DISTRICT 1",
    id: "OFFICER4",
    stateCode: "US_ID",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer4",
  },
  {
    email: "test-officer-6@example.com",
    id: "OFFICER6",
    stateCode: "US_ID",
    hasCaseload: true,
    hasFacilityCaseload: true,
    givenNames: "Test",
    surname: "Officer6",
  },

  // US_ME - MAINE
  {
    email: "test-officer-5@example.com",
    id: "OFFICER5",
    stateCode: "US_ME",
    hasCaseload: false,
    hasFacilityCaseload: true,
    givenNames: "Test",
    surname: "Officer5",
  },
  {
    email: "test-officer-8@example.com",
    id: "OFFICER8",
    stateCode: "US_ME",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer8",
  },

  // US_MI - MICHIGAN
  {
    email: "test-officer-8@example.com",
    id: "OFFICER8",
    stateCode: "US_MI",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer8",
  },

  // US_MO - MISSOURI
  {
    email: null,
    id: "FACILITY1",
    stateCode: "US_MO",
    hasCaseload: false,
    hasFacilityCaseload: true,
    givenNames: "Facility 1",
    surname: "",
  },
  {
    email: "test-officer-7@example.com",
    id: "OFFICER7",
    stateCode: "US_MO",
    hasCaseload: false,
    hasFacilityCaseload: true,
    givenNames: "Test",
    surname: "Officer7",
  },

  // US_ND - NORTH DAKOTA
  {
    email: "test-officer-3@example.com",
    district: "DISTRICT 1",
    id: "OFFICER3",
    stateCode: "US_ND",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer3",
  },

  // US_OR - OREGON
  {
    email: null,
    id: "271828",
    stateCode: "US_OR",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "271828",
    surname: "271828",
  },
  {
    email: null,
    id: "314159",
    stateCode: "US_OR",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "314159",
    surname: "314159",
  },

  // US_TN - TENNESSEE
  {
    email: "test-officer@example.com",
    district: "DISTRICT 50",
    id: "OFFICER1",
    stateCode: "US_TN",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer1",
  },
  {
    email: null,
    district: "DISTRICT 50",
    id: "OFFICER2",
    stateCode: "US_TN",
    hasCaseload: true,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Officer2",
  },
  {
    email: "test-officer-5@example.com",
    id: "OFFICER5",
    stateCode: "US_TN",
    hasCaseload: false,
    hasFacilityCaseload: true,
    givenNames: "Test",
    surname: "Officer5",
  },
  {
    email: "test-supervisor@example.com",
    district: "DISTRICT 50",
    id: "SUPERVISOR1",
    stateCode: "US_TN",
    hasCaseload: false,
    hasFacilityCaseload: false,
    givenNames: "Test",
    surname: "Supervisor",
  },
];

export const staffData: FixtureData<StaffRecord> = {
  data,
  idFunc: (r) => r.id,
};
