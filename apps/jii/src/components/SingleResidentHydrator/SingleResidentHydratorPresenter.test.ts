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

import {
  outputFixture,
  usMeResidents,
  usMeSccpFixtures,
  usMeWorkReleaseFixtures,
} from "~datatypes";
import { hydrationFailure } from "~hydration-utils";

import { usMeEligibilityConfig } from "../../configs/US_ME/eligibility/config";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { UsMeSCCPEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { UsMeWorkReleaseEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeWorkReleaseEligibilityReport";
import { SingleResidentHydratorPresenter } from "./SingleResidentHydratorPresenter";

let presenter: SingleResidentHydratorPresenter;
let store: ResidentsStore;

const testResident = usMeResidents[0];

// too big for a snapshot but we want to verify that it gets assembled correctly
const expectedData = {
  resident: testResident,
  opportunities: [
    {
      opportunityId: "usMeWorkRelease",
      opportunityConfig:
        usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease,
      eligibilityReport: new UsMeWorkReleaseEligibilityReport(
        testResident,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
        usMeWorkReleaseFixtures.RES001Eligible,
      ),
    },
    {
      opportunityId: "usMeSCCP",
      opportunityConfig:
        usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP,
      eligibilityReport: new UsMeSCCPEligibilityReport(
        testResident,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
        outputFixture(usMeSccpFixtures.RES001almostEligibleMonthsRemaining),
      ),
    },
  ],
};

beforeEach(() => {
  configure({ safeDescriptors: false });
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("with resident ID from URL", () => {
  beforeEach(async () => {
    const rootStore = new RootStore();
    await flowResult(rootStore.populateResidentsStore("US_ME"));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    store = rootStore.residentsStore!;
    vi.spyOn(
      rootStore.userStore.authManager,
      "authState",
      "get",
    ).mockReturnValue({
      status: "authorized",
      userProfile: {
        stateCode: "US_ME",
      },
    });

    presenter = new SingleResidentHydratorPresenter(
      store,
      testResident.pseudonymizedId,
    );
  });

  describe("before hydration", () => {
    test("data property throws", () => {
      expect(() => presenter.residentData).toThrowErrorMatchingInlineSnapshot(
        `[Error: Failed to populate data for resident anonres001]`,
      );
    });
  });

  describe("after hydration", () => {
    beforeEach(async () => {
      await presenter.hydrate();
    });

    test("resident data", () => {
      expect(presenter.residentData).toEqual(expectedData);
    });
  });
});

describe("with resident ID from user data", () => {
  beforeEach(async () => {
    const rootStore = new RootStore();
    await flowResult(rootStore.populateResidentsStore("US_ME"));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    store = rootStore.residentsStore!;
    vi.spyOn(
      rootStore.userStore.authManager,
      "authState",
      "get",
    ).mockReturnValue({
      status: "authorized",
      userProfile: {
        stateCode: "US_ME",
        externalId: testResident.personExternalId,
        pseudonymizedId: testResident.pseudonymizedId,
      },
    });

    presenter = new SingleResidentHydratorPresenter(
      store,
      testResident.pseudonymizedId,
    );
  });

  describe("before hydration", () => {
    test("data property throws", () => {
      expect(() => presenter.residentData).toThrowErrorMatchingInlineSnapshot(
        `[Error: Failed to populate data for resident anonres001]`,
      );
    });
  });

  describe("after hydration", () => {
    beforeEach(async () => {
      await presenter.hydrate();
    });

    test("resident data", () => {
      expect(presenter.residentData).toEqual(expectedData);
    });
  });
});

describe("fetching data for wrong user", () => {
  const wrongTestResident = usMeResidents[1];

  beforeEach(async () => {
    const rootStore = new RootStore();
    await flowResult(rootStore.populateResidentsStore("US_ME"));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    store = rootStore.residentsStore!;
    vi.spyOn(
      rootStore.userStore.authManager,
      "authState",
      "get",
    ).mockReturnValue({
      status: "authorized",
      userProfile: {
        stateCode: "US_ME",
        externalId: testResident.personExternalId,
        pseudonymizedId: testResident.pseudonymizedId,
      },
    });

    presenter = new SingleResidentHydratorPresenter(
      store,
      wrongTestResident.pseudonymizedId,
    );
  });

  test("hydration fails", async () => {
    await presenter.hydrate();
    // if somehow a user is unexpectedly permitted to do this by the backend, hydration should still fail
    expect(hydrationFailure(presenter)).toMatchInlineSnapshot(
      `[Error: User anonres001 cannot access resident anonres002]`,
    );
  });
});
