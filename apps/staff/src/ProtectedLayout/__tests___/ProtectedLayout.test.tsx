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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Mock } from "vitest";

import { useRootStore, useUserStore } from "../../components/StoreProvider";
import DashboardLayout from "../../core/DashboardLayout";
import LanternLayout from "../../lantern/LanternLayout";
import ProtectedLayout from "../ProtectedLayout";

vi.mock("../../components/StoreProvider");
vi.mock("../../core/DashboardLayout", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

vi.mock("../../lantern/LanternLayout", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

vi.mock("../../hooks/useAuth");

const mockUseUserStore = useUserStore as Mock;
const mockSaveTenantIdToQuery = vi.fn();
const mockUseRootStore = vi.mocked(useRootStore);

describe("ProtectedLayout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseUserStore.mockReturnValue({ userIsLoading: false });
    (DashboardLayout as Mock).mockReturnValue(<div>DashboardLayout</div>);
    (LanternLayout as Mock).mockReturnValue(<div>LanternLayout</div>);
    mockUseRootStore.mockReturnValue({
      analyticsStore: { page: vi.fn() },
      tenantStore: { saveTenantIdToQuery: mockSaveTenantIdToQuery },
    } as any);
  });

  it("renders Loading component when use is still loading", () => {
    mockUseUserStore.mockReturnValue({ userIsLoading: true });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  describe("DashboardLayout", () => {
    beforeEach(() => {
      mockUseUserStore.mockReturnValue({
        userIsLoading: false,
        userAllowedNavigation: { workflows: [] },
      });
    });

    it("renders the DashboardLayout on /", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("DashboardLayout")).toBeInTheDocument();
    });

    it("does not render the LanternLayout", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.queryByText("LanternLayout")).not.toBeInTheDocument();
    });

    it("renders the DashboardLayout on a different path", () => {
      mockUseUserStore.mockReturnValue({
        userIsLoading: false,
        userAllowedNavigation: { system: ["prison"] },
      });
      render(
        <MemoryRouter initialEntries={["/system"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("DashboardLayout")).toBeInTheDocument();
    });
  });

  describe("LanternLayout", () => {
    beforeEach(() => {
      mockUseUserStore.mockReturnValue({
        userAllowedNavigation: { revocations: [] },
      });
    });

    it("renders the LanternLayout on '/'", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("LanternLayout")).toBeInTheDocument();
    });

    it("renders the LanternLayout on '/community/revocations'", () => {
      render(
        <MemoryRouter initialEntries={["/community/revocations"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("LanternLayout")).toBeInTheDocument();
    });

    it("renders the LanternLayout on '/revocations'", () => {
      render(
        <MemoryRouter initialEntries={["/revocations"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("LanternLayout")).toBeInTheDocument();
    });

    it("does not render the DashboardLayout", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.queryByText("DashboardLayout")).not.toBeInTheDocument();
    });
  });

  describe("Save Tenant ID Query", () => {
    it("calls tenantStore.saveTenantIdToQuery", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(mockSaveTenantIdToQuery).toHaveBeenCalled();
    });
  });
});
