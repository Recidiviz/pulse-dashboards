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
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import mockWithTestId from "../../../__helpers__/mockWithTestId";
import IE11Banner from "../../components/IE11Banner";
import NotFound from "../../components/NotFound";
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { UserAvatar } from "../Avatar";
import DashboardLayout from "../DashboardLayout";
import PageImpact from "../PageImpact";
import PageMethodology from "../PageMethodology";
import PageOutliers from "../PageOutliers";
import PageSystem from "../PageSystem";
import PageVitals from "../PageVitals";
import PageWorkflows from "../PageWorkflows";
import { DASHBOARD_PATHS, DASHBOARD_VIEWS } from "../views";

jest.mock("../../hooks/useIntercom");
jest.mock("mobx-react-lite", () => {
  return {
    observer: (component: any) => component,
  };
});
jest.mock("../../OutliersStore/presenters/SwarmPresenter/getSwarmLayoutWorker");
jest.mock("../../components/StoreProvider");
jest.mock("../Avatar");
jest.mock("../../components/IE11Banner");
jest.mock("../PageSystem");
jest.mock("../PageVitals");
jest.mock("../PageWorkflows");
jest.mock("../PageOutliers", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});
jest.mock("../PageImpact");
jest.mock("../PageMethodology");
jest.mock("../../components/NotFound");

const mockUseFeatureVariants = useFeatureVariants as jest.Mock;
const mockUseRootStore = useRootStore as jest.Mock;

describe("DashboardLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureVariants.mockReturnValue({ responsiveRevamp: true });
    (UserAvatar as jest.Mock).mockReturnValue(null);
    (IE11Banner as jest.Mock).mockReturnValue(null);
    (PageSystem as jest.Mock).mockReturnValue(mockWithTestId("page-system-id"));
    (PageImpact as jest.Mock).mockReturnValue(mockWithTestId("page-impact-id"));
    (PageWorkflows as jest.Mock).mockReturnValue(
      mockWithTestId("page-workflows-id")
    );
    (PageVitals as jest.Mock).mockReturnValue(
      mockWithTestId("page-operations-id")
    );
    (PageOutliers as jest.Mock).mockReturnValue(
      mockWithTestId("page-outliers-id")
    );
    (PageMethodology as jest.Mock).mockReturnValue(
      mockWithTestId("page-methodology-id")
    );
    (NotFound as jest.Mock).mockReturnValue(mockWithTestId("not-found-id"));
  });

  const renderLayout = (route: string) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe("PageSystem", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render PageSystem for a user with a system prison page", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { system: ["prison"] } },
        currentTenantId: "US_ID",
      });
      renderLayout(DASHBOARD_PATHS.system);

      expect(screen.getByTestId("page-system-id")).toBeInTheDocument();
    });
  });

  describe("PageImpact", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should render Impact page when currentTenantId is authorized", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { impact: [] } },
        currentTenantId: "US_TN",
      });
      renderLayout(`/${DASHBOARD_VIEWS.impact}`);

      expect(screen.getByTestId("page-impact-id")).toBeInTheDocument();
    });

    it("should not render Impact when currentTenantId is not authorized", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { revocations: [] } },
        currentTenantId: "US_PA",
      });
      renderLayout(`/${DASHBOARD_VIEWS.impact}`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });
  });

  describe("PageVitals", () => {
    beforeEach(() => {
      jest.clearAllMocks();
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
      jest.clearAllMocks();
    });
    it("should render the system methodology page", () => {
      mockUseRootStore.mockReturnValue({
        userStore: { userAllowedNavigation: { "id-methodology": ["system"] } },
        currentTenantId: "US_ID",
      });
      renderLayout(`/${DASHBOARD_VIEWS.methodology}/system`);

      expect(screen.getByTestId("page-methodology-id")).toBeInTheDocument();
    });

    it("should render the system methodology page for Operations", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { "id-methodology": ["operations"] },
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

  describe("PageOutliers", () => {
    it("renders if the tenant and user allow it", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { insights: ["supervision"] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`${DASHBOARD_PATHS.outliers}/supervision`);

      expect(screen.getByTestId("page-outliers-id")).toBeInTheDocument();
    });

    it("doesn't render if the tenant doesn't allow it but the user does", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { insights: ["supervision"] },
        },
        currentTenantId: "US_XX",
      });

      renderLayout(`${DASHBOARD_PATHS.outliers}/supervision`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });

    it("doesn't render if the user doesn't allow it but the tenant does", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { workflows: [] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`${DASHBOARD_PATHS.outliers}/supervision`);

      expect(screen.getByTestId("not-found-id")).toBeInTheDocument();
    });

    it("redirects /insights to /insights/supervision", () => {
      mockUseRootStore.mockReturnValue({
        userStore: {
          userAllowedNavigation: { insights: ["supervision"] },
        },
        currentTenantId: "US_TN",
      });

      renderLayout(`${DASHBOARD_PATHS.outliers}`);

      expect(screen.getByTestId("page-outliers-id")).toBeInTheDocument();
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
