// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { WORKFLOWS_PATH_SECTIONS } from "../../views";
import WorkflowsRoute, {
  parseLocation,
  RouterLocation,
} from "../WorkflowsRoute";

vi.mock("../../../components/StoreProvider");

describe("parseLocation", () => {
  test.each(WORKFLOWS_PATH_SECTIONS.map((s) => [s]))(
    "/workflows/%s",
    (page) => {
      const location = { pathname: `/workflows/${page}` } as RouterLocation;
      expect(parseLocation(location)).toStrictEqual({
        page,
        personId: undefined,
        opportunityPseudoId: undefined,
      });
    },
  );

  test("/workflows leads to undefined page", () => {
    const location = {
      pathname: `/workflows`,
    } as RouterLocation;
    expect(parseLocation(location)).toStrictEqual({
      page: undefined,
      personId: undefined,
      opportunityPseudoId: undefined,
    });
  });

  test("/workflows/opportunityType with person and opportunity ID", () => {
    const page = "opportunityType";
    const personId = "person123";
    const opportunityPseudoId = "opportunity456";

    const location = {
      pathname: `/workflows/${page}/${personId}/${opportunityPseudoId}`,
    } as RouterLocation;
    expect(parseLocation(location)).toStrictEqual({
      page,
      personId,
      opportunityPseudoId,
    });
  });

  test.each(["residents", "clients"])(
    "/workflows/%s with person ID",
    (page) => {
      const personId = "person123";

      const location = {
        pathname: `/workflows/${page}/${personId}`,
      } as RouterLocation;
      expect(parseLocation(location)).toStrictEqual({
        page,
        personId,
        opportunityPseudoId: undefined,
      });
    },
  );
});

const useRootStoreMock = useRootStore as Mock;

type MockWorkflowsStore = {
  workflowsSupportedSystems: string[];
  homepage: string;
  activeSystem: string;
  setActivePage: ReturnType<typeof vi.fn>;
  updateActiveSystem: ReturnType<typeof vi.fn>;
  updateSelectedOpportunityType: ReturnType<typeof vi.fn>;
  updateSelectedPerson: ReturnType<typeof vi.fn>;
  updateSelectedOpportunity: ReturnType<typeof vi.fn>;
  opportunityTypes: string[];
  rootStore: { userStore: { activeFeatureVariants: Record<string, unknown> } };
};

function setupRootStoreMock({
  flagOn,
  workflowsSupportedSystems = ["SUPERVISION", "INCARCERATION"],
}: {
  flagOn: boolean;
  workflowsSupportedSystems?: string[];
}): { workflowsStore: MockWorkflowsStore } {
  // Plain objects (not MobX `observable`) — the autorun re-runs because the
  // wrapping useEffect re-runs on each `loc` change, not because of MobX
  // tracking. Using `observable` here would wrap our vi.fn spies in MobX
  // proxies and strip their spy metadata.
  const userStore = {
    activeFeatureVariants: flagOn ? { usMoMyCaseload: {} } : {},
  };

  const workflowsStore: MockWorkflowsStore = {
    workflowsSupportedSystems,
    homepage: "home",
    activeSystem: "ALL",
    setActivePage: vi.fn(),
    updateActiveSystem: vi.fn(),
    updateSelectedOpportunityType: vi.fn(),
    updateSelectedPerson: vi.fn(() => Promise.resolve()),
    updateSelectedOpportunity: vi.fn(),
    opportunityTypes: [],
    rootStore: { userStore },
  };
  workflowsStore.updateActiveSystem.mockImplementation((system: string) => {
    workflowsStore.activeSystem = system;
  });

  useRootStoreMock.mockReturnValue({
    workflowsStore,
    currentTenantId: "US_MO",
    workflowsRootStore: {
      opportunityConfigurationStore: {
        opportunities: {},
        getOpportunityTypeFromUrl: () => undefined,
      },
    },
  });

  return { workflowsStore };
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workflows/*" element={<WorkflowsRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WorkflowsRoute activeSystem sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("overrides activeSystem to SUPERVISION on /workflows/home when usMoMyCaseload is on", () => {
    const { workflowsStore } = setupRootStoreMock({ flagOn: true });

    renderRoute("/workflows/home");

    expect(workflowsStore.updateActiveSystem).toHaveBeenCalledWith(
      "SUPERVISION",
    );
    expect(workflowsStore.activeSystem).toBe("SUPERVISION");
  });

  it("falls back to ALL on /workflows/home when usMoMyCaseload is off (multi-system tenant)", () => {
    // Regression guard for the generic multi-system homepage. With the flag
    // off, `home` should resolve via `getSystemIdFromPage`, which puts it in
    // the ALL bucket.
    const { workflowsStore } = setupRootStoreMock({ flagOn: false });

    renderRoute("/workflows/home");

    expect(workflowsStore.updateActiveSystem).toHaveBeenCalledWith("ALL");
    expect(workflowsStore.activeSystem).toBe("ALL");
  });

  it("maps /workflows/opportunities to ALL when usMoMyCaseload is on", () => {
    // The restored Opportunities homepage is system-agnostic, mirroring the
    // pre-flag `home` behavior. It lives in the ALL bucket of
    // WORKFLOWS_SYSTEM_ID_TO_PAGE so the caseload-type selector renders.
    const { workflowsStore } = setupRootStoreMock({ flagOn: true });

    renderRoute("/workflows/opportunities");

    expect(workflowsStore.updateActiveSystem).toHaveBeenCalledWith("ALL");
    expect(workflowsStore.activeSystem).toBe("ALL");
  });

  it("maps /workflows/tasks to SUPERVISION regardless of the flag", () => {
    const { workflowsStore } = setupRootStoreMock({ flagOn: true });

    renderRoute("/workflows/tasks");

    expect(workflowsStore.updateActiveSystem).toHaveBeenCalledWith(
      "SUPERVISION",
    );
    expect(workflowsStore.activeSystem).toBe("SUPERVISION");
  });

  it("maps /workflows/tasks to SUPERVISION when the flag is off too", () => {
    const { workflowsStore } = setupRootStoreMock({ flagOn: false });

    renderRoute("/workflows/tasks");

    expect(workflowsStore.updateActiveSystem).toHaveBeenCalledWith(
      "SUPERVISION",
    );
    expect(workflowsStore.activeSystem).toBe("SUPERVISION");
  });
});
