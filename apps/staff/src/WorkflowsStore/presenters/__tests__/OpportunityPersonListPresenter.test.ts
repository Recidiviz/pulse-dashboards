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
const mockFilterStore = {} as any as OpportunitiesFilterStore;

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
}: {
  config?: OpportunityConfiguration;
  supervisionPresenter?:
    | SupervisionOpportunityPresenter
    | SupervisionSupervisorOpportunityPresenter;
  workflowsStore?: WorkflowsStore;
  tenantStore?: TenantStore;
  opportunityType?: typeof mockOpportunity.type;
  opportunitiesFilterStore?: OpportunitiesFilterStore;
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
  );
}

describe("one tab group, no supervision presenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

  test("changing active tab emits a tracking event", () => {
    expect(presenter.activeTab).toEqual("Eligible Now");

    presenter.activeTab = "Marked Ineligible";

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
