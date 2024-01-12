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
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import isIE11 from "../../../utils/isIE11";
import { WorkflowsStore } from "../../../WorkflowsStore";
import { CaseloadView } from "../../CaseloadView";
import { OpportunityCaseloadView } from "../../OpportunityCaseloadView";
import { WORKFLOWS_PATHS } from "../../views";
import WorkflowsHomepage from "../../WorkflowsHomepage";
import { FullProfile } from "../../WorkflowsJusticeInvolvedPersonProfile";
import { WorkflowsFormLayout } from "../../WorkflowsLayouts";
import WorkflowsMilestones from "../../WorkflowsMilestones";
import { WorkflowsTasks } from "../../WorkflowsTasks/WorkflowsTasks";
import PageWorkflows from "../PageWorkflows";

jest.mock("../../CoreStoreProvider");
jest.mock("../../../utils/isIE11");
jest.mock("../../../WorkflowsStore");
jest.mock("../../../components/StoreProvider");
jest.mock("../../WorkflowsHomepage", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock("../../WorkflowsMilestones/WorkflowsMilestones", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock("../../CaseloadView", () => {
  return {
    __esModule: true,
    CaseloadView: jest.fn(),
  };
});

jest.mock("../../WorkflowsJusticeInvolvedPersonProfile/FullProfile", () => {
  return {
    __esModule: true,
    FullProfile: jest.fn(),
  };
});

jest.mock("../../WorkflowsTasks/WorkflowsTasks", () => {
  return {
    __esModule: true,
    WorkflowsTasks: jest.fn(),
  };
});

jest.mock("../../OpportunityCaseloadView", () => {
  return {
    __esModule: true,
    OpportunityCaseloadView: jest.fn(),
  };
});

jest.mock("../../WorkflowsLayouts", () => {
  return {
    __esModule: true,
    WorkflowsFormLayout: jest.fn(),
  };
});

const mockUseRootStore = useRootStore as jest.Mock;

function mockWorkflowsStore(mockStore: any) {
  mockUseRootStore.mockReturnValue({
    workflowsStore: mockStore as WorkflowsStore,
    currentTenantId: "US_TN",
  });
}

function renderRouter(relativePath?: string) {
  render(
    <MemoryRouter initialEntries={[relativePath ?? "/"]}>
      <Routes>
        <Route path="/workflows/*" element={<PageWorkflows />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PageWorkflows", () => {
  let baseMockWorkflowsStore: any;
  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkflowsStore({
      hydrate: jest.fn().mockReturnValue(jest.fn()),
      hydrationState: { status: "needs hydration" },
    });
  });

  describe("IE11", () => {
    it("attempts to hydrate the workflows models when not on IE11", () => {
      (isIE11 as jest.Mock).mockReturnValue(false);
      render(<PageWorkflows />);
      expect(useRootStore().workflowsStore.hydrate).toHaveBeenCalledTimes(1);
    });

    it("does not attempt to hydrate the workflows models when on IE11", () => {
      (isIE11 as jest.Mock).mockReturnValue(true);
      render(<PageWorkflows />);
      expect(useRootStore().workflowsStore.hydrate).toHaveBeenCalledTimes(0);
    });
  });

  describe("WorkflowsRoute without redirects", () => {
    beforeEach(() => {
      (isIE11 as jest.Mock).mockReturnValue(false);
      (useFeatureVariants as jest.Mock).mockReturnValue({
        responsiveRevamp: true,
      });
      baseMockWorkflowsStore = {
        hydrationState: { status: "hydrated" },
        opportunityTypes: [],
        workflowsSupportedSystems: ["SUPERVISION"],
        setActivePage: jest.fn(),
        updateActiveSystem: jest.fn(),
        updateSelectedOpportunityType: jest.fn(),
        updateSelectedPerson: jest
          .fn()
          .mockImplementation(() => ({ catch: jest.fn() })),
        activeSystem: "SUPERVISION",
      };
      (WorkflowsHomepage as jest.Mock).mockReturnValue(
        <div>Workflows Homepage</div>
      );
      (WorkflowsFormLayout as jest.Mock).mockReturnValue(
        <div>Opportunity Action Page</div>
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("renders the homepage for route /home", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "home",
      });

      renderRouter(WORKFLOWS_PATHS.home);

      expect(screen.getByText("Workflows Homepage")).toBeInTheDocument();
    });

    it("renders the milestones page for route /milestones", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "milestones",
      });
      (WorkflowsMilestones as jest.Mock).mockReturnValue(
        <div>Workflows Milestones Page</div>
      );
      renderRouter(WORKFLOWS_PATHS.milestones);
      expect(screen.getByText("Workflows Milestones Page")).toBeInTheDocument();
    });

    it("renders the client profile page for route /clientProfile", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "clientProfile",
      });

      (FullProfile as jest.Mock).mockReturnValue(<div>Client FullProfile</div>);
      renderRouter(`${WORKFLOWS_PATHS.caseloadClients}/101`);

      expect(screen.getByText("Client FullProfile")).toBeInTheDocument();
    });

    it("renders the client profile page for route /residentProfile", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "residentProfile",
      });
      (FullProfile as jest.Mock).mockReturnValue(
        <div>Resident FullProfile</div>
      );
      renderRouter(`${WORKFLOWS_PATHS.caseloadResidents}/101`);

      expect(screen.getByText("Resident FullProfile")).toBeInTheDocument();
    });

    it("renders the caseload route /clients", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "caseloadClients",
      });
      (CaseloadView as jest.Mock).mockReturnValue(
        <div>Client CaseloadView</div>
      );
      renderRouter(WORKFLOWS_PATHS.caseloadClients);

      expect(screen.getByText("Client CaseloadView")).toBeInTheDocument();
    });

    it("renders the caseload route /residents", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "caseloadResidents",
      });
      (CaseloadView as jest.Mock).mockReturnValue(
        <div>Resident CaseloadView</div>
      );
      renderRouter(WORKFLOWS_PATHS.caseloadResidents);

      expect(screen.getByText("Resident CaseloadView")).toBeInTheDocument();
    });

    it("renders the tasks page for route /tasks", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "tasks",
      });
      (WorkflowsTasks as jest.Mock).mockReturnValue(<div>Tasks</div>);
      renderRouter(WORKFLOWS_PATHS.tasks);

      expect(screen.getByText("Tasks")).toBeInTheDocument();
    });

    it("renders the opportunity page for route /opportunityClients", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "opportunityClients",
      });
      (OpportunityCaseloadView as jest.Mock).mockReturnValue(
        <div>Opportunity Caseload View</div>
      );

      renderRouter(`${WORKFLOWS_PATHS.workflows}/compliantReporting`);

      expect(screen.getByText("Opportunity Caseload View")).toBeInTheDocument();
    });

    it("renders the opportunity action page for route /opportunityAction", () => {
      mockWorkflowsStore({
        ...baseMockWorkflowsStore,
        activePage: "opportunityAction",
      });

      renderRouter(`${WORKFLOWS_PATHS.workflows}/compliantReporting/101`);

      expect(screen.getByText("Opportunity Action Page")).toBeInTheDocument();
    });
  });

  describe("WorkflowsRoute logic and redirects", () => {
    beforeEach(() => {
      (isIE11 as jest.Mock).mockReturnValue(false);
      (useFeatureVariants as jest.Mock).mockReturnValue({
        responsiveRevamp: true,
      });
      baseMockWorkflowsStore = {
        hydrationState: { status: "hydrated" },
        homepage: "home",
        workflowsSupportedSystems: ["INCARCERATION", "SUPERVISION"],
        opportunityTypes: [],
        setActivePage: jest.fn(),
        updateActiveSystem: jest.fn(),
        updateSelectedOpportunityType: jest.fn(),
        updateSelectedPerson: jest
          .fn()
          .mockImplementation(() => ({ catch: jest.fn() })),
      };
      (WorkflowsTasks as jest.Mock).mockReturnValue(<div>Tasks Page</div>);
      (OpportunityCaseloadView as jest.Mock).mockReturnValue(
        <div>Opportunity Caseload View</div>
      );
      (WorkflowsHomepage as jest.Mock).mockReturnValue(
        <div>Workflows Homepage</div>
      );
      (FullProfile as jest.Mock).mockReturnValue(<div>Full profile</div>);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("/workflows/tasks", () => {
      it("updates activeSystem based on page", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
        });
        renderRouter(WORKFLOWS_PATHS.tasks);

        expect(
          useRootStore().workflowsStore.updateActiveSystem
        ).toHaveBeenCalledWith("SUPERVISION");
      });
    });

    describe("/workflows/:opportunityTypeUrl route", () => {
      it("updates activeSystem based on page for SUPERVISION", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/compliantReporting`);

        expect(
          useRootStore().workflowsStore.updateActiveSystem
        ).toHaveBeenCalledWith("SUPERVISION");
      });

      it("updates activeSystem based on page for INCARCERATION", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/custodyLevelDowngrade`);

        expect(
          useRootStore().workflowsStore.updateActiveSystem
        ).toHaveBeenCalledWith("INCARCERATION");
      });

      it("updates selectedOpportunityType based on page", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/custodyLevelDowngrade`);

        expect(
          useRootStore().workflowsStore.updateSelectedOpportunityType
        ).toHaveBeenCalledWith("usTnCustodyLevelDowngrade");
      });
    });

    describe("/workflows route", () => {
      it("updates activeSystem based on workflowsSupportedSystems", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
          workflowsSupportedSystems: ["INCARCERATION"],
        });
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(
          useRootStore().workflowsStore.updateActiveSystem
        ).toHaveBeenCalledWith("INCARCERATION");
      });

      it("sets selectedOpportunityType to be undefined", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
        });
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(
          useRootStore().workflowsStore.updateSelectedOpportunityType
        ).toHaveBeenCalledWith(undefined);
      });

      it("redirects to the opportunity page if there is only 1 opp", async () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
          opportunityTypes: ["compliantReporting"],
        });
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(
          screen.getByText("Opportunity Caseload View")
        ).toBeInTheDocument();
      });

      it("redirects to the homepage if there is more than 1 opp", async () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
          opportunityTypes: ["compliantReporting", "classificationReview"],
        });
        renderRouter(WORKFLOWS_PATHS.workflows);
        expect(screen.getByText("Workflows Homepage")).toBeInTheDocument();
      });
    });

    describe("Person profile route", () => {
      it("updates the selected person", () => {
        mockWorkflowsStore({
          ...baseMockWorkflowsStore,
          opportunityTypes: ["compliantReporting"],
        });
        renderRouter(`${WORKFLOWS_PATHS.workflows}/clients/p101`);
        expect(
          useRootStore().workflowsStore.updateSelectedPerson
        ).toHaveBeenCalledWith("p101");
      });
    });
  });
});
