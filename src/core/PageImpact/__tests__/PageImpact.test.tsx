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
import PageImpact from "..";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

describe("Impact Page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Quiet errors during test runs
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading indicator", () => {
    useRootStoreMock.mockReturnValue({
      impactStore: {
        hydrate: jest.fn(),
      },
      isHydrated: false,
    });

    render(
      <BrowserRouter>
        <PageImpact />
      </BrowserRouter>
    );

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  test("renders Impact page", () => {
    useRootStoreMock.mockReturnValue({
      impactStore: {
        usTnCompliantReportingWorkflowsImpact: {
          stateCode: "US_TN",
          supervisionDistrict: "10",
          districtName: "Test 10",
          variantId: "WORKFLOWS_LAUNCH",
          variantDate: "2022-04-11",
          startDate: "2022-04-01",
          endDate: "2022-05-01",
          monthsSinceTreatment: 0,
          avgDailyPopulation: 3927.9999999999995,
          avgPopulationLimitedSupervisionLevel: 106.69999999999999,
          useAvgDailyPopulationData: [{ months: 0, value: 3927.9999999999995 }],
        },
        isHydrated: true,
        page: "compliantReportingWorkflows",
      },
      workflowsStore: {
        featureVariants: {
          responsiveRevamp: true,
        },
      },
      userStore: {
        userAllowedNavigation: {
          compliantReportingWorkflows: ["avgDailyPopulation"],
        },
      },
      tenantStore: {
        currentTenantId: "US_TN",
      },
    });
    render(
      <BrowserRouter>
        <PageImpact />
      </BrowserRouter>
    );

    expect(
      screen.getByText("Compliant Reporting Workflows")
    ).toBeInTheDocument();
  });
});
