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

import { configure } from "mobx";
import tk from "timekeeper";

import { assessmentQuestionNumbers } from "../../../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { UsTnCustodyLevelDowngradeOpportunity } from "../../UsTn";
import { UsTnCustodyLevelDowngradeForm } from "../usTnCustodyLevelDowngradeForm";

// To adapt this to a new form/opportunity, change the type of `form` and update the opp and
// person constructors if needed. Individual tests can modify personRecord and oppRecord, but
// for supervision opportunities be sure to call `opp.person.updateRecord(personRecord)` after
// changing the personRecord.

let form: UsTnCustodyLevelDowngradeForm;
let opp: typeof form["opportunity"];
let personRecord: typeof opp["person"]["record"];
let oppRecord: typeof opp["record"] & object;

type PartialFormData = ReturnType<typeof form["prefilledDataTransformer"]>;

function createTestUnit() {
  const rootStore = new RootStore();
  personRecord = {
    personType: "RESIDENT",
    stateCode: "US_OZ",
    recordId: "US_OZ1",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    personExternalId: "pei1",
    personName: { givenNames: "Joe", middleNames: "Quimby", surname: "Test" },
    officerId: "zzz",
    allEligibleOpportunities: [],
    facilityId: "facility1",
  };

  oppRecord = {
    stateCode: "US_OZ",
    externalId: "pei1",
    formInformation: {
      q1Score: 3,
      q2Score: 0,
      q3Score: 0,
      q4Score: 0,
      q5Score: -2,
      q6Score: -4,
      q7Score: 2,
      q8Score: 3,
      q9Score: 2,
      q6Notes: [{ eventDate: new Date("2022-08-22"), noteBody: "Some note" }],
      q7Notes: [{ eventDate: new Date("2022-08-22"), noteBody: "Some note" }],
      lastCafDate: new Date("2019-04-02T12:00"),
      lastCafTotal: "20",
      latestClassificationDate: new Date("2019-04-03T12:00"),
      levelOfCare: "LOC",
      activeRecommendations: [],
      classificationType: "SPECIAL",
      hasIncompatibles: true,
      incompatibleArray: [
        { incompatibleOffenderId: "1", incompatibleType: "O" },
        { incompatibleOffenderId: "2", incompatibleType: "O" },
        { incompatibleOffenderId: "3", incompatibleType: "O" },
      ],
      statusAtHearingSeg: "GEN",
    },
    eligibleCriteria: {
      custodyLevelHigherThanRecommended: {
        custodyLevel: "HIGH",
        recommendedCustodyLevel: "LOW",
      },
      custodyLevelIsNotMax: null,
      usTnLatestCafAssessmentNotOverride: {
        overrideReason: "Some reason",
      },
      usTnIneligibleForAnnualReclassification: {
        ineligibleCriteria: ["Some reason"],
      },
    },
    ineligibleCriteria: {},
    caseNotes: {},
  };

  const person = new Resident(personRecord, rootStore);
  opp = new UsTnCustodyLevelDowngradeOpportunity(person);
  jest.spyOn(opp, "record", "get").mockImplementation(() => oppRecord as any);
  form = opp.form;
}

const baseResult: PartialFormData = {
  date: "2/29/20",
  institutionName: "facility1",
  lastCafDate: "4/2/19",
  lastCafTotal: "20",
  latestClassificationDate: "4/3/19",
  levelOfCare: "LOC",
  omsId: "pei1",
  q1Selection: 0,
  q2Selection: 0,
  q3Selection: 0,
  q4Selection: 0,
  q5Selection: 0,
  q6Selection: 0,
  q7Selection: 0,
  q8Selection: 0,
  q9Selection: 0,
  q6Note: "8/22/22 - Some note",
  q7Note: "8/22/22 - Some note",
  residentFullName: "Joe Test",
  currentCustodyLevel: "HIGH",
  hasIncompatibles: true,
  incompatiblesList: "1, 2, 3",
  statusAtHearing: "GEN",
  recommendationJustification: "Level of Care: LOC",
};

beforeEach(() => {
  configure({ safeDescriptors: false });
  tk.freeze("2020-02-29T12:00");
  createTestUnit();
});

afterEach(() => {
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("prefilledDataTransformer", () => {
  test("fills fields", () => {
    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>(
      baseResult
    );
  });

  test("handles 0 scores appropriately", () => {
    oppRecord.formInformation.q1Score = 0;
    oppRecord.formInformation.q2Score = 0;
    oppRecord.formInformation.q3Score = 0;
    oppRecord.formInformation.q4Score = 0;
    oppRecord.formInformation.q5Score = 0;
    oppRecord.formInformation.q6Score = 0;
    oppRecord.formInformation.q7Score = 0;
    oppRecord.formInformation.q8Score = 0;
    oppRecord.formInformation.q9Score = 0;

    expect(form.prefilledDataTransformer()).toStrictEqual({
      ...baseResult,
      q1Selection: -1,
      q2Selection: 0,
      q3Selection: 0,
      q4Selection: 0,
      q5Selection: 1,
      q6Selection: 3,
      q7Selection: -1,
      q8Selection: -1,
      q9Selection: -1,
    });
  });

  test("throws on invalid scores", () => {
    for (const i of assessmentQuestionNumbers) {
      const key = `q${i}Score` as `q${typeof i}Score`;
      const temp = oppRecord.formInformation[key];
      oppRecord.formInformation[key] = 20;
      // eslint-disable-next-line no-loop-func
      expect(() => form.prefilledDataTransformer()).toThrow();
      oppRecord.formInformation[key] = temp;
    }
  });

  test("disambiguates question 1", () => {
    oppRecord.formInformation.q1Score = 5;

    oppRecord.caseNotes["ASSAULTIVE DISCIPLINARIES"] = [
      {
        noteTitle: "AOW - 3", // Weapon, serious injury
        eventDate: new Date("2016-02-01"), // 48 months out
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual({
      ...baseResult,
      q1Selection: 3,
    });

    oppRecord.caseNotes["ASSAULTIVE DISCIPLINARIES"] = [
      {
        noteTitle: "AOW - 1", // Weapon, no serious injury
        eventDate: new Date("2019-02-01"), // 12 months out
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual({
      ...baseResult,
      q1Selection: 1,
    });
  });

  test("formats q3Notes", () => {
    oppRecord.formInformation.currentOffenses = [
      "Offense1",
      "Offense2",
      "Offense1",
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q3Note: "Offense1, Offense2",
    });
  });

  // TODO(#4041): Remove q6 and q7 note fallback
  test("formats q6Notes - old format", () => {
    oppRecord.formInformation.q6Notes = [
      {
        noteBody: "C",
        eventDate: new Date("2019-02-01"),
      },
      {
        noteBody: "A",
        eventDate: new Date("2020-02-01"),
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q6Note: "2/1/19 - Class C, 2/1/20 - Class A",
    });
  });

  test("formats q6Notes - new format", () => {
    oppRecord.formInformation.q6Notes = [
      {
        noteBody: "Class C Incident Details: Some details",
        eventDate: new Date("2019-02-01"),
      },
      {
        noteBody: "Class A Incident Details: Some other details",
        eventDate: new Date("2020-02-01"),
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q6Note:
        "2/1/19 - Class C Incident Details: Some details, 2/1/20 - Class A Incident Details: Some other details",
    });
  });

  // TODO(#4041): Remove q6 and q7 note fallback
  test("formats q7Notes - old format", () => {
    // Identical to q6
    oppRecord.formInformation.q7Notes = [
      {
        noteBody: "C",
        eventDate: new Date("2019-02-01"),
      },
      {
        noteBody: "A",
        eventDate: new Date("2020-02-01"),
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q7Note: "2/1/19 - Class C, 2/1/20 - Class A",
    });
  });

  test("formats q7Notes - new format", () => {
    oppRecord.formInformation.q7Notes = [
      {
        noteBody: "Class C Incident Details: Some details",
        eventDate: new Date("2019-02-01"),
      },
      {
        noteBody: "Class A Incident Details: Some other details",
        eventDate: new Date("2020-02-01"),
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q7Note:
        "2/1/19 - Class C Incident Details: Some details, 2/1/20 - Class A Incident Details: Some other details",
    });
  });

  test("formats q8Notes", () => {
    oppRecord.formInformation.q8Notes = [
      {
        detainerFelonyFlag: true,
        detainerMisdemeanorFlag: false,
        detainerReceivedDate: new Date("2019-02-01"),
      },
      {
        detainerFelonyFlag: false,
        detainerMisdemeanorFlag: true,
        detainerReceivedDate: new Date("2020-02-01"),
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q8Note: "2/1/19 - Felony, 2/1/20 - Misdemeanor",
    });
  });
});
