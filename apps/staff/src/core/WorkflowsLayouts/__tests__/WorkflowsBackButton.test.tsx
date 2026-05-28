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

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { workflowsUrl } from "../../views";
import { parentOf, WorkflowsBackButton } from "../WorkflowsBackButton";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;

function renderAt(
  pathname: string,
  {
    activePageIsHomepage = false,
    hideWorkflowsOpportunities = false,
    homepage = "home",
  }: {
    activePageIsHomepage?: boolean;
    hideWorkflowsOpportunities?: boolean;
    homepage?: string;
  } = {},
) {
  useRootStoreMock.mockReturnValue({
    workflowsStore: { homepage, activePageIsHomepage },
  });
  useFeatureVariantsMock.mockReturnValue({ hideWorkflowsOpportunities });
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <WorkflowsBackButton />
    </MemoryRouter>,
  );
}

describe("parentOf", () => {
  it("returns opportunity clients page for opportunity action pages", () => {
    expect(parentOf(["someOpportunity", "personId", "opportunityId"])).toEqual(
      "/workflows/someOpportunity",
    );
  });

  it("returns /tasks for route planner", () => {
    expect(parentOf(["tasks", "route-planner"])).toEqual("/workflows/tasks");
  });

  it("returns /clients and /residents for client/resident profile", () => {
    expect(parentOf(["clients", "personId"])).toEqual("/workflows/clients");
    expect(parentOf(["residents", "personId"])).toEqual("/workflows/residents");
  });
});

describe("WorkflowsBackButton", () => {
  it("renders a 'Back' link to the parent on a subpage (deep link → fallback href)", () => {
    // No `previousPage` in history state, so the BackLink href is the parent
    // fallback. (Its click/history behavior is covered in BackLink.test.tsx.)
    renderAt("/workflows/clients/p1");
    const link = screen.getByRole("link", { name: /back/i });
    expect(link).toHaveAttribute("href", "/workflows/clients");
  });

  it("renders a 'Home' link on a top-level page that isn't the homepage", () => {
    renderAt("/workflows/clients", { activePageIsHomepage: false });
    const link = screen.getByRole("link", { name: /home/i });
    expect(link).toHaveAttribute("href", workflowsUrl("home"));
  });

  it("renders nothing when hideWorkflowsOpportunities is on", () => {
    renderAt("/workflows/clients", { hideWorkflowsOpportunities: true });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders nothing on the homepage", () => {
    renderAt("/workflows/home", { activePageIsHomepage: true });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
