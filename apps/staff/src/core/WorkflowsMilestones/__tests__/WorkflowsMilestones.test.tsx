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

import { render, screen } from "@testing-library/react";
import { noop } from "lodash";
import { BrowserRouter } from "react-router-dom";
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { RootStore } from "../../../RootStore";
import { mockIneligibleClient } from "../../../WorkflowsStore/__fixtures__";
import { Client } from "../../../WorkflowsStore/Client";
import WorkflowsMilestones from "..";

vi.mock("firebase/firestore");
vi.mock("../../../components/StoreProvider");
vi.mock("../../CaseloadSelect", () => ({
  CaseloadSelect: () => {
    return <div data-testid="caseload-select" />;
  },
}));

const useRootStoreMock = useRootStore as Mock;

const mockGetMilestonesClientsByStatus = (mockClients: Client[]) => {
  return () => mockClients;
};

const baseRootStoreMock = {
  firestoreStore: {
    doc: vi.fn(),
    collection: vi.fn(),
  },
  insightsStore: {
    shouldUseSupervisorHomepageUI: vi.fn(),
  },
  workflowsRootStore: {
    opportunityConfigurationStore: {
      isHydrated: true,
    },
  },
};
const baseWorkflowsStoreMock = {
  caseloadLoaded: () => false,
  justiceInvolvedPersonTitle: "client",
  milestonesClients: [],
  workflowsStore: {
    allowSupervisionTasks: false,
  },
  getMilestonesClientsByStatus: () => [],
};

describe("WorkflowsMilestones", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Quiet errors during test runs
    vi.spyOn(console, "error").mockImplementation(noop);
    vi.mocked(useFeatureVariants).mockReturnValue({
      supervisorHomepage: undefined,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("renders initial state", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        selectedSearchIds: [],
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsMilestones />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Congratulate your clients on their progress"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Send a text message to celebrate your clients' milestones. This list will refresh every month.",
      ),
    ).toBeInTheDocument();
  });

  test("renders loading state", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        selectedSearchIds: ["OFFICER1"],
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsMilestones />
      </BrowserRouter>,
    );

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  test("render no results", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        selectedSearchIds: ["OFFICER1"],
        caseloadLoaded: () => true,
        caseloadPersons: [],
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsMilestones />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "None of the selected caseloads have milestones to display. Search for another caseload.",
      ),
    ).toBeInTheDocument();
  });

  test("render results with milestones", () => {
    // the mock clients don't need a milestones field because
    // we're overriding getMilestonesClientsByStatus anyway
    const client1 = {
      ...mockIneligibleClient,
      personName: { surname: "Client1" },
    };
    const client2 = {
      ...mockIneligibleClient,
      personName: { surname: "Client2" },
    };

    const clients = [client1, client2].map(
      (client) =>
        new Client(client, {
          ...baseRootStoreMock,
          workflowsStore: baseWorkflowsStoreMock,
        } as unknown as RootStore),
    );
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        selectedSearchIds: [client1.officerId],
        caseloadLoaded: () => true,
        caseloadPersons: clients,
        getMilestonesClientsByStatus: mockGetMilestonesClientsByStatus(clients),
        milestonesClients: clients,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsMilestones />
      </BrowserRouter>,
    );
    expect(screen.getByText("Client1")).toBeInTheDocument();
    expect(screen.getByText("Client2")).toBeInTheDocument();
  });
});
