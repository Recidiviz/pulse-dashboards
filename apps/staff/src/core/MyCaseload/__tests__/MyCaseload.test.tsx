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
import { axe } from "jest-axe";
import { BrowserRouter } from "react-router-dom";
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
  useUserStore,
} from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import MyCaseload from "..";

vi.mock("../../../components/StoreProvider");
vi.mock("../../CoreStoreProvider");
vi.mock("../../../hooks/useIsMobile");

const useRootStoreMock = useRootStore as Mock;
const useUserStoreMock = useUserStore as Mock;
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);

describe("MyCaseload", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    useFeatureVariantsMock.mockReturnValue({ usMoMyCaseload: {} });
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        activePageIsTasks: false,
        workflowsSupportedSystems: ["SUPERVISION"],
        supportsMultipleSystems: false,
        homepage: "home",
        homepageNameOverride: undefined,
        activeSystem: "SUPERVISION",
        isSupervisionTasksLinkEnabled: false,
        updateActiveSystem: vi.fn(),
      },
      tenantStore: {
        workflowsMethodologyUrl: "https://example.com/methodology",
        tasksConfiguration: undefined,
        directorDashboardConfig: undefined,
      },
      userStore: {
        userAllowedNavigation: { workflows: ["home"] },
      },
    });
    useUserStoreMock.mockReturnValue({ user: { name: "Test" } });
  });

  it("renders the My Caseload heading", () => {
    render(
      <BrowserRouter>
        <MyCaseload />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "My Caseload" }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle copy", () => {
    render(
      <BrowserRouter>
        <MyCaseload />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        /Use this list of clients to plan your week and prepare for upcoming touchpoints\./,
      ),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <MyCaseload />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "My Caseload" }),
    ).toBeInTheDocument();

    const results = await axe(container, { elementRef: true });
    expect(results).toHaveNoViolations();
  });
});
