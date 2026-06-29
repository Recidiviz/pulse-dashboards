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

import tk from "timekeeper";

import { OpportunityType } from "~datatypes";

import { mockOpportunity } from "../../../core/__tests__/testUtils";
import OpportunitiesFilterStore from "../../../FilterStore/OpportunitiesFilterStore";
import FirestoreStore from "../../../FirestoreStore";
import { SupervisionOpportunityPresenter } from "../../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import { SupervisionSupervisorOpportunityPresenter } from "../../../InsightsStore/presenters/SupervisionSupervisorOpportunityPresenter";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import TenantStore from "../../../RootStore/TenantStore";
import { FeatureVariantRecord } from "../../../RootStore/types";
import { OpportunityConfiguration } from "../../Opportunity/OpportunityConfigurations";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroups,
} from "../../Opportunity/types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { OpportunityPersonListPresenter } from "../OpportunityPersonListPresenter";

let presenter: OpportunityPersonListPresenter;

const analyticsStore = {
  trackOpportunityTabClicked: vi.fn(),
} as any as AnalyticsStore;

const mockUpdateCustomTabOrderings = vi.fn();
const firestoreStore = {
  updateCustomTabOrderings: mockUpdateCustomTabOrderings,
} as any as FirestoreStore;

const tenantStore = {} as any as TenantStore;
const mockFilterStore = {
  orderedOpportunitiesForCategory: () => [],
} as any as OpportunitiesFilterStore;

const mockOpportunities = {
  [mockOpportunity.type]: [
    {
      ...mockOpportunity,
      tabTitle: (tabGroup) =>
        tabGroup === "ELIGIBILITY STATUS" ? "Eligible Now" : "Other",
    },
    {
      ...mockOpportunity,
      tabTitle: (_) => "Marked Ineligible",
    },
    {
      ...mockOpportunity,
      tabTitle: (_) => "Marked Ineligible",
      isIndefinitelySnoozed: true,
    },
  ] as Opportunity[],
};
const mockWorkflowsStore = {
  allOpportunitiesByType: mockOpportunities,
} as any as WorkflowsStore;

const FEATURE_VARIANTS: FeatureVariantRecord = {};

const ORDERED_TABS = ["Eligible Now", "Almost Eligible", "Marked Ineligible"];
const UNORDERED_TABS = ["Other"];

function getPresenter({
  config = mockOpportunity.config,
  supervisionPresenter = undefined,
  workflowsStore = mockWorkflowsStore,
  tenantStore: customTenantStore = tenantStore,
  opportunityType = mockOpportunity.type,
  opportunitiesFilterStore = mockFilterStore,
  initialTab,
}: {
  config?: OpportunityConfiguration;
  supervisionPresenter?:
    | SupervisionOpportunityPresenter
    | SupervisionSupervisorOpportunityPresenter;
  workflowsStore?: WorkflowsStore;
  tenantStore?: TenantStore;
  opportunityType?: typeof mockOpportunity.type;
  opportunitiesFilterStore?: OpportunitiesFilterStore;
  initialTab?: string;
}): OpportunityPersonListPresenter {
  return new OpportunityPersonListPresenter(
    analyticsStore,
    firestoreStore,
    customTenantStore,
    opportunitiesFilterStore,
    workflowsStore,
    config,
    FEATURE_VARIANTS,
    opportunityType,
    supervisionPresenter,
    { initialTab },
  );
}

describe("one tab group, no supervision presenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");

    presenter = getPresenter({});
  });

  test("reordering tabs updates firestore", () => {
    mockUpdateCustomTabOrderings.mockResolvedValue(undefined);

    expect(presenter.displayTabs).toEqual([
      "Eligible Now",
      "Submitted",
      "Marked Ineligible",
    ]);
    // Moves the "Marked Ineligible" tab to the previous spot of "Eligible Now"
    presenter.swapTabs("Marked Ineligible", "Eligible Now");

    expect(mockUpdateCustomTabOrderings).toHaveBeenCalledOnce();
    expect(presenter.displayTabs).toEqual([
      "Marked Ineligible",
      "Eligible Now",
      "Submitted",
    ]);
  });

  test("clicking a tab emits a tracking event and updates the active tab", () => {
    expect(presenter.activeTab).toEqual("Eligible Now");

    presenter.handleTabClick("Marked Ineligible");

    expect(analyticsStore.trackOpportunityTabClicked).toHaveBeenCalledOnce();
    expect(presenter.activeTab).toEqual("Marked Ineligible");
  });

  test("gets tab order preference from firestore", () => {
    const preferredTabs = [
      "Marked Ineligible",
      "Almost Eligible",
      "Eligible Now",
    ];

    // @ts-expect-error private property
    presenter.updatesSubscription = {
      hydrationState: "hydrated",
      data: {
        customTabOrderings: {
          [mockOpportunity.type]: {
            "ELIGIBILITY STATUS": preferredTabs,
          },
        },
      },
    };

    // Mock config doesn't support Almost Eligible, so that one gets dropped
    // Config also specifies Submitted, so that one should be included
    expect(presenter.displayTabs).toEqual([
      "Marked Ineligible",
      "Eligible Now",
      "Submitted",
    ]);
  });

  test("returns sane defaults when no linked overdue opportunity", () => {
    expect(presenter.overdueOpportunityCount).toEqual(0);
    expect(presenter.overdueOpportunityUrl).toBeUndefined();
  });

  test("oppsFromOpportunitiesByTab filters out indefinite snoozes", () => {
    expect(
      presenter.oppsFromOpportunitiesByTab?.["Marked Ineligible"],
    ).toHaveLength(1);
  });

  test("oppsFromOpportunitiesByTab doesn't filter out indefinite snoozes when config is overridden", () => {
    presenter = getPresenter({
      config: {
        ...mockOpportunity.config,
        excludeIndefiniteSnoozesFromTableView: false,
      },
    });

    expect(
      presenter.oppsFromOpportunitiesByTab?.["Marked Ineligible"],
    ).toHaveLength(2);
  });

  test("seeds activeTab from initialTab when it matches a display tab", () => {
    presenter = getPresenter({ initialTab: "Submitted" });
    expect(presenter.activeTab).toEqual("Submitted");
  });

  test("falls back to defaultTab when initialTab is not a display tab", () => {
    presenter = getPresenter({ initialTab: "definitely-not-a-tab" });
    expect(presenter.activeTab).toEqual("Eligible Now");
  });

  test("falls back to defaultTab when initialTab is undefined", () => {
    presenter = getPresenter({});
    expect(presenter.activeTab).toEqual("Eligible Now");
  });
});

describe("multiple tab groups, no supervision presenter", () => {
  beforeEach(() => {
    const multiTabGroupConfig: OpportunityConfiguration = {
      ...mockOpportunity.config,
      tabGroups: {
        "ELIGIBILITY STATUS": ORDERED_TABS,
        GENDER: UNORDERED_TABS,
      } as Partial<OpportunityTabGroups>,
    };

    // separate group because the possible tab groups are set in the constructor
    presenter = getPresenter({ config: multiTabGroupConfig });
  });

  test("changing tab group changes displayed tabs and selected tab", () => {
    expect(presenter.activeTabGroup).toEqual("ELIGIBILITY STATUS");
    expect(presenter.displayTabs).toEqual(ORDERED_TABS);

    presenter.activeTabGroup = "GENDER";

    expect(presenter.activeTabGroup).toEqual("GENDER");
    expect(presenter.displayTabs).toEqual(UNORDERED_TABS);
    expect(presenter.activeTab).toEqual(UNORDERED_TABS[0]);
  });

  test("changing tab group changes tab badges", () => {
    expect(presenter.tabBadges).toEqual({
      "Almost Eligible": 0,
      "Eligible Now": 1,
      "Marked Ineligible": 1,
    });

    presenter.activeTabGroup = "GENDER";

    expect(presenter.tabBadges).toEqual({
      Other: 1,
    });
  });

  test("empty tab text distinguishes between empty current tab & empty tab group", () => {
    presenter.activeTab = "Marked Ineligible";

    expect(presenter.emptyTabText).toMatch(
      /Please navigate to one of the other tabs\./,
    );

    presenter.activeTabGroup = "GENDER - Transgender Only";

    expect(presenter.emptyTabText).toMatch(
      /Please select a different grouping\./,
    );
  });
});

describe("in insights/with officer opportunity presenter", () => {
  // supervision presenter with two opportunities
  const supervisionOpportunityPresenter = {
    opportunitiesByType: {
      [mockOpportunity.type]: [
        mockOpportunity,
        { ...mockOpportunity, tabTitle: () => "Marked Ineligible" },
      ],
    },
    labels: { supervisionJiiLabel: "test title" },
    opportunityConfigurationStore: {
      apiOpportunityConfigurations: {
        [mockOpportunity.type]: mockOpportunity.config,
      },
    },
    officerRecord: { pseudonymizedId: "testofficer1" },
  } as any as SupervisionOpportunityPresenter;

  beforeEach(() => {
    vi.clearAllMocks();
    presenter = getPresenter({
      supervisionPresenter: supervisionOpportunityPresenter,
    });
  });

  test("gets opportunities from supervision presenter", () => {
    const workflowsSpy = vi.spyOn(
      mockWorkflowsStore,
      "allOpportunitiesByType",
      "get",
    );
    expect(presenter.oppsFromOpportunitiesByTab).toContainAllKeys([
      "Eligible Now",
      "Marked Ineligible",
    ]);
    expect(workflowsSpy).not.toHaveBeenCalled();
  });

  test("gets JII title from supervision presenter", () => {
    expect(presenter.justiceInvolvedPersonTitle).toEqual("test title");
  });

  test("gets current opportunity type from supervision presenter", () => {
    expect(presenter.opportunityType).toEqual(mockOpportunity.type);
  });

  test("gets opportunity configurations from supervision presenter", () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Object.keys(presenter.opportunityConfigs!)).toEqual([
      mockOpportunity.type,
    ]);
  });

  test("gets opportunity types from supervision presenter", () => {
    expect(presenter.opportunityTypes).toEqual([mockOpportunity.type]);
  });

  test("gets URL for other opportunity type for insights", () => {
    expect(presenter.urlForOppConfig(mockOpportunity.config)).toEqual(
      `/insights/supervision/staff/testofficer1/opportunity/${mockOpportunity.config.urlSection}`,
    );
  });

  test("doesn't show the officer name column", () => {
    expect(presenter.enabledColumnIds["ASSIGNED_STAFF_NAME"]).toBeFalse();
  });
});

describe("in insights/with supervisor opportunity presenter", () => {
  // supervision presenter with two opportunities
  const supervisionSupervisorOpportunityPresenter = {
    opportunitiesByType: {
      [mockOpportunity.type]: [
        mockOpportunity,
        { ...mockOpportunity, tabTitle: () => "Marked Ineligible" },
      ],
    },
    labels: { supervisionJiiLabel: "test title" },
    opportunityConfigurationStore: {
      apiOpportunityConfigurations: {
        [mockOpportunity.type]: mockOpportunity.config,
      },
    },
    supervisorInfo: { pseudonymizedId: "testsupervisor1" },
  } as any as SupervisionSupervisorOpportunityPresenter;

  beforeEach(() => {
    vi.clearAllMocks();
    presenter = getPresenter({
      supervisionPresenter: supervisionSupervisorOpportunityPresenter,
    });
  });

  test("gets opportunities from supervision presenter", () => {
    const workflowsSpy = vi.spyOn(
      mockWorkflowsStore,
      "allOpportunitiesByType",
      "get",
    );
    expect(presenter.oppsFromOpportunitiesByTab).toContainAllKeys([
      "Eligible Now",
      "Marked Ineligible",
    ]);
    expect(workflowsSpy).not.toHaveBeenCalled();
  });

  test("gets JII title from supervision presenter", () => {
    expect(presenter.justiceInvolvedPersonTitle).toEqual("test title");
  });

  test("gets current opportunity type from supervision presenter", () => {
    expect(presenter.opportunityType).toEqual(mockOpportunity.type);
  });

  test("gets opportunity configurations from supervision presenter", () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Object.keys(presenter.opportunityConfigs!)).toEqual([
      mockOpportunity.type,
    ]);
  });

  test("gets opportunity types from supervision presenter", () => {
    expect(presenter.opportunityTypes).toEqual([mockOpportunity.type]);
  });

  test("gets URL for other opportunity type for insights", () => {
    expect(presenter.urlForOppConfig(mockOpportunity.config)).toEqual(
      `/insights/supervision/supervisor/testsupervisor1/opportunity/${mockOpportunity.config.urlSection}`,
    );
  });

  test("shows the officer name column", () => {
    expect(presenter.enabledColumnIds["ASSIGNED_STAFF_NAME"]).toBeTrue();
  });
});

describe("table view columns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tk.reset();

    presenter = getPresenter({});
  });

  test("show Eligibility Date column when viewing opportunity that became eligible in the past", () => {
    tk.freeze(new Date(2000, 1, 1));
    vi.spyOn(
      mockWorkflowsStore,
      "allOpportunitiesByType",
      "get",
    ).mockReturnValue({
      [mockOpportunity.type]: [
        {
          ...mockOpportunity,
          eligibilityDate: new Date(1999, 1, 1),
        },
      ],
    });
    presenter = getPresenter({ workflowsStore: mockWorkflowsStore });
    expect(presenter.enabledColumnIds["ELIGIBILITY_DATE"]).toBeTrue();
  });

  test("show Eligibility Date column when viewing opportunity that will become eligible in the future", () => {
    tk.freeze(new Date(2000, 1, 1));
    vi.spyOn(
      mockWorkflowsStore,
      "allOpportunitiesByType",
      "get",
    ).mockReturnValue({
      [mockOpportunity.type]: [
        {
          ...mockOpportunity,
          eligibilityDate: new Date(2000, 2, 2),
        },
      ],
    });
    presenter = getPresenter({ workflowsStore: mockWorkflowsStore });
    expect(presenter.enabledColumnIds["ELIGIBILITY_DATE"]).toBeTrue();
  });

  test("don't show Instance Details column when opportunity doesn't have them", () => {
    expect(presenter.enabledColumnIds["INSTANCE_DETAILS"]).toBeFalse();
  });

  test("show Instance Details column when opportunity has them", () => {
    vi.spyOn(
      mockWorkflowsStore,
      "allOpportunitiesByType",
      "get",
    ).mockReturnValue({
      [mockOpportunity.type]: [
        {
          ...mockOpportunity,
          instanceDetails: "test",
        },
      ],
    });
    presenter = getPresenter({ workflowsStore: mockWorkflowsStore });

    expect(presenter.enabledColumnIds["INSTANCE_DETAILS"]).toBeTrue();
  });

  test("show Snooze Ends In column when viewing denied opportunities", () => {
    vi.spyOn(
      mockWorkflowsStore,
      "allOpportunitiesByType",
      "get",
    ).mockReturnValue({
      [mockOpportunity.type]: [
        {
          ...mockOpportunity,
          tabTitle: () => mockOpportunity.deniedTabTitle,
          snoozeForDays: 30,
        },
      ],
    });
    presenter = getPresenter({ workflowsStore: mockWorkflowsStore });
    expect(presenter.enabledColumnIds["SNOOZE_ENDS_IN"]).toBeFalse();
    presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
    expect(presenter.enabledColumnIds["SNOOZE_ENDS_IN"]).toBeTrue();
  });

  test("show Submitted For column when viewing submitted opportunities", () => {
    presenter.activeTab = mockOpportunity.submittedTabTitle as OpportunityTab;
    expect(presenter.enabledColumnIds["SUBMITTED_FOR"]).toBeTrue();
  });

  describe("denial reasons column", () => {
    test("shows denial reasons column for US_MI custody level downgrade when all conditions met", () => {
      const mockTenantStore = {
        currentTenantId: "US_MI",
      } as any as TenantStore;

      const mockWorkflowsStoreWithSystem = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;

      vi.spyOn(
        mockWorkflowsStoreWithSystem,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usMiCustodyLevelDowngrade: [
          {
            ...mockOpportunity,
            type: "usMiCustodyLevelDowngrade",
            tabTitle: () => "Marked Ineligible",
          },
        ],
      });

      presenter = getPresenter({
        tenantStore: mockTenantStore,
        workflowsStore: mockWorkflowsStoreWithSystem,
        opportunityType: "usMiCustodyLevelDowngrade",
      });

      presenter.activeTab = "Eligible Now" as OpportunityTab;
      expect(presenter.enabledColumnIds["DENIAL_REASONS"]).toBeFalse();
      //only show column in denied Tab
      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["DENIAL_REASONS"]).toBeTrue();
    });

    test("hides denial reason column for other US_MI incarceration opportunities", () => {
      const mockTenantStore = {
        currentTenantId: "US_MI",
      } as any as TenantStore;

      const mockWorkflowsStoreWithSystem = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;

      vi.spyOn(
        mockWorkflowsStoreWithSystem,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usMiSecurityClassificationCommitteeReview: [
          {
            ...mockOpportunity,
            type: "usMiSecurityClassificationCommitteeReview",
            tabTitle: () => "Marked Ineligible",
          },
        ],
      });

      presenter = getPresenter({
        tenantStore: mockTenantStore,
        workflowsStore: mockWorkflowsStoreWithSystem,
        opportunityType: "usMiSecurityClassificationCommitteeReview",
      });

      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["DENIAL_REASONS"]).toBeFalse();
    });

    test("hides denial reason column for US_MI supervision opportunities", () => {
      const mockTenantStore = {
        currentTenantId: "US_MI",
      } as any as TenantStore;

      const mockWorkflowsStoreWithSystem = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;

      vi.spyOn(
        mockWorkflowsStoreWithSystem,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usMiEarlyDischarge: [
          {
            ...mockOpportunity,
            type: "usMiEarlyDischarge",
            tabTitle: () => "Marked Ineligible",
          },
        ],
      });

      presenter = getPresenter({
        tenantStore: mockTenantStore,
        workflowsStore: mockWorkflowsStoreWithSystem,
        opportunityType: "usMiEarlyDischarge",
      });

      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["DENIAL_REASONS"]).toBeFalse();
    });

    test("hides denial reason column for other custody level downgrade opportunities", () => {
      const mockTenantStore = {
        currentTenantId: "US_ID",
      } as any as TenantStore;

      const mockWorkflowsStoreWithSystem = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;

      vi.spyOn(
        mockWorkflowsStoreWithSystem,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usIdCustodyLevelDowngrade: [
          {
            ...mockOpportunity,
            type: "usIdCustodyLevelDowngrade",
            tabTitle: () => "Marked Ineligible",
          },
        ],
      });

      presenter = getPresenter({
        tenantStore: mockTenantStore,
        workflowsStore: mockWorkflowsStoreWithSystem,
        opportunityType: "usIdCustodyLevelDowngrade",
      });

      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["DENIAL_REASONS"]).toBeFalse();
    });

    test("hides denial reasons column for US_TX", () => {
      const mockTenantStore = {
        currentTenantId: "US_TX",
      } as any as TenantStore;

      const mockWorkflowsStoreWithSystem = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;

      vi.spyOn(mockWorkflowsStoreWithSystem, "allOpportunitiesByType", "get");

      presenter = getPresenter({
        tenantStore: mockTenantStore,
        workflowsStore: mockWorkflowsStoreWithSystem,
      });

      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["DENIAL_REASONS"]).toBeFalse();
    });
  });

  describe("STATUS", () => {
    test.each([
      "usAzTransferToAdministrativeSupervision",
      "usAzTransferToAdministrativeSupervisionV2",
      "usAzReleaseToTPR",
      "usAzReleaseToDTP",
      "usIdOverdueFaceToFaceContact",
    ])("hides status column for %s", (opportunityType) => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [opportunityType]: [
          {
            ...mockOpportunity,
            type: opportunityType,
          },
        ],
      });

      presenter = getPresenter({
        opportunityType: opportunityType as OpportunityType,
      });

      expect(presenter.enabledColumnIds["STATUS"]).toBeFalse();
    });
  });
  describe("ALMOST_ELIGIBILITY_DATE", () => {
    test.each([
      "LSU",
      "usTnCompliantReporting2025Policy",
      "usAzTransferToAdministrativeSupervision",
    ])("hides status column for %s", (opportunityType) => {
      // Add almostEligible tab support to the test configuration
      const mockConfig = {
        ...mockOpportunity.config,
        supportsAlmostEligible: true,
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Eligible Now",
            "Almost Eligible",
            "Submitted",
            "Marked Ineligible",
          ],
        },
      };
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [opportunityType]: [
          {
            ...mockOpportunity,
            config: mockConfig,
            almostEligible: true,
            almostEligibilityDate: new Date(),
            type: opportunityType,
            tabTitle: () => "Almost Eligible",
          },
        ],
      });

      presenter = getPresenter({
        config: mockConfig as OpportunityConfiguration,
        opportunityType: opportunityType as OpportunityType,
      });

      presenter.activeTab = "Almost Eligible";

      expect(presenter.enabledColumnIds["ALMOST_ELIGIBILITY_DATE"]).toBeTrue();
    });
  });
  describe("RELEASE_DATE", () => {
    test("shows for INCARCERATION system", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      presenter = getPresenter({ workflowsStore });
      expect(presenter.enabledColumnIds["RELEASE_DATE"]).toBeTrue();
    });

    test("hides for SUPERVISION system", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;
      presenter = getPresenter({ workflowsStore });
      expect(presenter.enabledColumnIds["RELEASE_DATE"]).toBeFalse();
    });

    test.each([
      "usMiSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      "usMiSecurityClassificationCommitteeReviewV2",
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
      "usMiCustodyLevelDowngrade",
      "usIdCustodyLevelDowngrade",
    ])("hides for %s even in INCARCERATION", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      presenter = getPresenter({
        workflowsStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["RELEASE_DATE"]).toBeFalse();
    });
  });

  describe("SUPERVISION_EXPIRATION_DATE", () => {
    test("shows for SUPERVISION system", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;
      presenter = getPresenter({ workflowsStore });
      expect(
        presenter.enabledColumnIds["SUPERVISION_EXPIRATION_DATE"],
      ).toBeFalse();
    });
    test("hides for INCARCERATION system", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      presenter = getPresenter({ workflowsStore });
      expect(
        presenter.enabledColumnIds["SUPERVISION_EXPIRATION_DATE"],
      ).toBeFalse();
    });

    test.each([
      "pastFTRD",
      "usMiPastFTRD",
      "usTnExpiration",
      "usIdOverdueFaceToFaceContact",
    ])("hides for %s even in SUPERVISION", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;
      presenter = getPresenter({
        workflowsStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(
        presenter.enabledColumnIds["SUPERVISION_EXPIRATION_DATE"],
      ).toBeFalse();
    });
  });

  describe("US_ID_EPRD", () => {
    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_EPRD"]).toBeFalse();
    });

    test("shows for usIdCustodyLevelDowngrade", () => {
      presenter = getPresenter({
        opportunityType: "usIdCustodyLevelDowngrade" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_EPRD"]).toBeTrue();
    });
  });

  describe("US_NE_PEDD_DATE", () => {
    test("shows for SUPERVISION system in US_NE", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_NE" } as any as TenantStore;
      presenter = getPresenter({ workflowsStore, tenantStore });
      expect(presenter.enabledColumnIds["US_NE_PEDD_DATE"]).toBeTrue();
    });

    test("hides for INCARCERATION system in US_NE", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_NE" } as any as TenantStore;
      presenter = getPresenter({ workflowsStore, tenantStore });
      expect(presenter.enabledColumnIds["US_NE_PEDD_DATE"]).toBeFalse();
    });

    test("hides for SUPERVISION system in other states", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;
      presenter = getPresenter({ workflowsStore });
      expect(presenter.enabledColumnIds["US_NE_PEDD_DATE"]).toBeFalse();
    });
  });

  describe("UNIT_ID", () => {
    test("hides by default", () => {
      expect(presenter.enabledColumnIds["UNIT_ID"]).toBeFalse();
    });
    test("shows for usNeGoodTimeRestoration", () => {
      presenter = getPresenter({
        opportunityType: "usNeGoodTimeRestoration" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["UNIT_ID"]).toBeTrue();
    });
  });

  describe("US_NE_ELIGIBLE_RESTORATION_AMT", () => {
    test("hides by default", () => {
      expect(
        presenter.enabledColumnIds["US_NE_ELIGIBLE_RESTORATION_AMT"],
      ).toBeFalse();
    });
    test("shows for usNeGoodTimeRestoration", () => {
      presenter = getPresenter({
        opportunityType: "usNeGoodTimeRestoration" as OpportunityType,
      });
      expect(
        presenter.enabledColumnIds["US_NE_ELIGIBLE_RESTORATION_AMT"],
      ).toBeTrue();
    });
  });

  describe("US_NE_TOTAL_LOST_RESTORABLE_GT", () => {
    test("shows for usNeGoodTimeRestoration", () => {
      presenter = getPresenter({
        opportunityType: "usNeGoodTimeRestoration" as OpportunityType,
      });
      expect(
        presenter.enabledColumnIds["US_NE_TOTAL_LOST_RESTORABLE_GT"],
      ).toBeTrue();
    });

    test("hides by default", () => {
      expect(
        presenter.enabledColumnIds["US_NE_TOTAL_LOST_RESTORABLE_GT"],
      ).toBeFalse();
    });
  });

  describe("US_MI_UNIT_ID", () => {
    test("shows for INCARCERATION system in US_MI", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({ workflowsStore, tenantStore });
      expect(presenter.enabledColumnIds["US_MI_UNIT_ID"]).toBeTrue();
    });

    test("hides for SUPERVISION system in US_MI", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "SUPERVISION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({ workflowsStore, tenantStore });
      expect(presenter.enabledColumnIds["US_MI_UNIT_ID"]).toBeFalse();
    });

    test("hides for INCARCERATION system in other states", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      presenter = getPresenter({ workflowsStore });
      expect(presenter.enabledColumnIds["US_MI_UNIT_ID"]).toBeFalse();
    });
  });

  describe("US_MI_ERD", () => {
    test("shows for usMiCustodyLevelDowngrade", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: "usMiCustodyLevelDowngrade" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_ERD"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_ERD"]).toBeFalse();
    });
  });

  describe("US_MI_CUSTODY_LEVEL", () => {
    test("shows for usMiCustodyLevelDowngrade in INCARCERATION in US_MI", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: "usMiCustodyLevelDowngrade" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_CUSTODY_LEVEL"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_CUSTODY_LEVEL"]).toBeFalse();
    });
  });

  describe("US_MI_SEG_START_DATE", () => {
    test.each([
      "usMiSecurityClassificationCommitteeReviewV2",
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
    ])("shows for %s in INCARCERATION in US_MI", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_SEG_START_DATE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_SEG_START_DATE"]).toBeFalse();
    });
  });

  describe("US_MI_NEXT_SCC_DATE", () => {
    test.each([
      "usMiSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      "usMiSecurityClassificationCommitteeReviewV2",
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
    ])("shows for %s in INCARCERATION in US_MI", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_NEXT_SCC_DATE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_NEXT_SCC_DATE"]).toBeFalse();
    });
  });

  describe("US_MI_LAST_SCC_DATE", () => {
    test("shows for usMiSecurityClassificationCommitteeReviewV2 in INCARCERATION in US_MI", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType:
          "usMiSecurityClassificationCommitteeReviewV2" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_LAST_SCC_DATE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_LAST_SCC_DATE"]).toBeFalse();
    });
  });

  describe("US_MI_ADD_LAST_SCC_DATE", () => {
    test("shows for usMiAddInPersonSecurityClassificationCommitteeReviewV2 in INCARCERATION in US_MI", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType:
          "usMiAddInPersonSecurityClassificationCommitteeReviewV2" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_ADD_LAST_SCC_DATE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_ADD_LAST_SCC_DATE"]).toBeFalse();
    });
  });

  describe("US_MI_WARDEN_LAST_SCC_DATE", () => {
    test("shows for usMiWardenInPersonSecurityClassificationCommitteeReviewV2 in INCARCERATION in US_MI", () => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType:
          "usMiWardenInPersonSecurityClassificationCommitteeReviewV2" as OpportunityType,
      });
      expect(
        presenter.enabledColumnIds["US_MI_WARDEN_LAST_SCC_DATE"],
      ).toBeTrue();
    });

    test("hides by default", () => {
      expect(
        presenter.enabledColumnIds["US_MI_WARDEN_LAST_SCC_DATE"],
      ).toBeFalse();
    });
  });

  describe("US_MI_SEG_DURATION", () => {
    test.each([
      "usMiSecurityClassificationCommitteeReviewV2",
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
    ])("shows for %s in INCARCERATION in US_MI", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_SEG_DURATION"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_SEG_DURATION"]).toBeFalse();
    });
  });

  describe("US_MI_OPT", () => {
    test.each([
      "usMiSecurityClassificationCommitteeReviewV2",
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
    ])("shows for %s in INCARCERATION in US_MI", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_OPT"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_OPT"]).toBeFalse();
    });
  });

  describe("US_MI_SMI", () => {
    test.each([
      "usMiSecurityClassificationCommitteeReviewV2",
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
    ])("shows for %s in INCARCERATION in US_MI", (opportunityType) => {
      const workflowsStore = {
        ...mockWorkflowsStore,
        activeSystem: "INCARCERATION",
      } as any as WorkflowsStore;
      const tenantStore = { currentTenantId: "US_MI" } as any as TenantStore;
      presenter = getPresenter({
        workflowsStore,
        tenantStore,
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_MI_SMI"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_MI_SMI"]).toBeFalse();
    });
  });

  describe("US_TN_LATEST_CLASSIFICATION_DATE", () => {
    test("shows for usTnCustodyLevelDowngrade2026Policy", () => {
      presenter = getPresenter({
        opportunityType:
          "usTnCustodyLevelDowngrade2026Policy" as OpportunityType,
      });
      expect(
        presenter.enabledColumnIds["US_TN_LATEST_CLASSIFICATION_DATE"],
      ).toBeTrue();
    });

    test("hides by default", () => {
      expect(
        presenter.enabledColumnIds["US_TN_LATEST_CLASSIFICATION_DATE"],
      ).toBeFalse();
    });
  });

  describe("LAST_VIEWED", () => {
    test("hides for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["LAST_VIEWED"]).toBeFalse();
    });

    test("shows by default", () => {
      expect(presenter.enabledColumnIds["LAST_VIEWED"]).toBeTrue();
    });
  });

  describe("US_ID_LAST_VIEWED", () => {
    test("shows for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_LAST_VIEWED"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_LAST_VIEWED"]).toBeFalse();
    });
  });

  describe("ALMOST_ELIGIBLE_STATUS", () => {
    test("shows when an opportunity has almostEligibleStatusMessage and is not denied or submitted", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            almostEligibleStatusMessage: "Almost eligible",
            denied: false,
            isSubmitted: false,
          },
        ],
      });
      presenter = getPresenter({});
      expect(presenter.enabledColumnIds["ALMOST_ELIGIBLE_STATUS"]).toBeTrue();
    });

    test("hides when opportunity is denied", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            almostEligibleStatusMessage: "Almost eligible",
            denied: true,
            isSubmitted: false,
          },
        ],
      });
      presenter = getPresenter({});
      expect(presenter.enabledColumnIds["ALMOST_ELIGIBLE_STATUS"]).toBeFalse();
    });

    test("hides when opportunity is submitted", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            almostEligibleStatusMessage: "Almost eligible",
            denied: false,
            isSubmitted: true,
          },
        ],
      });
      presenter = getPresenter({});
      expect(presenter.enabledColumnIds["ALMOST_ELIGIBLE_STATUS"]).toBeFalse();
    });

    test("hides when no status message", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            denied: true,
            isSubmitted: true,
          },
        ],
      });
      presenter = getPresenter({});
      expect(presenter.enabledColumnIds["ALMOST_ELIGIBLE_STATUS"]).toBeFalse();
    });
  });

  describe("SNOOZE_ENDS_IN", () => {
    test("shows when viewing denied tab and opportunity has valid snoozeEndsInDays", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            tabTitle: () => mockOpportunity.deniedTabTitle,
            indefiniteDenialReasons: { CODE: "reason" },
          },
        ],
      });
      presenter = getPresenter({});
      vi.spyOn(presenter, "snoozeEndsInDays").mockReturnValue(10);
      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["SNOOZE_ENDS_IN"]).toBeTrue();
    });

    test("shows when viewing denied tab and opportunity has indefinite denial reasons", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            tabTitle: () => mockOpportunity.deniedTabTitle,
            indefiniteDenialReasons: { CODE: "reason" },
          },
        ],
      });
      presenter = getPresenter({});
      presenter.activeTab = mockOpportunity.deniedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["SNOOZE_ENDS_IN"]).toBeTrue();
    });

    test("hides when not viewing denied tab", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        [mockOpportunity.type]: [
          {
            ...mockOpportunity,
            indefiniteDenialReasons: { CODE: "reason" },
          },
        ],
      });
      presenter = getPresenter({});
      expect(presenter.enabledColumnIds["SNOOZE_ENDS_IN"]).toBeFalse();
    });
  });

  describe("SUBMITTED_FOR", () => {
    test("shows when viewing submitted tab", () => {
      presenter = getPresenter({});
      presenter.activeTab = mockOpportunity.submittedTabTitle as OpportunityTab;
      expect(presenter.enabledColumnIds["SUBMITTED_FOR"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["SUBMITTED_FOR"]).toBeFalse();
    });
  });

  describe("CTA_BUTTON", () => {
    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])("hides for %s", (opportunityType) => {
      presenter = getPresenter({
        opportunityType: opportunityType as OpportunityType,
      });
      expect(presenter.enabledColumnIds["CTA_BUTTON"]).toBeFalse();
    });

    test("shows by default", () => {
      expect(presenter.enabledColumnIds["CTA_BUTTON"]).toBeTrue();
    });
  });

  describe("AGREEMENT_STATUS", () => {
    test.each(["usAzReleaseToTPR", "usAzReleaseToDTP"])(
      "shows for %s",
      (opportunityType) => {
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["AGREEMENT_STATUS"]).toBeTrue();
      },
    );

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["AGREEMENT_STATUS"]).toBeFalse();
    });
  });

  describe("HOME_PLAN_STATUS", () => {
    test.each(["usAzReleaseToTPR", "usAzReleaseToDTP"])(
      "shows for %s",
      (opportunityType) => {
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["HOME_PLAN_STATUS"]).toBeTrue();
      },
    );

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["HOME_PLAN_STATUS"]).toBeFalse();
    });
  });

  describe("MAN_LIT_STATUS", () => {
    test.each(["usAzReleaseToTPR", "usAzReleaseToDTP"])(
      "shows for %s",
      (opportunityType) => {
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["MAN_LIT_STATUS"]).toBeTrue();
      },
    );

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["MAN_LIT_STATUS"]).toBeFalse();
    });
  });

  describe("US_ID_LAST_CONTACT_DATE", () => {
    test("shows for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_LAST_CONTACT_DATE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_LAST_CONTACT_DATE"]).toBeFalse();
    });
  });

  describe("US_ID_SUPERVISION_LEVEL", () => {
    test("shows for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_SUPERVISION_LEVEL"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_SUPERVISION_LEVEL"]).toBeFalse();
    });
  });

  describe("US_ID_CASE_TYPE", () => {
    test("shows for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_CASE_TYPE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_CASE_TYPE"]).toBeFalse();
    });
  });

  describe("US_ID_CONTACT_DUE_DATE", () => {
    test("shows for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_CONTACT_DUE_DATE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_CONTACT_DUE_DATE"]).toBeFalse();
    });
  });

  describe("US_ID_CONTACT_CADENCE", () => {
    test("shows for usIdOverdueFaceToFaceContact", () => {
      presenter = getPresenter({
        opportunityType: "usIdOverdueFaceToFaceContact" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_ID_CONTACT_CADENCE"]).toBeTrue();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_ID_CONTACT_CADENCE"]).toBeFalse();
    });
  });

  describe("US_TX_CURRENT_REVIEWER", () => {
    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in supervisor review",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: true,
              isInRevisionsRequested: false,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_CURRENT_REVIEWER"]).toBeTrue();
      },
    );

    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in revisions requested",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: false,
              isInRevisionsRequested: true,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_CURRENT_REVIEWER"]).toBeTrue();
      },
    );

    test("hides when opportunities are not in supervisor review or revisions", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usTxAnnualReportStatusV2: [
          {
            ...mockOpportunity,
            type: "usTxAnnualReportStatusV2",
            isInSupervisorReview: false,
            isInRevisionsRequested: false,
          },
        ],
      });
      presenter = getPresenter({
        opportunityType: "usTxAnnualReportStatusV2" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_TX_CURRENT_REVIEWER"]).toBeFalse();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_TX_CURRENT_REVIEWER"]).toBeFalse();
    });
  });

  describe("US_TX_SUBMITTED_FOR_REVIEW_DATE", () => {
    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in supervisor review",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: true,
              isInRevisionsRequested: false,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(
          presenter.enabledColumnIds["US_TX_SUBMITTED_FOR_REVIEW_DATE"],
        ).toBeTrue();
      },
    );

    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in revisions requested",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: false,
              isInRevisionsRequested: true,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(
          presenter.enabledColumnIds["US_TX_SUBMITTED_FOR_REVIEW_DATE"],
        ).toBeTrue();
      },
    );

    test("hides when opportunities are not in supervisor review or revisions", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usTxAnnualReportStatusV2: [
          {
            ...mockOpportunity,
            type: "usTxAnnualReportStatusV2",
            isInSupervisorReview: false,
            isInRevisionsRequested: false,
          },
        ],
      });
      presenter = getPresenter({
        opportunityType: "usTxAnnualReportStatusV2" as OpportunityType,
      });
      expect(
        presenter.enabledColumnIds["US_TX_SUBMITTED_FOR_REVIEW_DATE"],
      ).toBeFalse();
    });

    test("hides by default", () => {
      expect(
        presenter.enabledColumnIds["US_TX_SUBMITTED_FOR_REVIEW_DATE"],
      ).toBeFalse();
    });
  });

  describe("US_TX_ALL_REVIEWERS", () => {
    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are grant approved",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: false,
              isInRevisionsRequested: false,
              isGrantApproved: true,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_ALL_REVIEWERS"]).toBeTrue();
      },
    );

    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in supervisor review",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: true,
              isInRevisionsRequested: false,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_ALL_REVIEWERS"]).toBeTrue();
      },
    );

    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in revisions requested",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInSupervisorReview: false,
              isInRevisionsRequested: true,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_ALL_REVIEWERS"]).toBeTrue();
      },
    );

    test("hides when opportunities are not in any review state", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usTxAnnualReportStatusV2: [
          {
            ...mockOpportunity,
            type: "usTxAnnualReportStatusV2",
            isInSupervisorReview: false,
            isInRevisionsRequested: false,
            isGrantApproved: false,
          },
        ],
      });
      presenter = getPresenter({
        opportunityType: "usTxAnnualReportStatusV2" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_TX_ALL_REVIEWERS"]).toBeFalse();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_TX_ALL_REVIEWERS"]).toBeFalse();
    });
  });

  describe("US_TX_GRANT_DATE", () => {
    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are grant approved",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isGrantApproved: true,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_GRANT_DATE"]).toBeTrue();
      },
    );

    test("hides when opportunities are not grant approved", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usTxAnnualReportStatusV2: [
          {
            ...mockOpportunity,
            type: "usTxAnnualReportStatusV2",
            isGrantApproved: false,
          },
        ],
      });
      presenter = getPresenter({
        opportunityType: "usTxAnnualReportStatusV2" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_TX_GRANT_DATE"]).toBeFalse();
    });

    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_TX_GRANT_DATE"]).toBeFalse();
    });
  });

  describe("US_TX_REVISION_REASON", () => {
    test.each([
      "usTxAnnualReportStatusV2",
      "usTxEarlyReleaseFromSupervisionV2",
    ])(
      "shows for %s when all opportunities are in revisions requested",
      (opportunityType) => {
        vi.spyOn(
          mockWorkflowsStore,
          "allOpportunitiesByType",
          "get",
        ).mockReturnValue({
          [opportunityType]: [
            {
              ...mockOpportunity,
              type: opportunityType,
              isInRevisionsRequested: true,
            },
          ],
        });
        presenter = getPresenter({
          opportunityType: opportunityType as OpportunityType,
        });
        expect(presenter.enabledColumnIds["US_TX_REVISION_REASON"]).toBeTrue();
      },
    );

    test("hides when opportunities are not in revisions requested", () => {
      vi.spyOn(
        mockWorkflowsStore,
        "allOpportunitiesByType",
        "get",
      ).mockReturnValue({
        usTxAnnualReportStatusV2: [
          {
            ...mockOpportunity,
            type: "usTxAnnualReportStatusV2",
            isInRevisionsRequested: false,
          },
        ],
      });
      presenter = getPresenter({
        opportunityType: "usTxAnnualReportStatusV2" as OpportunityType,
      });
      expect(presenter.enabledColumnIds["US_TX_REVISION_REASON"]).toBeFalse();
    });
    test("hides by default", () => {
      expect(presenter.enabledColumnIds["US_TX_REVISION_REASON"]).toBeFalse();
    });
  });
});

describe("with a linked overdue opportunity", () => {
  beforeEach(() => {
    const config: OpportunityConfiguration = {
      ...mockOpportunity.config,
      linkedOverdueOpportunityType: "earlyTermination",
    };

    const workflowsStore = {
      ...mockWorkflowsStore,
      eligibleOpportunities: {
        earlyTermination: [0, 1, 2],
      },
    } as any as WorkflowsStore;

    presenter = getPresenter({
      config,
      workflowsStore,
    });
  });

  it("counts the number of overdue opportunities", () => {
    expect(presenter.overdueOpportunityCount).toEqual(3);
  });
});
