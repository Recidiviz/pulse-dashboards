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

import { shuffle, sum } from "lodash";
import { configure } from "mobx";

import { InsightsConfigFixture } from "~datatypes";
import { isHydrated, unpackAggregatedErrors } from "~hydration-utils";

import { ClientRecord } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { TenantId } from "../../../RootStore/types";
import UserStore from "../../../RootStore/UserStore";
import {
  OpportunityType,
  supervisionOpportunityConstructors,
  SupervisionOpportunityType,
} from "../../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import {
  MOCK_OPPORTUNITY_CONFIGS,
  mockUsXxOpp as OPP_TYPE_1,
  mockUsXxTwoOpp as OPP_TYPE_2,
} from "../../../WorkflowsStore/Opportunity/__fixtures__";
import { OpportunityConfiguration } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations";
import { OpportunityConfigurationStore } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { InsightsOfflineAPIClient } from "../../api/InsightsOfflineAPIClient";
import { InsightsStore } from "../../InsightsStore";
import { getMockOpportunityConstructor } from "../../mixins/__mocks__/MockOpportunity";
import {
  clientFixture,
  CLIENTS_OFFICERS,
} from "../../models/offlineFixtures/ClientFixture";
import { excludedSupervisionOfficerFixture } from "../../models/offlineFixtures/ExcludedSupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "../../models/offlineFixtures/SupervisionOfficerSupervisor";
import { SupervisionOfficerWithOpportunityDetails } from "../../models/SupervisionOfficerWithOpportunityDetails";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorPresenter } from "../SupervisionSupervisorPresenter";
import { RawOpportunityInfo } from "../types";
import * as utils from "../utils";

const testSupervisor = supervisionOfficerSupervisorsFixture[0];
const officerWithNoClients = excludedSupervisionOfficerFixture[1];
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
let presenter: SupervisionSupervisorPresenter;
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

  // SUPERVISION STORE =================================================
  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanAccessAllSupervisors", "get").mockReturnValue(true);
  rootStore = store.insightsStore.rootStore;

  // JII STORE =========================================================
  rootStore.workflowsRootStore.populateJusticeInvolvedPersonsStore();
  const { justiceInvolvedPersonsStore, opportunityConfigurationStore } =
    rootStore.workflowsRootStore;

  oppConfigStore = opportunityConfigurationStore;
  if (justiceInvolvedPersonsStore) {
    jiiStore = justiceInvolvedPersonsStore;

    presenter = new SupervisionSupervisorPresenter(
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

test("outlierOfficersData", async () => {
  await presenter.hydrate();

  const { outlierOfficersData } = presenter;
  expect(outlierOfficersData).toMatchSnapshot();
});

test("supervisorInfo", async () => {
  await presenter.hydrate();

  const { supervisorInfo } = presenter;
  expect(supervisorInfo).toMatchSnapshot();
});

test("timePeriod", async () => {
  await presenter.hydrate();

  const { timePeriod } = presenter;

  expect(timePeriod).toBeDefined();
  expect(timePeriod).toMatch("9/1/22 - 9/1/23");
});

test("outlierOfficersByMetricAndCaseloadType", async () => {
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

test("supervisorId not found in supervisionOfficerSupervisors", async () => {
  presenter = new SupervisionSupervisorPresenter(
    store,
    "nonExistentId",
    jiiStore,
    oppConfigStore,
  );
  await presenter.hydrate();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);
  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: failed to populate officers with outliers],
      [Error: failed to populate supervisor],
      [Error: Missing expected data for supervised officers],
    ]
  `);
});

test("supervisorId not found in officersBySupervisor", async () => {
  vi.spyOn(
    InsightsOfflineAPIClient.prototype,
    "officersForSupervisor",
  ).mockResolvedValue([]);

  await presenter.hydrate();

  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);

  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: failed to populate officers with outliers],
      [Error: Missing expected data for supervised officers],
    ]
  `);
});

test("error assembling metrics data", async () => {
  vi.spyOn(utils, "getOutlierOfficerData").mockImplementation(() => {
    throw new Error("oops");
  });

  await presenter.hydrate();

  expect(presenter.outlierOfficersData).toBeUndefined();

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

describe("Opportunity details methods", () => {
  beforeEach(() => {
    rootStore.tenantStore.setCurrentTenantId("US_XX" as TenantId);

    // FIRESTORE ========================================================
    vi.spyOn(
      rootStore.firestoreStore,
      "getClientsForOfficerId",
    ).mockImplementation(
      async (stateCode: string, officerExternalId: string) => {
        const clientData = Object.values<ClientRecord>(clientFixture).filter(
          (fixture) => fixture.officerId === officerExternalId,
        );
        return clientData;
      },
    );

    // OPPORTUNITIES ========================================================
    const { opportunities } = oppConfigStore;
    const newConfig = {
      ...opportunities,
      ...MOCK_OPPORTUNITY_CONFIGS,
    };
    supervisionOpportunityConstructors[
      OPP_TYPE_1 as SupervisionOpportunityType
    ] = getMockOpportunityConstructor(OPP_TYPE_1) as any;
    supervisionOpportunityConstructors[
      OPP_TYPE_2 as SupervisionOpportunityType
    ] = getMockOpportunityConstructor(OPP_TYPE_2) as any;
    vi.spyOn(oppConfigStore, "opportunities", "get").mockReturnValue(
      newConfig as unknown as OpportunityConfigurationStore["opportunities"],
    );
    vi.spyOn(oppConfigStore, "enabledOpportunityTypes", "get").mockReturnValue(
      Object.keys(newConfig) as OpportunityType[],
    );
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
    let opportunitiesDetails: SupervisionSupervisorPresenter["opportunitiesDetails"];
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
        presenter = new SupervisionSupervisorPresenter(
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
        presenter = new SupervisionSupervisorPresenter(
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
          SupervisionSupervisorPresenter.sortOpportunitiesDetails,
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
          ?.toSorted(SupervisionSupervisorPresenter.sortOpportunitiesDetails)
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
          SupervisionSupervisorPresenter.sortSupervisionOfficerWithOpportunityDetails,
        );

        expect(shuffledAndSortedArray).toStrictEqual(expectedArray);
      });

      it("should have officersWithEligibleClients correctly sorted in the opportunityDetails object", () => {
        expect(opportunitiesDetails).not.toBeFalsy();
        for (const opportunityDetail of opportunitiesDetails || []) {
          const { officersWithEligibleClients } = opportunityDetail;
          expect(
            officersWithEligibleClients.toSorted(
              SupervisionSupervisorPresenter.sortSupervisionOfficerWithOpportunityDetails,
            ),
          ).toStrictEqual(officersWithEligibleClients);
        }
      });
    });
  });
});
