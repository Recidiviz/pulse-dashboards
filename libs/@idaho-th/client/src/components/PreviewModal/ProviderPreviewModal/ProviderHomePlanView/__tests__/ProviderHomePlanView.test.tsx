// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { ProviderHomePlanView } from "../ProviderHomePlanView";

const testDoubles = vi.hoisted(() => ({
  application: {
    subStage: "PROVIDER_REVIEW" as string,
  },
  homePlan: {
    data: undefined as
      | {
          permissions: {
            isSelectedProvider: boolean;
            canToggleReleaseTasks: boolean;
          };
          emptyTabMessage: string | null;
          approvals: null;
          releaseTasks: null;
        }
      | undefined,
    isLoading: false,
    isError: false,
  },
}));

vi.mock("../../../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: "app-1",
  }),
  useIdahoTHStore: () => ({
    housingApplicationsStore: {
      currentApplicationId: "app-1",
    },
  }),
}));

vi.mock("../../../../../hooks/useApplicationDetail", () => ({
  useProviderApplicationById: () => ({
    data: testDoubles.application,
  }),
}));

vi.mock("../../../../../hooks/housingApplication", () => ({
  useProviderHomePlan: () => testDoubles.homePlan,
  useToggleProviderHomePlanReleaseTask: () => ({ mutate: vi.fn() }),
  useUpdateProviderHomePlanReleaseTaskDetail: () => ({ mutate: vi.fn() }),
}));

vi.mock("../../../../assets/home.svg?react", () => ({
  default: () => <svg data-testid="home-icon" />,
}));

describe("ProviderHomePlanView", () => {
  beforeEach(() => {
    testDoubles.application = {
      subStage: APPLICATION_SUB_STAGE.PROVIDER_REVIEW,
    };
    testDoubles.homePlan = {
      data: {
        permissions: {
          isSelectedProvider: false,
          canToggleReleaseTasks: false,
        },
        emptyTabMessage:
          "This tab becomes active once you're selected as the Home Plan",
        approvals: null,
        releaseTasks: null,
      },
      isLoading: false,
      isError: false,
    };
  });

  it("shows the inactive empty-tab message when the provider is not the home plan", () => {
    render(<ProviderHomePlanView />);
    expect(
      screen.getByText(
        "This tab becomes active once you're selected as the Home Plan",
      ),
    ).toBeInTheDocument();
  });

  it("shows a load failure message when the home plan query errors", () => {
    testDoubles.application.subStage = APPLICATION_SUB_STAGE.SELECTED;
    testDoubles.homePlan = {
      data: undefined,
      isLoading: false,
      isError: true,
    };
    render(<ProviderHomePlanView />);
    expect(screen.getByText("Failed to load home plan")).toBeInTheDocument();
  });
});
