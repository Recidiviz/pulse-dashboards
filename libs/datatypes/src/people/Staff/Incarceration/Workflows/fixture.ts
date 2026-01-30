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
import {
  IncarcerationStaffRecord,
  incarcerationStaffRecordSchema,
} from "./schema";

/* These fixtures are used for Workflows Demo Mode and Offline Mode. */
export const incarcerationStaffFixtures: Array<IncarcerationStaffRecord> = [
  // US_AZ - ARIZONA
  {
    email: "az-officer-1@example.com",
    id: "OFFICER1",
    stateCode: "US_AZ",
    givenNames: "Solomon",
    surname: "Cordova",
    pseudonymizedId: "p001",
  },
  {
    email: "az-officer-2@example.com",
    id: "OFFICER2",
    stateCode: "US_AZ",
    givenNames: "Safa",
    surname: "Stevens",
    pseudonymizedId: "p002",
  },
  {
    email: "az-officer-3@example.com",
    id: "OFFICER3",
    stateCode: "US_AZ",
    givenNames: "Idris",
    surname: "Vang",
    pseudonymizedId: "p003",
  },

  // US_ME - MAINE
  {
    email: "test-officer-5@example.com",
    id: "OFFICER5",
    stateCode: "US_ME",
    givenNames: "Mikolaj",
    surname: "Gomez",
    pseudonymizedId: "p005",
  },
  // US_UT - UTAH
  {
    email: "ut-officer-1@example.com",
    id: "OFFICER1",
    stateCode: "US_UT",
    givenNames: "Michael",
    surname: "Maxwell",
    pseudonymizedId: "anon_officer1",
  },
  {
    email: "ut-officer-2@example.com",
    id: "OFFICER2",
    stateCode: "US_UT",
    givenNames: "Riley",
    surname: "Goodman",
    pseudonymizedId: "anon_officer2",
  },
].map((r) => makeRecordFixture(incarcerationStaffRecordSchema, r));
