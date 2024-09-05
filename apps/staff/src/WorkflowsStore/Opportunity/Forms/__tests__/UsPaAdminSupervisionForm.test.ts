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

import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { UsPaAdminSupervisionOpportunity } from "../../UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import { UsPaAdminSupervisionForm } from "../UsPaAdminSupervisionForm";

// To adapt this to a new form/opportunity, change the type of `form` and update the opp and
// person constructors if needed. Individual tests can modify personRecord and oppRecord, but
// for supervision opportunities be sure to call `opp.person.updateRecord(personRecord)` after
// changing the personRecord.

let form: UsPaAdminSupervisionForm;
let opp: (typeof form)["opportunity"];
let personRecord: (typeof opp)["person"]["record"];
let oppRecord: (typeof opp)["record"] & object;

function createTestUnit() {
  const rootStore = new RootStore();
  personRecord = {
    personType: "CLIENT",
    stateCode: "US_OZ",
    recordId: "US_OZ1",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    personExternalId: "pei1",
    personName: { givenNames: "Joe", surname: "Test" },
    officerId: "OFFICER1",
    allEligibleOpportunities: ["usPaAdminSupervision"],
    supervisionLevel: "MEDIUM",
  };
  oppRecord = {
    stateCode: "US_OZ",
    externalId: "pei1",
    eligibleCriteria: {
      usPaFulfilledRequirements: null,
      usPaNoHighSanctionsInPastYear: null,
      usPaNotServingIneligibleOffenseForAdminSupervision: null,
    },
    ineligibleCriteria: {},
    caseNotes: {},
    formInformation: {
      drugCharge: true,
      statue14: false,
      statue30: true,
      statue37: false,
    },
  };
  const person = new Client(personRecord, rootStore);
  opp = new UsPaAdminSupervisionOpportunity(person);
  vi.spyOn(opp, "record", "get").mockImplementation(() => oppRecord);
  form = opp.form;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  createTestUnit();
  tk.freeze(new Date("2023-12-12"));
});

afterEach(() => {
  configure({ safeDescriptors: true });
  tk.reset();
});

describe("prefilledDataTransformer", () => {
  test("formats name with comma separator", () => {
    expect(form.prefilledDataTransformer().reentrantName).toEqual("Test, Joe");
  });

  test("basic transformation", () => {
    expect(form.prefilledDataTransformer()).toMatchInlineSnapshot(`
      {
        "charge780_11314": false,
        "charge780_11330": true,
        "charge780_11337": false,
        "criteriaHighSanction": false,
        "currentGradeOfSupervisionLevel": "Medium",
        "dateOfReview": "Dec 12, 2023",
        "guiltyPADrugCharge": true,
        "paroleNumber": "pei1",
        "reentrantName": "Test, Joe",
      }
    `);
  });
});
