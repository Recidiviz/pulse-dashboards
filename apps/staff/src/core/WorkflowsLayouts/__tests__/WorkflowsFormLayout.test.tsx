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

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { RootStore } from "../../../RootStore";
import { WorkflowsFormLayoutPresenter } from "../../../WorkflowsStore/presenters/WorkflowsFormLayoutPresenter";
import { OpportunitySidePanelProvider } from "../../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import { WorkflowsFormLayout } from "../WorkflowsFormLayout";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => navigate,
}));

vi.mock("../../../components/StoreProvider");

// Bypass hydration waiting so the form layout renders immediately
vi.mock("../../ModelHydrator", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../NavigationLayout", () => ({
  NavigationLayout: () => null,
  NAV_BAR_HEIGHT: 0,
}));

vi.mock("../../OpportunityCaseloadView/OpportunityPreviewPanel", () => ({
  OpportunityPreviewPanel: () => null,
}));

vi.mock("../../hooks/usePersonTracking", () => ({
  usePersonTracking: vi.fn(),
}));

vi.mock(
  "../../../WorkflowsStore/presenters/WorkflowsFormLayoutPresenter",
  () => ({
    WorkflowsFormLayoutPresenter: vi.fn(),
  }),
);

const useRootStoreMock = useRootStore as Mock;
const WorkflowsFormLayoutPresenterMock =
  WorkflowsFormLayoutPresenter as unknown as Mock;

function buildMockPresenter(urlSection: string | null = "someOpportunity") {
  return {
    selectedPerson: {},
    selectedOpportunity: urlSection
      ? { config: { urlSection }, form: null }
      : { config: {}, form: null },
    workflowsMethodologyUrl: null,
    hydrationState: { status: "hydrated" },
    hydrate: vi.fn(),
  };
}

const FORM_PATHNAME = "/workflows/someOpportunity/p1/oppId";

function renderFormLayout({
  hasInAppHistory = false,
  urlSection = "someOpportunity" as string | null,
} = {}) {
  WorkflowsFormLayoutPresenterMock.mockImplementation(() =>
    buildMockPresenter(urlSection),
  );
  useRootStoreMock.mockReturnValue({
    workflowsStore: {},
    firestoreStore: {},
    tenantStore: {},
  } as unknown as RootStore);

  // MemoryRouter assigns location.key = "default" only to the first (index 0)
  // entry. Placing the form path at index 1 gives it a non-default key,
  // simulating an in-app navigation that arrived here via React Router.
  const initialEntries = hasInAppHistory
    ? ["/workflows/someOpportunity", FORM_PATHNAME]
    : [FORM_PATHNAME];
  const initialIndex = hasInAppHistory ? 1 : 0;

  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <OpportunitySidePanelProvider>
        <WorkflowsFormLayout
          selectedPerson={{} as any}
          selectedOpportunityType={"someOpportunity" as any}
        />
      </OpportunitySidePanelProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigate.mockClear();
});

describe("WorkflowsFormLayout handleBack", () => {
  describe("on a workflows path (not Insights)", () => {
    it("calls navigate(-1) when the user navigated here within the app (location.key !== 'default')", () => {
      renderFormLayout({ hasInAppHistory: true });

      fireEvent.click(screen.getByText("Back"));

      expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("navigates to the opportunity URL on a deep link (location.key === 'default')", () => {
      renderFormLayout();

      fireEvent.click(screen.getByText("Back"));

      expect(navigate).toHaveBeenCalledWith("/workflows/someOpportunity");
      expect(navigate).not.toHaveBeenCalledWith(-1);
    });

    it("calls navigate(-1) as last resort on a deep link with no urlSection", () => {
      renderFormLayout({ urlSection: null });

      fireEvent.click(screen.getByText("Back"));

      expect(navigate).toHaveBeenCalledWith(-1);
    });
  });
});
