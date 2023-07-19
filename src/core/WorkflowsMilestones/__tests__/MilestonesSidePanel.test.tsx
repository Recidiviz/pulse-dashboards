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
import { runInAction } from "mobx";
import { BrowserRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { RootStore } from "../../../RootStore";
import { eligibleClient } from "../../../WorkflowsStore/__fixtures__";
import { Client } from "../../../WorkflowsStore/Client";
import { MilestonesSidePanel } from "../MilestonesSidePanel";

jest.mock("../../../WorkflowsStore/subscriptions");
jest.mock("firebase/firestore");
jest.mock("../../../assets/static/images/tealStar.svg", () => ({
  ReactComponent: () => {
    return <div />;
  },
}));
jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

const baseRootStoreMock = {
  userStore: { userFullName: "Officer name" },
  workflowsStore: {
    availableOfficers: [],
    updateSelectedPerson: () => null,
    formatSupervisionLevel: () => null,
    caseloadLoaded: () => false,
    justiceInvolvedPersonTitle: "client",
    allowSupervisionTasks: false,
    featureVariants: {
      responsiveRevamp: {},
    },
  },
  firestoreStore: {
    db: jest.fn(),
  },
};

describe("MilestonesSidePanel", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Quiet errors during test runs
    jest.spyOn(console, "error").mockImplementation();

    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseRootStoreMock.workflowsStore,
        availableOfficers: [],
        selectedClient: new Client(
          eligibleClient,
          baseRootStoreMock as unknown as RootStore
        ),
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders the NEW_MILESTONES side panel", () => {
    const container = render(
      <BrowserRouter>
        <MilestonesSidePanel activeTab="NEW_MILESTONES" />
      </BrowserRouter>
    );
    expect(container).toMatchSnapshot();
    expect(screen.getByTestId("ComposeMessageView")).toBeInTheDocument();
  });

  test("renders the DECLINED side panel", () => {
    const container = render(
      <BrowserRouter>
        <MilestonesSidePanel activeTab="DECLINED" />
      </BrowserRouter>
    );
    expect(container).toMatchSnapshot();
    expect(screen.getByTestId("DeclinedSidePanel")).toBeInTheDocument();
  });

  describe("renders the CONGRATULATED side panel", () => {
    test("renders with text message preview", () => {
      runInAction(() => {
        useRootStoreMock().workflowsStore.selectedClient.milestonesMessageUpdatesSubscription =
          {
            data: {
              status: "IN_PROGRESS",
              messageDetails: {
                message: "This is the full text message",
              },
            },
            hydrated: true,
          };
      });
      const container = render(
        <BrowserRouter>
          <MilestonesSidePanel activeTab="CONGRATULATED" />
        </BrowserRouter>
      );
      expect(container).toMatchSnapshot();
      expect(screen.getByTestId("CongratulatedSidePanel")).toBeInTheDocument();
      expect(
        screen.getByText("This is the full text message")
      ).toBeInTheDocument();
    });
  });

  test("renders without text message preview", () => {
    runInAction(() => {
      useRootStoreMock().workflowsStore.selectedClient.milestonesMessageUpdatesSubscription =
        {
          data: {
            status: "IN_PROGRESS",
          },
          hydrated: true,
        };
    });
    const container = render(
      <BrowserRouter>
        <MilestonesSidePanel activeTab="CONGRATULATED" />
      </BrowserRouter>
    );
    expect(container).toMatchSnapshot();
    expect(screen.getByTestId("CongratulatedSidePanel")).toBeInTheDocument();
    expect(
      screen.getByText("indicated that they congratulated", { exact: false })
    ).toBeInTheDocument();
  });
});
