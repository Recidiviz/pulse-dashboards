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
import { shuffle, sum } from "lodash";
import { configure } from "mobx";

import {
  InsightsConfigFixture,
  OpportunityType,
  supervisionOfficerFixture,
  supervisionOfficerSupervisorsFixture,
  SupervisionOfficerWithOpportunityDetails,
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
import { OpportunityConfiguration } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations";
import { OpportunityConfigurationStore } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { opportunityConstructors } from "../../../WorkflowsStore/Opportunity/opportunityConstructors";
import { mockFirestoreStoreClientsForOfficerId } from "../../../WorkflowsStore/subscriptions/__tests__/testUtils";
import { InsightsStore } from "../../InsightsStore";
import { getMockOpportunityConstructor } from "../../mixins/__mocks__/MockOpportunity";
import { CLIENTS_OFFICERS } from "../../models/offlineFixtures/ClientFixture";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorOpportunitiesPresenter } from "../SupervisionSupervisorOpportunitiesPresenter";
import { RawOpportunityInfo } from "../types";

const testSupervisor = supervisionOfficerSupervisorsFixture[0];
const officerWithNoClients = supervisionOfficerFixture[9];
const testOfficers = [...CLIENTS_OFFICERS, officerWithNoClients].map(
  ({ supervisorExternalIds, ...rest }) => ({
    ...rest,
    supervisorExternalIds: supervisorExternalIds.includes(
      testSupervisor.externalId,
    )
      ? supervisorExternalIds
      : supervisorExternalIds.push(testSupervisor.externalId),
  }),
);
const officersExternalIds = testOfficers.map((o) => o.externalId);

let store: InsightsSupervisionStore;
let presenter: SupervisionSupervisorOpportunitiesPresenter;
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

    presenter = new SupervisionSupervisorOpportunitiesPresenter(
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

describe("Opportunity details methods", () => {
  beforeEach(() => {
    rootStore.tenantStore.setCurrentTenantId("US_XX" as TenantId);

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

    it("presenter should be considered hydrated after hydration", () => {
      expect(isHydrated(presenter)).toBeTrue();
    });

    it("opportunitiesDetails should be not defined", () => {
      expect(presenter.opportunitiesDetails).toBeUndefined();
    });
  });

  describe("when isWorkflowsEnabled is True", () => {
    let opportunitiesDetails: SupervisionSupervisorOpportunitiesPresenter["opportunitiesDetails"];
    beforeEach(async () => {
      vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);
      await presenter.hydrate();
      opportunitiesDetails = presenter.opportunitiesDetails;
    });

    describe("Method: opportunityDetails", () => {
      it("opportunityDetails is defined", () => {
        expect(opportunitiesDetails).toBeDefined();
        expect(opportunitiesDetails).toMatchSnapshot();
      });

      it("opportunityDetails is defined with no officers supervised", async () => {
        presenter = new SupervisionSupervisorOpportunitiesPresenter(
          store,
          officerWithNoClients.pseudonymizedId,
          jiiStore,
          oppConfigStore,
        );
        vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);

        await presenter.hydrate();
        opportunitiesDetails = presenter.opportunitiesDetails;

        expect(presenter.allOfficers).toBeArrayOfSize(0);
        expect(opportunitiesDetails).toBeArrayOfSize(0);
      });

      it("opportunityDetails is defined with no officers clients", async () => {
        presenter = new SupervisionSupervisorOpportunitiesPresenter(
          store,
          officerWithNoClients.pseudonymizedId,
          jiiStore,
          oppConfigStore,
        );
        vi.spyOn(presenter, "isWorkflowsEnabled", "get").mockReturnValue(true);

        await presenter.hydrate();
        opportunitiesDetails = presenter.opportunitiesDetails;

        expect(opportunitiesDetails).toBeDefined();
        expect(opportunitiesDetails).toBeArrayOfSize(0);
      });

      it("opportunityDetails is defined with clients supervised", async () => {
        expect(opportunitiesDetails).toBeDefined();
        expect(opportunitiesDetails).toBeArrayOfSize(2);
      });

      const OPP_TYPE_1_LABEL = MOCK_OPPORTUNITY_CONFIGS[OPP_TYPE_1].label;
      const OPP_TYPE_2_LABEL = MOCK_OPPORTUNITY_CONFIGS[OPP_TYPE_2].label;

      const CLIENT_COUNT_PER_OFFICER_MOCKOPP1 = [
        [officersExternalIds[0], 6],
        [officersExternalIds[1], 5],
        [officersExternalIds[2], 4],
        [officersExternalIds[3], 5],
      ] as const;

      it.each(CLIENT_COUNT_PER_OFFICER_MOCKOPP1)(
        `has correct count of eligible ${OPP_TYPE_1} clients supervised by officer %s`,
        (externalId, count) => {
          const officerCount = opportunitiesDetails
            ?.find((oppDetail) => oppDetail.label === OPP_TYPE_1_LABEL)
            ?.officersWithEligibleClients?.find(
              (o) => o.externalId === externalId,
            )?.clientsEligibleCount;
          expect(officerCount).toBe(count);
        },
      );

      const CLIENT_COUNT_PER_OFFICER_MOCKOPP2 = [
        [officersExternalIds[0], 5],
        [officersExternalIds[1], 5],
        [officersExternalIds[2], 5],
        [officersExternalIds[3], 4],
      ] as const;

      it.each(CLIENT_COUNT_PER_OFFICER_MOCKOPP2)(
        `has correct count of eligible ${OPP_TYPE_2} clients supervised by officer %s`,
        (externalId, count) => {
          const officerCount = opportunitiesDetails
            ?.find((oppDetail) => oppDetail.label === OPP_TYPE_2_LABEL)
            ?.officersWithEligibleClients?.find(
              (o) => o.externalId === externalId,
            )?.clientsEligibleCount;
          expect(officerCount).toBe(count);
        },
      );

      const TOTAL_OPPORTUNITY_DETAIL_COUNT_CASES = [
        [
          OPP_TYPE_1_LABEL,
          sum(CLIENT_COUNT_PER_OFFICER_MOCKOPP1.map((x) => x[1])),
        ],
        [
          OPP_TYPE_2_LABEL,
          sum(CLIENT_COUNT_PER_OFFICER_MOCKOPP2.map((x) => x[1])),
        ],
      ] as const;

      it.each(TOTAL_OPPORTUNITY_DETAIL_COUNT_CASES)(
        "Proper count of opportunityType at test case %#",
        (opportunityLabel, count) => {
          const opportunityDetailCount = opportunitiesDetails?.find(
            (oppDetail) => oppDetail.label === opportunityLabel,
          )?.clientsEligibleCount;
          expect(opportunityDetailCount).toBe(count);
        },
      );
    });

    describe("Method: sortOpportunitiesDetails", () => {
      it("should correctly sort RawOpportunityInfo objects", () => {
        // TODO: Convert this into actual fixtures.
        const expectedArray = [
          {
            priority: "HIGH",
            homepagePosition: 1,
            clientsEligibleCount: 10,
            label: "Opportunity A",
          },
          {
            priority: "HIGH",
            homepagePosition: 3,
            clientsEligibleCount: 15,
            label: "Opportunity C",
          },
          {
            priority: "NORMAL",
            homepagePosition: 1,
            clientsEligibleCount: 20,
            label: "Opportunity D",
          },
          {
            priority: "NORMAL",
            homepagePosition: 2,
            clientsEligibleCount: 10,
            label: "Opportunity E",
          },
          {
            priority: "NORMAL",
            homepagePosition: 2,
            clientsEligibleCount: 5,
            label: "Opportunity B",
          },
        ] as unknown as RawOpportunityInfo[];

        const shuffledAndSortedArray = shuffle(expectedArray).sort(
          SupervisionSupervisorOpportunitiesPresenter.sortOpportunitiesDetails,
        );

        expect(shuffledAndSortedArray).toEqual(expectedArray);
      });

      it("opportunityDetails object should be given sorted", () => {
        // Put the homepagePosition back on to the object.
        const rawOpportunitiesDetails: RawOpportunityInfo[] | undefined =
          opportunitiesDetails?.map((oppDetail) => ({
            ...oppDetail,
            homepagePosition: Object.values(MOCK_OPPORTUNITY_CONFIGS).find(
              (o) => o.label === oppDetail.label,
            )?.homepagePosition as OpportunityConfiguration["homepagePosition"],
          }));

        // Sort and then remove the homepagePosition
        const newlySortedOpportunitiesDetails = rawOpportunitiesDetails
          ?.toSorted(
            SupervisionSupervisorOpportunitiesPresenter.sortOpportunitiesDetails,
          )
          .map(({ homepagePosition, ...oppDetail }) => oppDetail);
        // The order should be no different from the original object.
        expect(opportunitiesDetails).toStrictEqual(
          newlySortedOpportunitiesDetails,
        );
      });
    });

    describe("Method: sortSupervisionOfficerWithOpportunityDetails", () => {
      it("should correctly sort SupervisionOfficerWithOpportunityDetails objects", () => {
        // TODO: Convert this into actual fixtures.
        const expectedArray = [
          {
            displayName: "Officer B",
            clientsEligibleCount: 20,
          },
          {
            displayName: "Officer E",
            clientsEligibleCount: 20,
          },
          {
            displayName: "Officer A",
            clientsEligibleCount: 15,
          },
          {
            displayName: "Officer C",
            clientsEligibleCount: 15,
          },
          {
            displayName: "Officer D",
            clientsEligibleCount: 10,
          },
        ] as SupervisionOfficerWithOpportunityDetails[];

        const shuffledAndSortedArray = shuffle(expectedArray).toSorted(
          SupervisionSupervisorOpportunitiesPresenter.sortSupervisionOfficerWithOpportunityDetails,
        );

        expect(shuffledAndSortedArray).toStrictEqual(expectedArray);
      });

      it("should have officersWithEligibleClients correctly sorted in the opportunityDetails object", () => {
        expect(opportunitiesDetails).not.toBeFalsy();
        for (const opportunityDetail of opportunitiesDetails || []) {
          const { officersWithEligibleClients } = opportunityDetail;
          expect(
            officersWithEligibleClients.toSorted(
              SupervisionSupervisorOpportunitiesPresenter.sortSupervisionOfficerWithOpportunityDetails,
            ),
          ).toStrictEqual(officersWithEligibleClients);
        }
      });
    });
  });
});
