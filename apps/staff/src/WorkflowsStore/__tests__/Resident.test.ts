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

import { WorkflowsResidentRecord } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { Resident } from "../Resident";

vi.mock("../subscriptions");

let rootStore: RootStore;
let testResident: Resident;
let record: WorkflowsResidentRecord;

function createTestUnit() {
  testResident = new Resident(record, rootStore);
}

beforeEach(() => {
  vi.resetAllMocks();
  rootStore = new RootStore();
  record = {
    allEligibleOpportunities: [],
    officerId: "OFFICER1",
    personExternalId: "PERSON1",
    displayId: "dPERSON1",
    personName: { givenNames: "Real", surname: "Person" },
    pseudonymizedId: "anon1",
    gender: "MALE",
    recordId: "us_xx_PERSON1",
    stateCode: "US_XX",
    custodyLevel: "LEVEL1",
    facilityId: "FACILITY1",
    unitId: "UNIT1",
    admissionDate: "2021-11-01",
    releaseDate: "2029-06-01",
    sccpEligibilityDate: "2026-01-01",
    personType: "RESIDENT",
    metadata: {},
  };
});

const PROPERTIES_FROM_RECORD: [
  keyof Resident,
  keyof WorkflowsResidentRecord,
][] = [
  ["custodyLevel", "custodyLevel"],
  ["facilityId", "facilityId"],
  ["unitId", "unitId"],
];

test.each(PROPERTIES_FROM_RECORD)(
  "%s reflects record",
  (property, recordKey) => {
    createTestUnit();
    expect(testResident[property]).toEqual(record[recordKey]);
  },
);

test("admission date", () => {
  expect(testResident.admissionDate).toEqual(new Date(2021, 10, 1));
});

test("release date", () => {
  expect(testResident.releaseDate).toEqual(new Date(2029, 5, 1));
});

test("SCCP eligibility date", () => {
  createTestUnit();
  expect(testResident.sccpEligibilityDate).toEqual(new Date(2026, 0, 1));
});
