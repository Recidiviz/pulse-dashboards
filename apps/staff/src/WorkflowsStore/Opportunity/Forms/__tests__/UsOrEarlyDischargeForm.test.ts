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
import { UsOrEarnedDischargeOpportunity } from "../../UsOr";
import { UsOrEarnedDischargeForm } from "../UsOrEarnedDischargeForm";

let form: UsOrEarnedDischargeForm;
let opp: (typeof form)["opportunity"];
let personRecord: (typeof opp)["person"]["record"];
let oppRecord: (typeof opp)["record"] & object;
let staffRecord: (typeof opp)["person"]["assignedStaff"];

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
    allEligibleOpportunities: ["usOrEarnedDischarge"],
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
        id: 123,
        metadata: {
          sentenceId: 123,
          courtCaseNumber: "cc1",
          sentenceSubType: "subtype",
          sentenceImposedDate: parseISO("2020-01-01"),
          sentenceStartDate: parseISO("2020-01-05"),
          sentenceEndDate: parseISO("2022-03-08"),
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
    email: null,
  };
  const person = new Client(personRecord, rootStore);
  opp = new UsOrEarnedDischargeOpportunity(person);
  vi.spyOn(opp, "record", "get").mockImplementation(() => oppRecord);
  vi.spyOn(person, "assignedStaff", "get").mockReturnValue(staffRecord);
  form = opp.form;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  createTestUnit();
  tk.freeze(new Date("2023-12-12"));
});

afterEach(() => {
  configure({ safeDescriptors: true });
  vi.resetAllMocks();
  tk.reset();
});

describe("prefilledDataTransformer", () => {
  test("basic transformation", () => {
    expect(form.prefilledDataTransformer()).toMatchInlineSnapshot(`
      {
        "clientId": "pei1",
        "countyAddress": "(Your County Address}",
        "countyFax": "(   )",
        "countyName": "(Your County}",
        "countyPhone": "(   )",
        "givenNames": "Joe",
        "middleNames": "Quimby",
        "officerName": "8675309 8675309",
        "sentences": {
          "123": {
            "county": "COUNTY",
            "docket": "cc1",
            "judgeName": "Judge Reinhold",
            "offenses": "STATUTE",
            "sentenceExpirationDate": "Mar 8, 2022",
            "sentenceStartDate": "Jan 5, 2020",
            "sentenceType": "subtype",
          },
        },
        "surname": "Test",
        "todaysDate": "Dec 12, 2023",
      }
    `);
  });

  test("transform multiple sentences", () => {
    const criteria = {
      eligibleCriteria: {
        eligibleStatute: {},
        noAdministrativeSanction: {},
        noConvictionDuringSentence: {},
        pastHalfCompletionOrSixMonths: {},
      },
      ineligibleCriteria: {},
    };
    const multioppRecord = {
      stateCode: "US_OZ",
      externalId: "pei1",
      metadata: {
        programs: [],
      },
      subOpportunities: [
        {
          ...criteria,
          id: 123,
          metadata: {
            sentenceId: 123,
            courtCaseNumber: "cc1",
            sentenceSubType: "subtype",
            sentenceImposedDate: parseISO("2020-01-01"),
            sentenceStartDate: parseISO("2020-01-05"),
            sentenceEndDate: parseISO("2022-03-08"),
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY",
            judgeFullName: "Judge Reinhold",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
        },
        {
          ...criteria,
          id: 456,
          metadata: {
            sentenceId: 456,
            courtCaseNumber: "cc2",
            sentenceSubType: "subtype2",
            sentenceImposedDate: parseISO("2020-04-04"),
            sentenceStartDate: parseISO("2020-04-05"),
            sentenceEndDate: parseISO("2022-08-08"),
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY",
            judgeFullName: "Judge Judge",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
        },
        {
          ...criteria,
          id: 789,
          metadata: {
            sentenceId: 789,
            courtCaseNumber: "cc3",
            sentenceSubType: "subtype3",
            sentenceImposedDate: parseISO("2020-02-01"),
            sentenceStartDate: parseISO("2020-07-05"),
            sentenceEndDate: parseISO("2022-06-08"),
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY 3",
            judgeFullName: "Judge Jury",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
        },
      ],
    };
    vi.spyOn(opp, "record", "get").mockImplementation(() => multioppRecord);
    expect(form.prefilledDataTransformer()).toMatchSnapshot();
  });
});
