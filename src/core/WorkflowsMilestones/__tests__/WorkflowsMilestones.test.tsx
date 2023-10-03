// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { BrowserRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { RootStore } from "../../../RootStore";
import {
  eligibleClient,
  ineligibleClient,
} from "../../../WorkflowsStore/__fixtures__";
import { Client } from "../../../WorkflowsStore/Client";
import WorkflowsMilestones from "..";

jest.mock("firebase/firestore");
jest.mock("../../../components/StoreProvider");
jest.mock("../../CaseloadSelect", () => ({
  CaseloadSelect: () => {
    return <div data-testid="caseload-select" />;
  },
}));

const useRootStoreMock = useRootStore as jest.Mock;

const mockGetMilestonesClientsByStatus = (mockClients: Client[]) => {
  return () => mockClients;
};

const baseRootStoreMock = {
  firestoreStore: {
    db: jest.fn(),
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
  featureVariants: {
    responsiveRevamp: {},
  },
};

describe("WorkflowsMilestones", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Quiet errors during test runs
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      </BrowserRouter>
    );

    expect(
      screen.getByText("Congratulate your clients on their progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Send a text message to celebrate your clients' milestones. This list will refresh every month."
      )
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
      </BrowserRouter>
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
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        "None of the selected caseloads have milestones to display. Search for another caseload."
      )
    ).toBeInTheDocument();
  });

  test("render results with milestones", () => {
    const clients = [eligibleClient, ineligibleClient].map(
      (client) =>
        new Client(client, {
          ...baseRootStoreMock,
          workflowsStore: baseWorkflowsStoreMock,
        } as unknown as RootStore)
    );
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        selectedSearchIds: ["OFFICER1"],
        caseloadLoaded: () => true,
        caseloadPersons: clients,
        getMilestonesClientsByStatus: mockGetMilestonesClientsByStatus(clients),
        milestonesClients: clients,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsMilestones />
      </BrowserRouter>
    );
    // Clients with milestones
    expect(screen.getByText("Tonye Thompson")).toBeInTheDocument();
    expect(screen.getByText("Linet Hansen")).toBeInTheDocument();
  });
});
