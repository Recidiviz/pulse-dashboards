// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import {
  InsightsConfigFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorOutcomesPresenter } from "../SupervisionSupervisorOutcomesPresenter";
import * as utils from "../utils";

const testSupervisor = supervisionOfficerSupervisorsFixture[0];

let store: InsightsSupervisionStore;
let presenter: SupervisionSupervisorOutcomesPresenter;
let jiiStore: JusticeInvolvedPersonsStore;
let oppConfigStore: OpportunityConfigurationStore;
let rootStore: RootStore;

beforeEach(async () => {
  configure({ safeDescriptors: false });

  // USER STORE =========================================================
  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => testSupervisor.pseudonymizedId,
  );

  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );

  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_ID",
  );

  // SUPERVISION STORE =================================================
  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  rootStore = store.insightsStore.rootStore;

  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();

  // JII STORE =========================================================
  rootStore.workflowsRootStore.populateJusticeInvolvedPersonsStore();
  const { justiceInvolvedPersonsStore, opportunityConfigurationStore } =
    rootStore.workflowsRootStore;

  oppConfigStore = opportunityConfigurationStore;
  if (justiceInvolvedPersonsStore) {
    jiiStore = justiceInvolvedPersonsStore;

    presenter = new SupervisionSupervisorOutcomesPresenter(
      store,
      testSupervisor.pseudonymizedId,
      jiiStore,
      oppConfigStore,
    );
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("outcomesDataForOutlierOfficers", async () => {
  await presenter.hydrate();

  const { outcomesDataForOutlierOfficers } = presenter;
  expect(outcomesDataForOutlierOfficers).toMatchSnapshot();
});

test("outlierOfficersByMetricAndCaseloadCategory", async () => {
  await presenter.hydrate();

  const { outlierOfficersByMetricAndCaseloadCategory } = presenter;
  expect(outlierOfficersByMetricAndCaseloadCategory).toMatchSnapshot();
});

test("hydration error in dependency", async () => {
  const err = new Error("fake error");
  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "populateMetricConfigs",
  ).mockImplementation(() => {
    throw err;
  });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
});

test("supervisor has no officer outcomes", async () => {
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "outcomesForSupervisor",
  ).mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "status": "hydrated",
    }
  `);
});

test("error assembling metrics data", async () => {
  vi.spyOn(utils, "getOfficerOutcomesData").mockImplementation(() => {
    throw new Error("oops");
  });

  await presenter.hydrate();

  expect(presenter.outcomesDataForOutlierOfficers).toBeUndefined();

  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);

  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: oops],
    ]
  `);
});
