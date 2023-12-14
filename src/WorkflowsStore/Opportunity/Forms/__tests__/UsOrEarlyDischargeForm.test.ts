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

import { parseISO } from "date-fns";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { UsOrEarlyDischargeOpportunity } from "../../UsOr";
import { UsOrEarlyDischargeForm } from "../UsOrEarlyDischargeForm";

let form: UsOrEarlyDischargeForm;
let opp: typeof form["opportunity"];
let personRecord: typeof opp["person"]["record"];
let oppRecord: typeof opp["record"] & object;
let staffRecord: typeof opp["person"]["assignedStaff"];

function createTestUnit() {
  const rootStore = new RootStore();
  personRecord = {
    personType: "CLIENT",
    stateCode: "US_OZ",
    recordId: "US_OZ1",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    personExternalId: "pei1",
    personName: { givenNames: "Joe", middleNames: "Quimby", surname: "Test" },
    officerId: "zzz",
    allEligibleOpportunities: ["usOrEarlyDischarge"],
  };
  oppRecord = {
    stateCode: "US_OZ",
    externalId: "pei1",
    metadata: {
      programs: [],
    },
    subOpportunities: [
      {
        eligibleCriteria: {
          eligibleStatute: {},
          noAdministrativeSanction: {},
          noConvictionDuringSentence: {},
          pastHalfCompletionOrSixMonths: {},
        },
        ineligibleCriteria: {},
        id: "sent1",
        metadata: {
          sentenceId: "sent1",
          courtCaseNumber: "cc1",
          sentenceSubType: "subtype",
          sentenceImposedDate: parseISO("2020-01-01"),
          sentenceStartDate: parseISO("2020-01-01"),
          sentenceEndDate: parseISO("2020-01-01"),
          sentenceCounty: "COUNTY",
          chargeCounty: "CHARGE COUNTY",
          judgeFullName: "Judge Reinhold",
          sentenceStatute: "STATUTE",
          conditions: [],
        },
      },
    ],
  };
  staffRecord = {
    id: "zzz",
    stateCode: "US_OZ",
    givenNames: "8675309",
    surname: "8675309",
    hasCaseload: true,
    hasFacilityCaseload: false,
    email: null,
  };
  const person = new Client(personRecord, rootStore);
  opp = new UsOrEarlyDischargeOpportunity(person);
  jest.spyOn(opp, "record", "get").mockImplementation(() => oppRecord);
  jest.spyOn(person, "assignedStaff", "get").mockReturnValue(staffRecord);
  form = opp.form;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  createTestUnit();
  tk.freeze(new Date("2023-12-12"));
});

afterEach(() => {
  configure({ safeDescriptors: true });
  jest.resetAllMocks();
  tk.reset();
});

describe("prefilledDataTransformer", () => {
  test("basic transformation", () => {
    expect(form.prefilledDataTransformer()).toMatchInlineSnapshot(`
      Object {
        "clientId": "pei1",
        "givenNames": "Joe",
        "middleNames": "Quimby",
        "officerName": "Caseload 8675309",
        "surname": "Test",
        "todaysDate": "Dec 12, 2023",
      }
    `);
  });
});
