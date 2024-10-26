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

import { mockOpportunity } from "../../../core/__tests__/testUtils";
import FirestoreStore from "../../../FirestoreStore";
import { SupervisionOpportunityPresenter } from "../../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import { FeatureVariantRecord } from "../../../RootStore/types";
import { OpportunityConfiguration } from "../../Opportunity/OpportunityConfigurations";
import { OpportunityTabGroups } from "../../Opportunity/types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { OpportunityCaseloadPresenter } from "../OpportunityCaseloadPresenter";

let presenter: OpportunityCaseloadPresenter;

const analyticsStore = {
  trackOpportunityTabClicked: vi.fn(),
} as any as AnalyticsStore;

const mockUpdateCustomTabOrderings = vi.fn();
const firestoreStore = {
  updateCustomTabOrderings: mockUpdateCustomTabOrderings,
} as any as FirestoreStore;

const mockOpportunities = {
  [mockOpportunity.type]: [mockOpportunity],
};
const workflowsStore = {
  allOpportunitiesByType: mockOpportunities,
} as any as WorkflowsStore;

const FEATURE_VARIANTS_WITH_OPP_TABS: FeatureVariantRecord = {
  sortableOpportunityTabs: {},
};

const ORDERED_TABS = ["Eligible Now", "Almost Eligible", "Marked Ineligible"];
const UNORDERED_TABS = ["Other"];

describe("one tab group, no supervision presenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    presenter = new OpportunityCaseloadPresenter(
      analyticsStore,
      firestoreStore,
      workflowsStore,
      mockOpportunity.config,
      FEATURE_VARIANTS_WITH_OPP_TABS,
      mockOpportunity.type,
    );
  });

  test("reordering tabs updates firestore", () => {
    mockUpdateCustomTabOrderings.mockResolvedValue(undefined);

    expect(presenter.displayTabs).toEqual([
      "Eligible Now",
      "Marked Ineligible",
    ]);

    presenter.swapTabs("Marked Ineligible", "Eligible Now");

    expect(mockUpdateCustomTabOrderings).toHaveBeenCalledOnce();
    expect(presenter.displayTabs).toEqual([
      "Marked Ineligible",
      "Eligible Now",
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

    expect(presenter.displayTabs).toEqual(preferredTabs);
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
    presenter = new OpportunityCaseloadPresenter(
      analyticsStore,
      firestoreStore,
      workflowsStore,
      multiTabGroupConfig,
      FEATURE_VARIANTS_WITH_OPP_TABS,
      mockOpportunity.type,
    );
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
      "Marked Ineligible": 0,
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

describe("in insights/with supervision presenter", () => {
  beforeEach(() => {
    // supervision presenter with two opportunities
    const supervisionOpportunityPresenter = {
      opportunitiesByType: {
        [mockOpportunity.type]: [
          mockOpportunity,
          { ...mockOpportunity, tabTitle: () => "Marked Ineligible" },
        ],
      },
      labels: { supervisionJiiLabel: "test title" },
    } as any as SupervisionOpportunityPresenter;

    presenter = new OpportunityCaseloadPresenter(
      analyticsStore,
      firestoreStore,
      workflowsStore,
      mockOpportunity.config,
      FEATURE_VARIANTS_WITH_OPP_TABS,
      mockOpportunity.type,
      supervisionOpportunityPresenter,
    );
  });

  test("gets opportunities from supervision presenter", () => {
    expect(presenter.oppsFromOpportunitiesByTab).toContainAllKeys([
      "Eligible Now",
      "Marked Ineligible",
    ]);
  });

  test("gets JII title from supervision presenter", () => {
    expect(presenter.justiceInvolvedPersonTitle).toEqual("test title");
  });
});
