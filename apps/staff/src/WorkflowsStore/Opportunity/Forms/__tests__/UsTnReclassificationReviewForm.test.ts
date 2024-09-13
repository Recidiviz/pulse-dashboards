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

import { assessmentQuestionNumbers } from "../../../../core/Paperwork/US_TN/CustodyReclassification/assessmentQuestions";
import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { UsTnAnnualReclassificationReviewOpportunity } from "../../UsTn";
import { UsTnReclassificationReviewForm } from "../UsTnReclassificationReviewForm";

// To adapt this to a new form/opportunity, change the type of `form` and update the opp and
// person constructors if needed. Individual tests can modify personRecord and oppRecord, but
// for supervision opportunities be sure to call `opp.person.updateRecord(personRecord)` after
// changing the personRecord.

let form: UsTnReclassificationReviewForm;
let opp: (typeof form)["opportunity"];
let personRecord: (typeof opp)["person"]["record"];
let oppRecord: (typeof opp)["record"] & object;
let formUpdates: ((typeof opp)["updates"] & {
  referralForm: object;
})["referralForm"]["data"];

type PartialFormData = ReturnType<(typeof form)["prefilledDataTransformer"]>;

function createTestUnit() {
  const rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  personRecord = {
    personType: "RESIDENT",
    stateCode: "US_OZ",
    recordId: "US_OZ1",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    gender: "MALE",
    personExternalId: "pei1",
    personName: { givenNames: "Joe", middleNames: "Quimby", surname: "Test" },
    officerId: "zzz",
    allEligibleOpportunities: [],
    facilityId: "facility1",
    metadata: {},
  };

  oppRecord = {
    stateCode: "US_OZ",
    externalId: "pei1",
    formReclassificationDueDate: new Date("2024-01-01"),
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
      q8Notes: [
        {
          detainerReceivedDate: new Date("2022-08-22"),
          detainerFelonyFlag: true,
          detainerMisdemeanorFlag: false,
        },
      ],
      lastCafDate: new Date("2019-04-02T12:00"),
      lastCafTotal: "20",
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      latestClassificationDate: new Date("2019-04-03T12:00"),
      levelOfCare: "LOC",
      hasIncompatibles: true,
      incompatibleArray: [
        { incompatibleOffenderId: "1", incompatibleType: "O" },
        { incompatibleOffenderId: "2", incompatibleType: "O" },
        { incompatibleOffenderId: "3", incompatibleType: "O" },
      ],
      statusAtHearingSeg: "GEN",
    },
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: null,
      custodyLevelIsNotMax: null,
      custodyLevelComparedToRecommended: {
        custodyLevel: "MINIMUM",
        recommendedCustodyLevel: "MINIMUM",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {},
  };

  formUpdates = {};

  const person = new Resident(personRecord, rootStore);
  opp = new UsTnAnnualReclassificationReviewOpportunity(person);
  vi.spyOn(opp, "record", "get").mockImplementation(() => oppRecord as any);
  vi.spyOn(opp.form, "updates", "get").mockImplementation(
    () => ({ data: formUpdates }) as any,
  );
  form = opp.form;
}

const baseResult: PartialFormData = {
  date: "2/29/20",
  institutionName: "facility1",
  recommendationFacilityAssignment: "facility1",
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
  q3Note: "ROBBERY-ARMED WITH DEADLY WEAPON",
  q8Note: "8/22/22 - Felony",
  residentFullName: "Joe Test",
  currentCustodyLevel: "MINIMUM",
  hasIncompatibles: true,
  incompatiblesList: "1, 2, 3",
  statusAtHearing: "GEN",
  recommendationJustification:
    "Justification for classification: \nLevel of Care: LOC\nLatest PREA screening: Unavailable",
};

beforeEach(() => {
  configure({ safeDescriptors: false });
  tk.freeze("2020-02-29T12:00");
  createTestUnit();
});

afterEach(() => {
  vi.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("prefilledDataTransformer", () => {
  test("fills fields", () => {
    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>(
      baseResult,
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

  test("formats q6Notes", () => {
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

  test("formats q7Notes", () => {
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

  test("formats q8Notes (old format)", () => {
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
      q8Note: "2/1/19 - Felony; 2/1/20 - Misdemeanor",
    });
  });

  test("formats q8Notes (new format)", () => {
    oppRecord.formInformation.q8Notes = [
      {
        detainerFelonyFlag: false,
        detainerMisdemeanorFlag: false,
        detainerReceivedDate: new Date("2019-02-01"),
        jurisdiction: "TN",
        description: "DESCRIPTION",
        chargePending: true,
      },
      {
        detainerFelonyFlag: false,
        detainerMisdemeanorFlag: true,
        detainerReceivedDate: new Date("2020-02-01"),
        jurisdiction: "TN",
        description: "DESCRIPTION",
        chargePending: false,
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      q8Note:
        "2/1/19 - DESCRIPTION - Jurisdiction: TN - Charge Pending; 2/1/20 - Misdemeanor - DESCRIPTION - Jurisdiction: TN - No Charge Pending",
    });
  });

  test("formats recommendationJustification", () => {
    oppRecord.formInformation.activeRecommendations = [
      {
        Recommendation: "RECA",
        Pathway: "P",
        PathwayName: "PATHWAY",
        TreatmentGoal: "T",
        VantagePointTitle: "REC A",
      },
      {
        Recommendation: "RECB",
        Pathway: "P",
        PathwayName: "PATHWAY",
        TreatmentGoal: "T",
        VantagePointTitle: "REC B",
      },
      {
        Recommendation: "RECA",
        Pathway: "P",
        PathwayName: "PATHWAY",
        TreatmentGoal: "T",
        VantagePointTitle: "REC A",
      },
    ];

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      ...baseResult,
      recommendationJustification:
        "Justification for classification: \nLevel of Care: LOC\nLatest PREA screening: Unavailable\nActive Recommendations: RECA, RECB",
    });
  });
});

describe("derivedData", () => {
  test("Passes through fields by default", () => {
    formUpdates = {
      omsId: "foo",
      q6Note: "bar",
    };
    expect(form.derivedData.omsId).toBe("foo");
    expect(form.derivedData.q6Note).toBe("bar");
  });

  test("Expands multiple choice", () => {
    formUpdates = {
      statusAtHearing: "GEN",
    };
    expect(form.derivedData.statusAtHearingSelectedGEN).toBe(true);
    expect(form.derivedData).not.toHaveProperty("statusAtHearingOther");
  });

  test("Expands multiple choice (other)", () => {
    formUpdates = {
      statusAtHearing: "SEG",
    };
    expect(form.derivedData.statusAtHearingOther).toBe("SEG");
  });

  describe("CAF", () => {
    test("Full form", () => {
      formUpdates = {
        q1Selection: 0,
        q2Selection: 0,
        q3Selection: 0,
        q4Selection: 0,
        q5Selection: 0,
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      };
      expect(form.derivedData.q1Selected0).toBe(true);
      expect(form.derivedData.q1Score).toBe(3);
      expect(form.derivedData.scheduleAText).toBe("Complete Schedule B");
      expect(form.derivedData.scheduleAScore).toBe(3);
      expect(form.derivedData.q5Selected0).toBe(true);
      expect(form.derivedData.q5Score).toBe(-2);
      expect(form.derivedData.totalText).toBe("MINIMUM");
      expect(form.derivedData.totalScore).toBe(4);
    });

    test("Blank in Schedule A", () => {
      oppRecord.formInformation = {};
      formUpdates = {
        // q1 is missing
        q2Selection: 1,
        q3Selection: 3,
        q4Selection: 3,
        q5Selection: 0,
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      };
      expect(form.derivedData).not.toHaveProperty("q1Selected0");
      expect(form.derivedData).not.toHaveProperty("q1Score");
      expect(form.derivedData.scheduleAText).toBe("");
      expect(form.derivedData.scheduleAScore).toBe("");
      expect(form.derivedData.q5Selected0).toBe(true); // Schedule B questions are still filled out
      expect(form.derivedData.q5Score).toBe(-2);
      expect(form.derivedData.totalText).toBe("");
      expect(form.derivedData.totalScore).toBe("");
    });

    test("Blank in Schedule B", () => {
      oppRecord.formInformation = {};
      formUpdates = {
        q1Selection: 0,
        q2Selection: 0,
        q3Selection: 0,
        q4Selection: 0,
        // q5 is missing
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      };
      expect(form.derivedData.q1Selected0).toBe(true);
      expect(form.derivedData.q1Score).toBe(3);
      expect(form.derivedData.scheduleAText).toBe("Complete Schedule B");
      expect(form.derivedData.scheduleAScore).toBe(3);
      expect(form.derivedData).not.toHaveProperty("q5Selected0");
      expect(form.derivedData).not.toHaveProperty("q5Score");
      expect(form.derivedData.totalText).toBe("");
      expect(form.derivedData.totalScore).toBe("");
    });

    test("High Schedule A Score", () => {
      formUpdates = {
        q1Selection: 2,
        q2Selection: 1,
        q3Selection: 3,
        q4Selection: 3,
        q5Selection: 0,
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      };
      expect(form.derivedData.scheduleAText).toBe("MAXIMUM");
      expect(form.derivedData.scheduleAScore).toBe(18);
      expect(form.derivedData).not.toHaveProperty("q5Selected0"); // Schedule B is skipped
      expect(form.derivedData).not.toHaveProperty("q5Score");
      expect(form.derivedData.totalText).toBe("MAXIMUM");
      expect(form.derivedData.totalScore).toBe(18);
    });
  });
});
