/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Mock } from "vitest";

import {
  useOpportunityConfigurations,
  useRootStore,
} from "../../../components/StoreProvider";
import isIE11 from "../../../utils/isIE11";
import { WorkflowsStore } from "../../../WorkflowsStore";
import { OpportunityConfigurationStore } from "../../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WorkflowsRootStore } from "../../../WorkflowsStore/WorkflowsRootStore";
import { CaseloadView } from "../../CaseloadView";
import { OpportunityCaseloadView } from "../../OpportunityCaseloadView";
import { WORKFLOWS_PATHS } from "../../views";
import WorkflowsHomepage from "../../WorkflowsHomepage";
import { FullProfile } from "../../WorkflowsJusticeInvolvedPersonProfile";
import { WorkflowsFormLayout } from "../../WorkflowsLayouts";
import WorkflowsMilestones from "../../WorkflowsMilestones";
import { WorkflowsTasks } from "../../WorkflowsTasks/WorkflowsTasks";
import PageWorkflows from "../PageWorkflows";

vi.mock("../../CoreStoreProvider");
vi.mock("../../../utils/isIE11");
vi.mock("../../../WorkflowsStore");
vi.mock("../../../components/StoreProvider");
vi.mock("../../WorkflowsHomepage", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

vi.mock("../../WorkflowsMilestones/WorkflowsMilestones", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

vi.mock("../../CaseloadView", () => {
  return {
    __esModule: true,
    CaseloadView: vi.fn(),
  };
});

vi.mock("../../WorkflowsJusticeInvolvedPersonProfile/FullProfile", () => {
  return {
    __esModule: true,
    FullProfile: vi.fn(),
  };
});

vi.mock("../../WorkflowsTasks/WorkflowsTasks", () => {
  return {
    __esModule: true,
    WorkflowsTasks: vi.fn(),
  };
});

vi.mock("../../OpportunityCaseloadView", () => {
  return {
    __esModule: true,
    OpportunityCaseloadView: vi.fn(),
  };
});

vi.mock("../../WorkflowsLayouts", () => {
  return {
    __esModule: true,
    WorkflowsFormLayout: vi.fn(),
  };
});

const mockUseRootStore = useRootStore as unknown as Mock;
const mockUseOpportunityConfigurations =
  useOpportunityConfigurations as unknown as Mock;

function mockStores(mockWorkflowsStore: any, mockOpportunityConfigStore: any) {
  mockUseRootStore.mockReturnValue({
    workflowsStore: mockWorkflowsStore as WorkflowsStore,
    workflowsRootStore: {
      opportunityConfigurationStore:
        mockOpportunityConfigStore as OpportunityConfigurationStore,
    } as WorkflowsRootStore,
    currentTenantId: "US_TN",
  });
}

function renderRouter(relativePath?: string) {
  render(
    <MemoryRouter initialEntries={[relativePath ?? "/"]}>
      <Routes>
        <Route path="/workflows/*" element={<PageWorkflows />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PageWorkflows", () => {
  let baseMockWorkflowsStore: any;
  let baseMockOppConfigStore: any;
  beforeEach(() => {
    mockStores(
      {
        hydrate: vi.fn().mockReturnValue(vi.fn()),
        hydrationState: { status: "needs hydration" },
        keepUserObserved: vi.fn(),
        stopKeepingUserObserved: vi.fn(),
      },
      { getOpportunityTypeFromUrl: vi.fn(() => "usTnCompliantReporting") },
    );
  });

  describe("IE11", () => {
    it("attempts to hydrate the workflows models when not on IE11", () => {
      (isIE11 as unknown as Mock).mockReturnValue(false);
      render(<PageWorkflows />);
      expect(useRootStore().workflowsStore.hydrate).toHaveBeenCalledTimes(1);
    });

    it("does not attempt to hydrate the workflows models when on IE11", () => {
      (isIE11 as unknown as Mock).mockReturnValue(true);
      render(<PageWorkflows />);
      expect(useRootStore().workflowsStore.hydrate).toHaveBeenCalledTimes(0);
    });
  });

  describe("Workflows user data", () => {
    beforeEach(() => {
      (isIE11 as unknown as Mock).mockReturnValue(false);
      baseMockWorkflowsStore = {
        hydrate: vi.fn().mockReturnValue(vi.fn()),
        hydrationState: { status: "needs hydration" },
        keepUserObserved: vi.fn(),
        stopKeepingUserObserved: vi.fn(),
      };
      baseMockOppConfigStore = {
        getOpportunityTypeFromUrl: vi.fn(() => "usTnCompliantReporting"),
      };
      mockStores(baseMockWorkflowsStore, baseMockOppConfigStore);
    });

    it("is observed on component mount", () => {
      render(<PageWorkflows />);
      expect(baseMockWorkflowsStore.keepUserObserved).toHaveBeenCalled();
    });

    it("is unobserved on component unmount", () => {
      const { unmount } = render(<PageWorkflows />);
      expect(
        baseMockWorkflowsStore.stopKeepingUserObserved,
      ).not.toHaveBeenCalled();
      unmount();
      expect(baseMockWorkflowsStore.stopKeepingUserObserved).toHaveBeenCalled();
    });
  });

  describe("WorkflowsRoute without redirects", () => {
    beforeEach(() => {
      (isIE11 as Mock).mockReturnValue(false);
      baseMockWorkflowsStore = {
        hydrationState: { status: "hydrated" },
        opportunityTypes: [],
        workflowsSupportedSystems: ["SUPERVISION"],
        setActivePage: vi.fn(),
        updateActiveSystem: vi.fn(),
        updateSelectedOpportunityType: vi.fn(),
        updateSelectedPerson: vi
          .fn()
          .mockImplementation(() => ({ catch: vi.fn() })),
        activeSystem: "SUPERVISION",
        keepUserObserved: vi.fn(),
        stopKeepingUserObserved: vi.fn(),
      };
      baseMockOppConfigStore = {
        getOpportunityTypeFromUrl: vi.fn(() => null),
      };
      (WorkflowsHomepage as unknown as Mock).mockReturnValue(
        <div>Workflows Homepage</div>,
      );
      (WorkflowsFormLayout as unknown as Mock).mockReturnValue(
        <div>Opportunity Action Page</div>,
      );
    });

    it("renders the homepage for route /home", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "home",
        },
        baseMockOppConfigStore,
      );

      renderRouter(WORKFLOWS_PATHS.home);

      expect(screen.getByText("Workflows Homepage")).toBeInTheDocument();
    });

    it("renders the milestones page for route /milestones", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "milestones",
        },
        baseMockOppConfigStore,
      );
      (WorkflowsMilestones as unknown as Mock).mockReturnValue(
        <div>Workflows Milestones Page</div>,
      );
      renderRouter(WORKFLOWS_PATHS.milestones);
      expect(screen.getByText("Workflows Milestones Page")).toBeInTheDocument();
    });

    it("renders the client profile page for route /clientProfile", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "clientProfile",
        },
        baseMockOppConfigStore,
      );

      (FullProfile as unknown as Mock).mockReturnValue(
        <div>Client FullProfile</div>,
      );
      renderRouter(`${WORKFLOWS_PATHS.clients}/101`);

      expect(screen.getByText("Client FullProfile")).toBeInTheDocument();
    });

    it("renders the client profile page for route /residentProfile", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "residentProfile",
        },
        baseMockOppConfigStore,
      );
      (FullProfile as unknown as Mock).mockReturnValue(
        <div>Resident FullProfile</div>,
      );
      renderRouter(`${WORKFLOWS_PATHS.residents}/101`);

      expect(screen.getByText("Resident FullProfile")).toBeInTheDocument();
    });

    it("renders the caseload route /clients", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "clients",
        },
        baseMockOppConfigStore,
      );
      (CaseloadView as unknown as Mock).mockReturnValue(
        <div>Client CaseloadView</div>,
      );
      renderRouter(WORKFLOWS_PATHS.clients);

      expect(screen.getByText("Client CaseloadView")).toBeInTheDocument();
    });

    it("renders the caseload route /residents", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "residents",
        },
        baseMockOppConfigStore,
      );
      (CaseloadView as unknown as Mock).mockReturnValue(
        <div>Resident CaseloadView</div>,
      );
      renderRouter(WORKFLOWS_PATHS.residents);

      expect(screen.getByText("Resident CaseloadView")).toBeInTheDocument();
    });

    it("renders the tasks page for route /tasks", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "tasks",
        },
        baseMockOppConfigStore,
      );
      (WorkflowsTasks as unknown as Mock).mockReturnValue(<div>Tasks</div>);
      renderRouter(WORKFLOWS_PATHS.tasks);

      expect(screen.getByText("Tasks")).toBeInTheDocument();
    });

    it("renders the opportunity page for route /opportunityClients", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "opportunityClients",
        },
        baseMockOppConfigStore,
      );
      (OpportunityCaseloadView as unknown as Mock).mockReturnValue(
        <div>Opportunity Caseload View</div>,
      );

      renderRouter(`${WORKFLOWS_PATHS.workflows}/compliantReporting`);

      expect(screen.getByText("Opportunity Caseload View")).toBeInTheDocument();
    });

    it("renders the opportunity action page for route /opportunityAction", () => {
      mockStores(
        {
          ...baseMockWorkflowsStore,
          activePage: "opportunityAction",
        },
        baseMockOppConfigStore,
      );

      renderRouter(`${WORKFLOWS_PATHS.workflows}/compliantReporting/101`);

      expect(screen.getByText("Opportunity Action Page")).toBeInTheDocument();
    });
  });

  describe("WorkflowsRoute logic and redirects", () => {
    beforeEach(() => {
      (isIE11 as Mock).mockReturnValue(false);
      baseMockWorkflowsStore = {
        hydrationState: { status: "hydrated" },
        homepage: "home",
        workflowsSupportedSystems: ["INCARCERATION", "SUPERVISION"],
        opportunityTypes: [],
        setActivePage: vi.fn(),
        updateActiveSystem: vi.fn(),
        updateSelectedOpportunityType: vi.fn(),
        updateSelectedPerson: vi
          .fn()
          .mockImplementation(() => ({ catch: vi.fn() })),
        keepUserObserved: vi.fn(),
        stopKeepingUserObserved: vi.fn(),
      };
      (WorkflowsTasks as unknown as Mock).mockReturnValue(
        <div>Tasks Page</div>,
      );
      (OpportunityCaseloadView as unknown as Mock).mockReturnValue(
        <div>Opportunity Caseload View</div>,
      );
      (WorkflowsHomepage as unknown as Mock).mockReturnValue(
        <div>Workflows Homepage</div>,
      );
      (FullProfile as unknown as Mock).mockReturnValue(<div>Full profile</div>);
    });

    describe("/workflows/tasks", () => {
      it("updates activeSystem based on page", () => {
        mockStores(baseMockWorkflowsStore, baseMockOppConfigStore);
        renderRouter(WORKFLOWS_PATHS.tasks);

        expect(
          useRootStore().workflowsStore.updateActiveSystem,
        ).toHaveBeenCalledWith("SUPERVISION");
      });
    });

    describe("/workflows/:opportunityTypeUrl route", () => {
      it("updates activeSystem based on page for SUPERVISION", () => {
        mockStores(baseMockWorkflowsStore, {
          getOpportunityTypeFromUrl: vi.fn(() => "usTnCompliantReporting"),
        });
        mockUseOpportunityConfigurations.mockReturnValue({
          usTnCompliantReporting: {
            systemType: "SUPERVISION",
          },
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/compliantReporting`);

        expect(
          useRootStore().workflowsRootStore.opportunityConfigurationStore
            .getOpportunityTypeFromUrl,
        ).toHaveBeenCalledWith("compliantReporting");
        expect(
          useRootStore().workflowsStore.updateActiveSystem,
        ).toHaveBeenCalledWith("SUPERVISION");
      });

      it("updates activeSystem based on page for INCARCERATION", () => {
        mockStores(baseMockWorkflowsStore, {
          getOpportunityTypeFromUrl: vi.fn(() => "usTnCustodyLevelDowngrade"),
        });
        mockUseOpportunityConfigurations.mockReturnValue({
          usTnCustodyLevelDowngrade: {
            systemType: "INCARCERATION",
          },
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/custodyLevelDowngrade`);

        expect(
          useRootStore().workflowsRootStore.opportunityConfigurationStore
            .getOpportunityTypeFromUrl,
        ).toHaveBeenCalledWith("custodyLevelDowngrade");
        expect(
          useRootStore().workflowsStore.updateActiveSystem,
        ).toHaveBeenCalledWith("INCARCERATION");
      });

      it("updates selectedOpportunityType based on page", () => {
        mockStores(baseMockWorkflowsStore, {
          getOpportunityTypeFromUrl: vi.fn(() => "usTnCustodyLevelDowngrade"),
        });
        mockUseOpportunityConfigurations.mockReturnValue({
          usTnCustodyLevelDowngrade: {},
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/custodyLevelDowngrade`);

        expect(
          useRootStore().workflowsRootStore.opportunityConfigurationStore
            .getOpportunityTypeFromUrl,
        ).toHaveBeenCalledWith("custodyLevelDowngrade");
        expect(
          useRootStore().workflowsStore.updateSelectedOpportunityType,
        ).toHaveBeenCalledWith("usTnCustodyLevelDowngrade");
      });
    });

    describe("/workflows route", () => {
      it("updates activeSystem based on workflowsSupportedSystems", () => {
        mockStores(
          {
            ...baseMockWorkflowsStore,
            workflowsSupportedSystems: ["INCARCERATION"],
          },
          baseMockOppConfigStore,
        );
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(
          useRootStore().workflowsStore.updateActiveSystem,
        ).toHaveBeenCalledWith("INCARCERATION");
      });

      it("sets selectedOpportunityType to be undefined", () => {
        mockStores(baseMockWorkflowsStore, baseMockOppConfigStore);
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(
          useRootStore().workflowsStore.updateSelectedOpportunityType,
        ).toHaveBeenCalledWith(undefined);
      });

      it("redirects to the opportunity page if there is only 1 opp", async () => {
        mockUseOpportunityConfigurations.mockReturnValue({
          compliantReporting: {
            urlSection: "compliantReporting",
          } as any,
        } as any);
        mockStores(
          {
            ...baseMockWorkflowsStore,
            opportunityTypes: ["compliantReporting"],
          },
          baseMockOppConfigStore,
        );

        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(
          screen.getByText("Opportunity Caseload View"),
        ).toBeInTheDocument();
      });

      it("redirects to the homepage if there is more than 1 opp", async () => {
        mockStores(
          {
            ...baseMockWorkflowsStore,
            opportunityTypes: ["compliantReporting", "classificationReview"],
          },
          baseMockWorkflowsStore,
        );
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(screen.getByText("Workflows Homepage")).toBeInTheDocument();
      });
    });

    describe("Person profile route", () => {
      it("updates the selected person", () => {
        mockStores(
          {
            ...baseMockWorkflowsStore,
            opportunityTypes: ["compliantReporting"],
          },
          { getOpportunityTypeFromUrl: () => null },
        );
        renderRouter(`${WORKFLOWS_PATHS.workflows}/clients/p101`);
        expect(
          useRootStore().workflowsStore.updateSelectedPerson,
        ).toHaveBeenCalledWith("p101");
      });
    });
  });
});
