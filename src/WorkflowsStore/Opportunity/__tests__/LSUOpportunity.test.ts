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

import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { DocumentSubscription } from "../../subscriptions";
import {
  LSUEligibleClientRecord,
  LSUReferralRecordFixture,
} from "../__fixtures__";
import { LSUOpportunity } from "../LSUOpportunity";
import { LSUDraftData, LSUReferralRecord } from "../LSUReferralRecord";

jest.mock("../../subscriptions");

let opp: LSUOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(clientRecord: typeof LSUEligibleClientRecord) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["LSU"]);
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.opportunities.LSU;

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
  jest.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = LSUReferralRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
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

      const { [property]: actual } = opp.prefilledData;
      expect(actual).toEqual(expected);

      opp.record.formInformation = originalFormInformation;
    }
  );
});

describe("no UA required", () => {
  beforeEach(() => {
    createTestUnit(LSUEligibleClientRecord);

    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    const record = LSUReferralRecordFixture;
    record.criteria.negativeUaWithin90Days = {
      latestUaDates: [],
      latestUaResults: [],
    };
    referralSub.data = record;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});
