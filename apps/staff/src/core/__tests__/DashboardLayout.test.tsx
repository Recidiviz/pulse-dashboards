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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Mock } from "vitest";

import mockWithTestId from "../../../__helpers__/mockWithTestId";
import IE11Banner from "../../components/IE11Banner";
import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { UserAvatar } from "../Avatar";
import DashboardLayout from "../DashboardLayout";
import PageInsights from "../PageInsights";
import PageMethodology from "../PageMethodology";
import PageSystem from "../PageSystem";
import PageVitals from "../PageVitals";
import PageWorkflows from "../PageWorkflows";
import { DASHBOARD_PATHS, DASHBOARD_VIEWS } from "../views";

vi.mock("../../hooks/useIntercom");
vi.mock("mobx-react-lite", () => {
  return {
    observer: (component: any) => component,
  };
});
vi.mock("../../InsightsStore/presenters/SwarmPresenter/getSwarmLayoutWorker");
vi.mock("../../components/StoreProvider", () => ({ useRootStore: vi.fn() }));
vi.mock("../Avatar");
vi.mock("../../components/IE11Banner");
vi.mock("../PageSystem");
vi.mock("../PageVitals");
vi.mock("../PageWorkflows");
vi.mock("../PageInsights", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});
vi.mock("../PageMethodology");
vi.mock("../../components/NotFound");

const mockUseRootStore = useRootStore as Mock;

describe("DashboardLayout", () => {
  beforeEach(() => {
    (UserAvatar as Mock).mockReturnValue(null);
    (IE11Banner as Mock).mockReturnValue(null);
    (PageSystem as Mock).mockReturnValue(mockWithTestId("page-system-id"));
    (PageWorkflows as Mock).mockReturnValue(
      mockWithTestId("page-workflows-id"),
    );
    (PageVitals as Mock).mockReturnValue(mockWithTestId("page-operations-id"));
    (PageInsights as Mock).mockReturnValue(mockWithTestId("page-insights-id"));
    (PageMethodology as Mock).mockReturnValue(
      mockWithTestId("page-methodology-id"),
    );
    (NotFound as Mock).mockReturnValue(mockWithTestId("not-found-id"));
  });

  const renderLayout = (route: string) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  describe("PageSystem", () => {
    it("should render PageSystem for a user with a system prison page", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { system: ["prison"] } },
        currentTenantId: "US_ID",
      });
      renderLayout(DASHBOARD_PATHS.system);

      expect(screen.getByTestId("page-system-id")).toBeInTheDocument();
    });
  });

  describe("PageVitals", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    it("should render operations page when currentTenantId is authorized", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { operations: [] } },
        currentTenantId: "US_ID",
      });
      renderLayout(`/${DASHBOARD_VIEWS.operations}`);

      expect(screen.getByTestId("page-operations-id")).toBeInTheDocument();
    });

    it("should not render operations when currentTenantId is not authorized", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { revocations: [] } },
        currentTenantId: "US_PA",
      });
      renderLayout(`/${DASHBOARD_VIEWS.operations}`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });
  });

  describe("PageMethodology", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    it("should render the system methodology page", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { methodology: ["system"] } },
        currentTenantId: "US_ID",
      });
      renderLayout(`/${DASHBOARD_VIEWS.methodology}/system`);

      expect(screen.getByTestId("page-methodology-id")).toBeInTheDocument();
    });

    it("should render the system methodology page for Operations", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { methodology: ["operations"] },
        },
        currentTenantId: "US_ID",
      });
      renderLayout(`/${DASHBOARD_VIEWS.methodology}/operations`);

      expect(screen.getByTestId("page-methodology-id")).toBeInTheDocument();
    });

    it("should not render the system methodology if not allowed in nav", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { workflows: [] },
        },
        currentTenantId: "US_ID",
      });
      renderLayout(`/${DASHBOARD_VIEWS.methodology}/operations`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });
  });

  describe("PageInsights", () => {
    it("renders if the tenant and user allow it", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { insights: ["supervision"] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`${DASHBOARD_PATHS.insights}/supervision`);

      expect(screen.getByTestId("page-insights-id")).toBeInTheDocument();
    });

    it("doesn't render if the tenant doesn't allow it but the user does", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { insights: ["supervision"] },
        },
        currentTenantId: "US_XX",
      });

      renderLayout(`${DASHBOARD_PATHS.insights}/supervision`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });

    it("doesn't render if the user doesn't allow it but the tenant does", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { workflows: [] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`${DASHBOARD_PATHS.insights}/supervision`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });

    it("redirects /insights to /insights/supervision", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { insights: ["supervision"] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`${DASHBOARD_PATHS.insights}`);

      expect(screen.getByTestId("page-insights-id")).toBeInTheDocument();
    });
  });

  describe("PageWorkflows", () => {
    it("renders if the tenant and user allow it", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { workflows: ["home"] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`/${DASHBOARD_VIEWS.workflows}/home`);

      expect(screen.getByTestId("page-workflows-id")).toBeInTheDocument();
    });

    it("doesn't render if the tenant doesn't allow it but the user does", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { workflows: [] },
        },
        currentTenantId: "US_XX",
      });

      renderLayout(`/${DASHBOARD_VIEWS.workflows}/home`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });

    it("doesn't render if the user doesn't allow it but the tenant does", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { system: ["prison"] },
        },
        currentTenantId: "US_ID",
      });

      renderLayout(`/${DASHBOARD_VIEWS.workflows}/home`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });
  });
});
