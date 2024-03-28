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
import {
  IncarcerationStaffRecord,
  StaffRecord,
} from "../../src/FirestoreStore";
import { FirestoreFixture } from "./utils";

const data: IncarcerationStaffRecord[] = [
  // US_ID - IDAHO
  {
    email: "test-officer-6@example.com",
    id: "OFFICER6",
    stateCode: "US_ID",
    givenNames: "Test",
    surname: "Officer6",
  },

  // US_ME - MAINE
  {
    email: "test-officer-5@example.com",
    id: "OFFICER5",
    stateCode: "US_ME",
    givenNames: "Test",
    surname: "Officer5",
  },

  // US_MO - MISSOURI
  {
    email: null,
    id: "FACILITY1",
    stateCode: "US_MO",
    givenNames: "Facility 1",
    surname: "",
  },
  {
    email: "test-officer-7@example.com",
    id: "OFFICER7",
    stateCode: "US_MO",
    givenNames: "Test",
    surname: "Officer7",
  },

  // US_TN - TENNESSEE
  {
    email: "test-officer-5@example.com",
    id: "OFFICER5",
    stateCode: "US_TN",
    givenNames: "Test",
    surname: "Officer5",
  },
];

export const incarcerationStaffData: FirestoreFixture<StaffRecord> = {
  data,
  idFunc: (r) => r.id,
};
