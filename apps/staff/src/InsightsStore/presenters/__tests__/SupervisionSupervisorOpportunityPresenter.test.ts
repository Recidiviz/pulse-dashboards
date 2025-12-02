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

import { DocumentData } from "firebase/firestore";
import { configure } from "mobx";

import {
  InsightsConfigFixture,
  OpportunityType,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { isHydrated } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import { TenantId } from "../../../RootStore/types";
import UserStore from "../../../RootStore/UserStore";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import {
  MOCK_OPPORTUNITY_CONFIGS,
  mockUsXxOpp,
  mockUsXxOpp as OPP_TYPE_1,
  mockUsXxTwoOpp,
  mockUsXxTwoOpp as OPP_TYPE_2,
} from "../../../WorkflowsStore/Opportunity/__fixtures__";
import { OpportunityConfigurationStore } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { opportunityConstructors } from "../../../WorkflowsStore/Opportunity/opportunityConstructors";
import { mockFirestoreStoreClientsForOfficerId } from "../../../WorkflowsStore/subscriptions/__tests__/testUtils";
import { InsightsStore } from "../../InsightsStore";
import { getMockOpportunityConstructor } from "../../mixins/__mocks__/MockOpportunity";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorOpportunityPresenter } from "../SupervisionSupervisorOpportunityPresenter";

const testSupervisor = supervisionOfficerSupervisorsFixture[0];

let store: InsightsSupervisionStore;
let presenter: SupervisionSupervisorOpportunityPresenter;
let jiiStore: JusticeInvolvedPersonsStore;
let oppConfigStore: OpportunityConfigurationStore;
let rootStore: RootStore;

beforeEach(async () => {
  configure({ safeDescriptors: false });
  vi.useFakeTimers();
  vi.runAllTimersAsync();

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

  function setTestEnabledOppTypes(oppTypes: OpportunityType[]) {
    vi.spyOn(
      OpportunityConfigurationStore.prototype,
      "enabledOpportunityTypes",
      "get",
    ).mockReturnValue(oppTypes);
  }

  mockFirestoreStoreClientsForOfficerId(rootStore.firestoreStore);

  setTestEnabledOppTypes([mockUsXxOpp, mockUsXxTwoOpp]);
  vi.spyOn(
    rootStore.firestoreStore,
    "getOpportunitiesForJIIAndOpportunityType",
  ).mockImplementation(
    async (
      personExternalId: string,
      opportunityTypeCollection: string,
      stateCode: string,
    ): Promise<DocumentData[]> => {
      return [{}];
    },
  );

  rootStore.workflowsRootStore.populateJusticeInvolvedPersonsStore();
  const { justiceInvolvedPersonsStore, opportunityConfigurationStore } =
    rootStore.workflowsRootStore;

  oppConfigStore = opportunityConfigurationStore;
  if (justiceInvolvedPersonsStore) {
    jiiStore = justiceInvolvedPersonsStore;

    presenter = new SupervisionSupervisorOpportunityPresenter(
      store,
      jiiStore,
      oppConfigStore,
      testSupervisor.pseudonymizedId,
      "mockUsXxOpp" as OpportunityType,
    );
  }
});

afterEach(() => {
  configure({ safeDescriptors: true });
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Presenter hydration", () => {
  beforeEach(async () => {
    await presenter.hydrate();
  });
  test("Presenter is hydrated after calling hydrate()", () => {
    expect(isHydrated(presenter)).toBeTrue();
  });
  test("supervisor info is populated", () => {
    expect(presenter.supervisorInfo).toBeDefined();
  });
});

describe("Opportunity methods", () => {
  beforeEach(() => {
    rootStore.tenantStore.setCurrentTenantId("US_XX" as TenantId);
    vi.useFakeTimers();
    vi.runAllTimersAsync();

    // OPPORTUNITIES ========================================================
    oppConfigStore.mockHydrated(MOCK_OPPORTUNITY_CONFIGS);
    // @ts-ignore
    opportunityConstructors[OPP_TYPE_1] =
      getMockOpportunityConstructor(OPP_TYPE_1);
    // @ts-ignore
    opportunityConstructors[OPP_TYPE_2] =
      getMockOpportunityConstructor(OPP_TYPE_2);
  });

  describe("when isWorkflowsEnabled is False", () => {
    beforeEach(async () => {
      vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(false);
      await presenter.hydrate();
    });

    it("opportunities should be not defined", () => {
      expect(presenter.opportunities).toBeUndefined();
    });

    it("opportunitiesByType is empty", () => {
      expect(presenter.opportunitiesByType).toBeEmpty();
    });
    it("clients is empty", () => {
      expect(presenter.clients).toBeEmpty();
    });
  });

  describe("when isWorkflowsEnabled is True", () => {
    beforeEach(async () => {
      vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
      await presenter.hydrate();
    });

    it("opportunitiesByType contains relevant opp mappings", () => {
      expect(presenter.opportunitiesByType).toContainAllKeys([
        "mockUsXxOpp",
        "mockUsXxTwoOpp",
      ]);
    });

    it("opportunities is defined and matches oppsByType", () => {
      expect(presenter.opportunities).toEqual(
        presenter.opportunitiesByType["mockUsXxOpp" as OpportunityType],
      );
    });

    it("clients array is defined", () => {
      expect(presenter.clients).not.toBeEmpty();
      presenter.clients.forEach((client) =>
        expect(client.opportunities).toBeDefined(),
      );
    });
  });
});
