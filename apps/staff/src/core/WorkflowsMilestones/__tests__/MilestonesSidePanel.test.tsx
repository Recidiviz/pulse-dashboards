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
import { noop } from "lodash";
import { runInAction } from "mobx";
import { BrowserRouter } from "react-router-dom";
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { RootStore } from "../../../RootStore";
import { eligibleClient } from "../../../WorkflowsStore/__fixtures__";
import { Client } from "../../../WorkflowsStore/Client";
import { MilestonesSidePanel } from "../MilestonesSidePanel";

vi.mock("../../../WorkflowsStore/subscriptions");
vi.mock("firebase/firestore");
vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;

const baseRootStoreMock = {
  userStore: { userSurname: "Smith", userFullName: "Firstname Smith" },
  workflowsStore: {
    availableOfficers: [],
    updateSelectedPerson: () => null,
    formatSupervisionLevel: () => null,
    caseloadLoaded: () => false,
    justiceInvolvedPersonTitle: "client",
    allowSupervisionTasks: false,
  },
  firestoreStore: {
    doc: vi.fn(),
    collection: vi.fn(),
  },
};

describe("MilestonesSidePanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Quiet errors during test runs
    vi.spyOn(console, "error").mockImplementation(noop);
    useFeatureVariantsMock.mockReturnValue({});
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseRootStoreMock.workflowsStore,
        availableOfficers: [],
        selectedClient: new Client(
          eligibleClient,
          baseRootStoreMock as unknown as RootStore,
        ),
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("New Milestones", () => {
    test("renders with ComposeMessageView", () => {
      render(
        <BrowserRouter>
          <MilestonesSidePanel activeTab="New Milestones" />
        </BrowserRouter>,
      );
      expect(screen.getByTestId("ComposeMessageView")).toBeInTheDocument();
    });
  });

  test("Declined to Send", () => {
    render(
      <BrowserRouter>
        <MilestonesSidePanel activeTab="Declined to Send" />
      </BrowserRouter>,
    );
    expect(screen.getByTestId("DeclinedSidePanel")).toBeInTheDocument();
  });

  describe("Congratulated", () => {
    test("renders with text message preview", () => {
      runInAction(() => {
        useRootStoreMock().workflowsStore.selectedClient.milestonesMessageUpdatesSubscription =
          {
            data: {
              status: "IN_PROGRESS",
              message: "This is the full text message",
            },
            hydrated: true,
          };
      });
      render(
        <BrowserRouter>
          <MilestonesSidePanel activeTab="Congratulated" />
        </BrowserRouter>,
      );
      expect(screen.getByTestId("CongratulatedSidePanel")).toBeInTheDocument();
      expect(
        screen.getByText("This is the full text message"),
      ).toBeInTheDocument();
    });
  });

  test("renders without text message preview", () => {
    runInAction(() => {
      useRootStoreMock().workflowsStore.selectedClient.milestonesMessageUpdatesSubscription =
        {
          data: {
            status: "CONGRATULATED_ANOTHER_WAY",
          },
          hydrated: true,
        };
    });
    render(
      <BrowserRouter>
        <MilestonesSidePanel activeTab="Congratulated" />
      </BrowserRouter>,
    );
    expect(screen.getByTestId("CongratulatedSidePanel")).toBeInTheDocument();
    expect(
      screen.getByText("indicated that they congratulated", { exact: false }),
    ).toBeInTheDocument();
  });
});
