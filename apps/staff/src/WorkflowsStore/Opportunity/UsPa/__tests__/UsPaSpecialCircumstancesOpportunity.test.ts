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

import { DocumentData } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";

import { usPaSpecialCircumstancesSupervisionFixtures } from "~datatypes";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { usPaAdminSupervisionEligibleClientRecord } from "../__fixtures__";
import { UsPaSpecialCircumstancesSupervisionOpportunity } from "../UsPaSpecialCircumstancesSupervisionOpportunity/UsPaSpecialCircumstancesSupervisionOpportunity";

let opp: UsPaSpecialCircumstancesSupervisionOpportunity;
let client: Client;
let root: RootStore;

vi.mock("../../../subscriptions");

function createTestUnit(
  clientRecord: typeof usPaAdminSupervisionEligibleClientRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "usPaAdminSupervision",
  ]);
  vi.spyOn(root.userStore, "activeFeatureVariants", "get").mockReturnValue({
    usPaUnclearEligibility: {},
  });
  client = new Client(clientRecord, root);

  opp = new UsPaSpecialCircumstancesSupervisionOpportunity(
    client,
    opportunityRecord,
  );
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
});

afterEach(() => {
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(
      {
        ...usPaAdminSupervisionEligibleClientRecord,
        allEligibleOpportunities: ["usPaSpecialCircumstancesSupervision"],
      },
      usPaSpecialCircumstancesSupervisionFixtures.fullyEligible.input,
    );
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});

const createUsPaUnclearEligibilityTestUnit = (
  hasUnclearEligibleTabName: boolean,
  hasUnclearEligibilityText = true,
) => {
  const tabName = hasUnclearEligibleTabName
    ? "ELIGIBILITY_UNCLEAR"
    : "ELIGIBLE_NOW";
  const eligibilityUnclearText = hasUnclearEligibilityText
    ? [
        "Client has pending charges that may affect eligibility.",
        "Previously flagged as NAE",
      ]
    : [];
  const unclearEligibilityRecord = {
    ...usPaSpecialCircumstancesSupervisionFixtures.fullyEligible.input,
    metadata: {
      ...usPaSpecialCircumstancesSupervisionFixtures.fullyEligible.input
        .metadata,
      tabName,
      eligibilityUnclearText: hasUnclearEligibleTabName
        ? eligibilityUnclearText
        : undefined,
    },
  };
  createTestUnit(
    usPaAdminSupervisionEligibleClientRecord,
    unclearEligibilityRecord,
  );
};

describe("when eligibility is unclear", () => {
  it.each([[true], [false]])("almost eligible resolves to %s", (hasTabName) => {
    createUsPaUnclearEligibilityTestUnit(hasTabName);
    expect(opp.almostEligible).toBe(hasTabName);
  });

  it.each([[true], [false]])(
    "eligibility is unclear when it is %s that record has unclear eligibility tab name",
    (hasTabName) => {
      createUsPaUnclearEligibilityTestUnit(hasTabName);
      expect(opp.isEligibilityUnclear).toBe(hasTabName);
    },
  );

  it.each([[true], [false]])(
    "unclear eligibility requirements when ineligibility text is %s",
    (hasUnclearEligibilityText) => {
      createUsPaUnclearEligibilityTestUnit(true, hasUnclearEligibilityText);
      expect(opp.eligibilityUnclearRequirements).toMatchSnapshot();
    },
  );

  it.each([[true], [false]])(
    "unclear eligibility requirements when ineligibility text is %s",
    (hasUnclearEligibilityText) => {
      createUsPaUnclearEligibilityTestUnit(true, hasUnclearEligibilityText);
      expect(opp.eligibilityUnclearRequirements).toMatchSnapshot();
    },
  );
});
