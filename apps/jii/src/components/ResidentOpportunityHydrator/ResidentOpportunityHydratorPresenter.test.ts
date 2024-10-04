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

import { configure, flowResult } from "mobx";

import { outputFixture, usMeResidents } from "~datatypes";

import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { UsMeSCCPEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { ResidentOpportunityHydratorPresenter } from "./ResidentOpportunityHydratorPresenter";

let presenter: ResidentOpportunityHydratorPresenter;
let store: ResidentsStore;

const testResident = outputFixture(usMeResidents[0]);

beforeEach(async () => {
  configure({ safeDescriptors: false });

  const rootStore = new RootStore();
  await flowResult(rootStore.populateResidentsStore());
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  store = rootStore.residentsStore!;
  vi.spyOn(store.userStore.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "US_ME",
    externalId: testResident.personExternalId,
    pseudonymizedId: testResident.pseudonymizedId,
    intercomUserHash: "intercom-abc123",
  });

  presenter = new ResidentOpportunityHydratorPresenter(
    "sccp",
    store,
    testResident,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("before hydration", () => {
  test("report property throws", () => {
    expect(
      () => presenter.eligibilityReport,
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Failed to populate usMeSCCP eligibility report for RES001]`,
    );
  });

  test("properties hydrated upstream do not throw", () => {
    expect(() => [
      presenter.opportunityConfig,
      presenter.opportunityId,
    ]).not.toThrow();
  });
});

describe("after hydration", () => {
  beforeEach(async () => {
    await presenter.hydrate();
  });

  test("eligibility report", () => {
    expect(presenter.eligibilityReport).toBeInstanceOf(
      UsMeSCCPEligibilityReport,
    );
  });
});
