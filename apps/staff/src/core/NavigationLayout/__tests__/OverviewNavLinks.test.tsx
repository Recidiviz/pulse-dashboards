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

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useQueryParams } from "use-query-params";
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
  useUserStore,
} from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import RootStore from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore/TenantStore";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import VitalsStore from "../../CoreStore/VitalsStore";
import { useCoreStore } from "../../CoreStoreProvider";
import { OverviewNavLinks } from "..";

vi.mock("use-query-params");
vi.mock("../../CoreStoreProvider");
vi.mock("../../../components/StoreProvider");
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useLocation: vi.fn(),
}));
vi.mock("../../../hooks/useIsMobile");

let coreStore: CoreStore;
let vitalsStore: VitalsStore;
let filtersStore: FiltersStore;
let tenantStore: TenantStore;
let rootStoreMock: any;
let coreStoreMock: any;

const useRootStoreMock = useRootStore as Mock;
const useCoreStoreMock = useCoreStore as Mock;
const useUserStoreMock = useUserStore as Mock;
const useQueryParamsMock = useQueryParams as Mock;
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);

describe("OverviewNavLinks tests", () => {
  const renderLinks = () => {
    return render(
      <MemoryRouter>
        <OverviewNavLinks />
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    // @ts-expect-error
    vi.mocked(useLocation).mockReturnValue({
      pathname: "/insights",
    });
    vi.mocked(useIsMobile).mockReturnValue(false);
    useFeatureVariantsMock.mockReturnValue({});

    coreStore = new CoreStore(RootStore);
    vitalsStore = coreStore.vitalsStore;
    filtersStore = coreStore.filtersStore;
    tenantStore = coreStore.tenantStore;
    rootStoreMock = {
      userStore: {
        userAllowedNavigation: {
          insights: [],
          workflows: ["page1"],
        },
      },
      workflowsStore: { isSupervisionTasksConfigured: false },
      currentTenantId: "US_ID",
    };

    useRootStoreMock.mockReturnValue(rootStoreMock);

    coreStoreMock = {
      page: "page1",
      vitalsStore,
      setSection: vi.fn(),
      setPage: vi.fn(),
      filtersStore,
      tenantStore,
    };
    useCoreStoreMock.mockReturnValue(coreStoreMock);
    useUserStoreMock.mockReturnValue({
      user: {
        name: "Test",
      },
    });
    useQueryParamsMock.mockReturnValue(["query", vi.fn()]);
  });

  it("Should render a link for each page option", async () => {
    renderLinks();

    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(1),
    );
  });

  it("Should render a link for insights if enabled", async () => {
    rootStoreMock.userStore.userAllowedNavigation.insights = ["page1"];
    renderLinks();

    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(2),
    );
  });

  it("Should render a link for Tasks page if enabled", async () => {
    rootStoreMock.workflowsStore.isSupervisionTasksLinkEnabled = true;
    renderLinks();

    await waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: "Tasks" }),
      ).toBeInTheDocument(),
    );
  });

  it("Should not render a link for Tasks page if user doesn't have workflows permissions", () => {
    rootStoreMock.workflowsStore.isSupervisionTasksConfigured = true;
    delete rootStoreMock.userStore.userAllowedNavigation.workflows;
    renderLinks();
    expect(screen.queryByText("Tasks")).not.toBeInTheDocument();
  });

  it("Should render a link for Clients page if enabled", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = ["SUPERVISION"];
    rootStoreMock.userStore.userAllowedNavigation = { workflows: ["clients"] };
    renderLinks();

    await waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: "Clients" }),
      ).toBeInTheDocument(),
    );
  });

  it("Does not render a link for Clients page if user cannot see it", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = ["SUPERVISION"];
    rootStoreMock.userStore.userAllowedNavigation = { workflows: [] };
    renderLinks();

    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
  });

  it("Does not render a link for Residents page if user cannot see it", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = ["INCARCERATION"];
    rootStoreMock.userStore.userAllowedNavigation = {
      workflows: [],
    };
    renderLinks();

    expect(screen.queryByText("Residents")).not.toBeInTheDocument();
  });

  it("Does not render a link for Clients or Residents page if not enabled on tenant", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = [];
    rootStoreMock.userStore.userAllowedNavigation = {
      workflows: ["residents", "clients"],
    };
    renderLinks();

    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
    expect(screen.queryByText("Residents")).not.toBeInTheDocument();
  });

  it("Should not render a link for Residents or Clients page if supportsMultipleSystems enabled on mobile", async () => {
    vi.mocked(useIsMobile).mockReturnValue({ isMobile: true });
    rootStoreMock.workflowsStore.workflowsSupportedSystems = [
      "INCARCERATION",
      "SUPERVISION",
    ];
    rootStoreMock.workflowsStore.supportsMultipleSystems = true;
    rootStoreMock.userStore.userAllowedNavigation = {
      workflows: ["clients", "residents"],
    };
    renderLinks();

    await waitFor(() =>
      expect(screen.getAllByRole("menuitem")).toHaveLength(1),
    );
  });

  it("Should render a link for Residents and Clients page if not on mobile", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = [
      "INCARCERATION",
      "SUPERVISION",
    ];
    rootStoreMock.workflowsStore.supportsMultipleSystems = true;
    rootStoreMock.userStore.userAllowedNavigation = {
      workflows: ["clients", "residents"],
    };
    renderLinks();

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Residents" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Clients" }),
      ).toBeInTheDocument();
    });
  });

  it("Renders all workflows links when hideWorkflowsOpportunities is not set", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = [
      "INCARCERATION",
      "SUPERVISION",
    ];
    rootStoreMock.workflowsStore.supportsMultipleSystems = true;
    rootStoreMock.userStore.userAllowedNavigation = {
      workflows: ["clients", "residents"],
    };

    renderLinks();

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Residents" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Clients" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: "Opportunities" }),
      ).toBeInTheDocument();
    });
  });

  it("Does not render a link for opportunities if hideWorkflowsOpportunities is set", async () => {
    rootStoreMock.workflowsStore.workflowsSupportedSystems = [
      "INCARCERATION",
      "SUPERVISION",
    ];
    rootStoreMock.workflowsStore.supportsMultipleSystems = true;
    useFeatureVariantsMock.mockReturnValue({ hideWorkflowsOpportunities: {} });
    rootStoreMock.userStore.userAllowedNavigation = {
      workflows: ["clients", "residents"],
    };

    renderLinks();

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Residents" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Clients" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: "Opportunities" }),
      ).not.toBeInTheDocument();
    });
  });
});
