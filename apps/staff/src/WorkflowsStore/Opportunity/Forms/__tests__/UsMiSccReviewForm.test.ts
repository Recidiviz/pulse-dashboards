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
import { Resident } from "../../../Resident";
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "../../UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity/UsMiSecurityClassificationCommitteeReviewOpportunity";
import { UsMiSCCReviewForm } from "../UsMiSCCReviewForm";

// To adapt this to a new form/opportunity, change the type of `form` and update the opp and
// person constructors if needed. Individual tests can modify personRecord and oppRecord, but
// for supervision opportunities be sure to call `opp.person.updateRecord(personRecord)` after
// changing the personRecord.

let form: UsMiSCCReviewForm;
let opp: (typeof form)["opportunity"];
let personRecord: (typeof opp)["person"]["record"];
let oppRecord: (typeof opp)["record"] & object;

function createTestUnit() {
  const rootStore = new RootStore();
  personRecord = {
    personType: "RESIDENT",
    stateCode: "US_OZ",
    recordId: "US_OZ1",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    personExternalId: "pei1",
    personName: { givenNames: "Joe", surname: "Test" },
    officerId: "OFFICER1",
    allEligibleOpportunities: ["usMiSecurityClassificationCommitteeReview"],
    gender: "female",
  };
  oppRecord = {
    isOverdue: true,
    stateCode: "US_OZ",
    externalId: "pei1",
    eligibleCriteria: {
      housingUnitTypeIsSolitaryConfinement: {
        solitaryStartDate: new Date("2019-04-01T12:00"),
      },
      usMiPastSecurityClassificationCommitteeReviewDate: {
        facilitySolitaryStartDate: null,
        latestSccReviewDate: null,
        nextSccDate: null,
        numberOfExpectedReviews: 2,
        numberOfReviews: 1,
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      adSegStaysAndReasonsWithin3Yrs: [
        "(2023-12-01,040,011,),",
        "(2022-12-01,040,011,)",
        "(2023-06-01,040,)",
        "(2021-06-01,040,)",
        "(2022-06-01,042,)",
      ],
      segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
      segregationClassificationDate: new Date("2019-04-01T12:00"),
      prisonerName: "FIRST RESIDENT",
      prisonerNumber: "pei1",
      maxReleaseDate: new Date("2027-04-01T12:00"),
      minReleaseDate: new Date("2025-04-01T12:00"),
      lock: "lock1",
      facility: "FACILITY1",
      OPT: true,
      STG: "1",
      bondableOffensesWithin6Months:
        "(040, 011, 2024-01-01), (011, 2023-12-12)",
      nonbondableOffensesWithin1Year: "(008, 2023-12-01)",
    },
    metadata: {
      daysInCollapsedSolitarySession: 35,
      OPT: false,
      lessThan3MonthsFromErd: false,
      recentBondableOffenses: "(423, 2023-12-27)",
      recentNonbondableOffenses: "(008, 2023-05-31)",
      adSegStaysAndReasonsWithin3Yrs: [
        "(2021-11-03,014,)",
        "(2022-03-02,014,)",
        "(2021-08-02,030,)",
        "(2023-10-12,003,014,029,)",
        "(2022-05-16,014,)",
        "(2022-04-30,012,)",
      ],
      neededProgramming: "101",
      completedProgramming: "105",
    },
  };
  const person = new Resident(personRecord, rootStore);
  opp = new usMiSecurityClassificationCommitteeReviewOpportunity(person);
  vi.spyOn(opp, "record", "get").mockImplementation(() => oppRecord);
  form = opp.form;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  createTestUnit();
  tk.freeze(new Date("2024-04-12"));
});

afterEach(() => {
  configure({ safeDescriptors: true });
  tk.reset();
});

describe("prefilledDataTransformer", () => {
  test("basic transformation", () => {
    expect(form.prefilledDataTransformer()).toMatchInlineSnapshot(`
      {
        "AMX": "Apr 1, 2027",
        "ERD": "Apr 1, 2025",
        "OPT": true,
        "STG1": true,
        "STG2": false,
        "adSegDate1": "2023-12-01",
        "adSegDate2": "2023-06-01",
        "adSegDate3": "2022-12-01",
        "adSegDate4": "2022-06-01",
        "adSegReason1": "040,011,,",
        "adSegReason2": "040,",
        "adSegReason3": "040,011,",
        "adSegReason4": "042,",
        "adminSeg": false,
        "adminSegDate": "",
        "bondableOffensesWithin6Months": "(040, 011, 2024-01-01), (011, 2023-12-12)",
        "facility": "FACILITY1",
        "lock": "lock1",
        "nonbondableOffensesWithin1Year": "(008, 2023-12-01)",
        "prisonerName": "FIRST RESIDENT",
        "prisonerNumber": "pei1",
        "punSeg": false,
        "punSegDate": "",
        "tempSeg": true,
        "tempSegDate": "Apr 1, 2019",
      }
    `);
  });
});
