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

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import {
  MY_CASELOAD_TAB_SLUGS,
  MyCaseloadTaskCategory,
} from "../MyCaseloadBody";
import { MyCaseloadBodySkeleton } from "../MyCaseloadBodySkeleton";

function renderSkeleton(activeTab: MyCaseloadTaskCategory = "ALL_TASKS") {
  const tabHref = (c: MyCaseloadTaskCategory) =>
    `/?tab=${MY_CASELOAD_TAB_SLUGS[c]}`;
  return render(
    <MemoryRouter>
      <MyCaseloadBodySkeleton activeTab={activeTab} tabHref={tabHref} />
    </MemoryRouter>,
  );
}

describe("MyCaseloadBodySkeleton", () => {
  it("renders an aria-busy container with an accessible label", () => {
    renderSkeleton();
    const busy = screen.getByLabelText("Loading clients");
    expect(busy).toHaveAttribute("aria-busy", "true");
  });

  it("renders the four MyCaseload tabs with the right labels", () => {
    renderSkeleton();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs[0].textContent).toContain("All Clients");
    expect(tabs[1].textContent).toContain("Overdue");
    expect(tabs[2].textContent).toContain("Due this week");
    expect(tabs[3].textContent).toContain("Due this month");
  });

  it("renders '--' placeholder badges (no numeric counts)", () => {
    renderSkeleton();
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      expect(within(tab).getByText("--")).toBeInTheDocument();
    });
  });

  it("highlights the activeTab and marks the rest unselected", () => {
    renderSkeleton("OVERDUE");
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    expect(tabs[3]).toHaveAttribute("aria-selected", "false");
  });

  it("renders each tab as an anchor with an href derived from tabHref", () => {
    renderSkeleton();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].tagName).toBe("A");
    expect(tabs[0]).toHaveAttribute(
      "href",
      expect.stringContaining("tab=all-clients") as unknown as string,
    );
    expect(tabs[1]).toHaveAttribute(
      "href",
      expect.stringContaining("tab=overdue") as unknown as string,
    );
  });

  it("does NOT render a filter dropdown", () => {
    renderSkeleton();
    expect(
      screen.queryByRole("button", { name: /filter/i }),
    ).not.toBeInTheDocument();
  });

  it("renders 8 skeleton body rows, each with 5 columns, plus a header row", () => {
    const { container } = renderSkeleton();
    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows).toHaveLength(8);
    bodyRows.forEach((row) => {
      expect(row.querySelectorAll("td")).toHaveLength(5);
    });
    // Header row mirrors the real CaseloadTable header (5 columns).
    expect(container.querySelectorAll("thead th")).toHaveLength(5);
    // react-loading-skeleton renders <span class="react-loading-skeleton">:
    // 8 body rows × 5 + 5 header placeholders = 45.
    expect(container.querySelectorAll(".react-loading-skeleton")).toHaveLength(
      8 * 5 + 5,
    );
  });
});
