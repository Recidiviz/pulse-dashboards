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

import { cloneDeep } from "lodash";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import {
  LSUEligibleClientRecord,
  LSUReferralRecordFixture,
} from "../__fixtures__";
import {
  LSUDraftData,
  LSUOpportunity,
  LSUReferralRecord,
} from "../LSUOpportunity";

vi.mock("../../../subscriptions");

let opp: LSUOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(clientRecord: typeof LSUEligibleClientRecord) {
  root = new RootStore();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "LSU",
  ]);
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.potentialOpportunities.LSU;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
});

afterEach(() => {
  vi.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = LSUReferralRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  interface LSUPrefilledDataTransformerTestProps {
    property: keyof LSUDraftData;
    formInformation: Partial<LSUReferralRecord["formInformation"]>;
    expected: string;
  }

  test.each<LSUPrefilledDataTransformerTestProps>([
    {
      property: "employmentInformation",
      expected: "Recidiviz\nVerified 02/02/2022",
      formInformation: {
        employerName: "Recidiviz",
        employmentDateVerified: "2022-02-02 02:00",
      },
    },
    {
      property: "employmentInformation",
      expected:
        "Recidiviz\n123 Fake St.\nSan Francisco, CA\nStarted 01/01/2022\nVerified 02/02/2022",
      formInformation: {
        employerName: "Recidiviz",
        employerAddress: "123 Fake St.\nSan Francisco, CA",
        employmentDateVerified: "2022-02-02 02:00",
        employmentStartDate: "2022-01-01 01:00",
      },
    },
    {
      property: "assessmentInformation",
      expected: "Score: 6",
      formInformation: { assessmentScore: 6 },
    },
    {
      property: "assessmentInformation",
      expected: "Last assessed: 02/02/2022",
      formInformation: { assessmentDate: "2022-02-02 02:00" },
    },
    {
      property: "assessmentInformation",
      expected: "Score: 6\nLast assessed: 02/02/2022",
      formInformation: {
        assessmentDate: "2022-02-02 02:00",
        assessmentScore: 6,
      },
    },
    {
      property: "substanceTest",
      expected: "",

      formInformation: {
        latestNegativeDrugScreenDate: undefined,
      },
    },
    {
      property: "substanceTest",
      expected: "Tested negative on 02/02/2022",
      formInformation: {
        latestNegativeDrugScreenDate: "2022-02-02 02:00",
      },
    },

    {
      property: "treatmentCompletionDate",
      expected: "TX COMPLETION on 02/02/2022",
      formInformation: {
        txDischargeDate: "2022-02-02",
        txNoteTitle: "TX COMPLETION",
      },
    },
    {
      property: "treatmentCompletionDate",
      expected:
        "TX COMPLETION on 02/02/2022\nClient completed treatment with TX ORGANIZATION",
      formInformation: {
        txDischargeDate: "2022-02-02",
        txNoteTitle: "TX COMPLETION",
        txNoteBody: "Client completed treatment with TX ORGANIZATION",
      },
    },
    {
      property: "ncicCheck",
      expected:
        "Completed on 02/02/2022\nNo new charges since underlying offense/last PV.",
      formInformation: {
        ncicReviewDate: "2022-02-02",
        ncicNoteBody: "No new charges since underlying offense/last PV.",
      },
    },
  ])(
    "opp.prefilledDataTransformer().$field",
    ({ property, formInformation, expected }) => {
      if (!opp.record) {
        throw new Error("Opportunity must have a record set");
      }

      const originalFormInformation = formInformation;
      opp.record.formInformation = {
        ...originalFormInformation,
        ...formInformation,
      };

      const { [property]: actual } = opp.form.prefilledData;
      expect(actual).toEqual(expected);

      opp.record.formInformation = originalFormInformation;
    },
  );
});

describe("no UA required", () => {
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    const record = LSUReferralRecordFixture;
    record.eligibleCriteria.negativeDaWithin90Days = {
      latestUaDates: [],
      latestUaResults: [],
    };
    referralSub.data = record;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});

describe("almost eligible income verified within 3 months", () => {
  const almostEligibleIncomeVerified = cloneDeep(LSUReferralRecordFixture);

  almostEligibleIncomeVerified.ineligibleCriteria.usIdIncomeVerifiedWithin3Months =
    true;

  delete almostEligibleIncomeVerified.eligibleCriteria
    .usIdIncomeVerifiedWithin3Months;

  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = almostEligibleIncomeVerified;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs employment verification",
        tooltip:
          "Policy requirement: Verified employment status, full-time student, or adequate lawful " +
          "income from non-employment sources have been confirmed within past 3 months.",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs employment verification",
    );
  });
});

describe("almost eligible on supervision at least a year", () => {
  const almostEligibleSupervisionLength = cloneDeep(LSUReferralRecordFixture);

  almostEligibleSupervisionLength.ineligibleCriteria.onSupervisionAtLeastOneYear =
    {
      eligibleDate: new Date(2022, 12, 1),
    };

  delete almostEligibleSupervisionLength.eligibleCriteria
    .onSupervisionAtLeastOneYear;
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = almostEligibleSupervisionLength;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs 5 more months on supervision",
        tooltip:
          "Policy requirement: Has been on supervision for at least 1 year",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs 5 more months on supervision",
    );
  });
});

describe("almost eligible days remaining on supervision", () => {
  const almostEligibleSupervisionLength = cloneDeep(LSUReferralRecordFixture);
  almostEligibleSupervisionLength.ineligibleCriteria.onSupervisionAtLeastOneYear =
    {
      eligibleDate: new Date(2023, 1, 30),
    };

  delete almostEligibleSupervisionLength.eligibleCriteria
    .onSupervisionAtLeastOneYear;
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);
    tk.freeze(new Date(2023, 1, 23));

    referralSub = opp.referralSubscription;
    referralSub.hydrationState = { status: "hydrated" };
    referralSub.data = almostEligibleSupervisionLength;

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("requirements almost met", () => {
    expect(opp.almostEligible).toBeTrue();
    expect(opp.requirementsAlmostMet).toEqual([
      {
        text: "Needs 7 more days on supervision",
        tooltip:
          "Policy requirement: Has been on supervision for at least 1 year",
      },
    ]);
  });

  test("almostEligibleStatusMessage", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Needs 7 more days on supervision",
    );
  });
});
