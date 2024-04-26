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
import { waitFor } from "@testing-library/react";
import { set } from "mobx";

import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { IncarcerationOpportunityId } from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";

let residentsStore: ResidentsStore;
let presenter: OpportunityEligibilityPresenter;
const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const resident = outputFixture(usMeResidents[0]);
const stateConfig = residentsConfigByState.US_ME;
const oppConfig = stateConfig.incarcerationOpportunities[opportunityId];

beforeEach(() => {
  residentsStore = new ResidentsStore(new RootStore(), stateConfig);
  presenter = new OpportunityEligibilityPresenter(
    residentsStore,
    resident.personExternalId,
    opportunityId,
    oppConfig,
  );
});

describe("hydration", () => {
  test("needs hydration", () => {
    expect(presenter.hydrationState.status).toBe("needs hydration");
  });

  test("already hydrated", () => {
    set(
      residentsStore.residentsByExternalId,
      resident.personExternalId,
      resident,
    );
    set(
      residentsStore.residentEligibilityRecordsByExternalId,
      resident.personExternalId,
      { [opportunityId]: usMeSccpFixtures.fullyEligibleHalfPortion },
    );

    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("hydrate", async () => {
    expect(presenter.hydrationState.status).toBe("needs hydration");

    presenter.hydrate();

    expect(presenter.hydrationState.status).toBe("loading");

    await waitFor(() =>
      expect(presenter.hydrationState.status).toBe("hydrated"),
    );
  });
});

test("about content", () => {
  expect(presenter.aboutContent).toMatchSnapshot();
});

test("next steps content", () => {
  expect(presenter.nextStepsContent).toMatchSnapshot();
});
