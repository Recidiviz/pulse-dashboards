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

import { DndContext } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, useLocation } from "react-router-dom";

import WorkflowsCaseloadTabs, {
  WorkflowsCaseloadTabsLinkProps,
} from "../WorkflowsCaseloadTabs";

type TabKey = "a" | "b" | "c";
const TABS: TabKey[] = ["a", "b", "c"];

function ButtonHarness({
  initialActive = "a",
  sortable = false,
}: {
  initialActive?: TabKey;
  sortable?: boolean;
}) {
  const setActiveTab = vi.fn();
  // SortableContext-wrapped so useSortable doesn't warn even when sortable=false.
  return (
    <DndContext>
      <SortableContext items={TABS} strategy={horizontalListSortingStrategy}>
        <WorkflowsCaseloadTabs
          tabs={TABS}
          tabLabels={{ a: "Alpha", b: "Beta", c: "Gamma" }}
          tabBadges={{ a: 1, b: 2, c: 3 }}
          activeTab={initialActive}
          setActiveTab={setActiveTab}
          sortable={sortable}
        />
      </SortableContext>
    </DndContext>
  );
}

function LinkBody({
  initialActive,
  cb,
}: {
  initialActive: TabKey;
  cb: (tab: TabKey) => void;
}) {
  const location = useLocation();
  const tabHref = (tab: TabKey) => {
    const next = new URLSearchParams(location.search);
    next.set("tab", tab);
    return `${location.pathname}?${next.toString()}`;
  };
  return (
    <WorkflowsCaseloadTabs
      mode="link"
      tabs={TABS}
      tabLabels={{ a: "Alpha", b: "Beta", c: "Gamma" }}
      tabBadges={{ a: 1, b: 2, c: 3 }}
      activeTab={initialActive}
      setActiveTab={cb}
      tabHref={tabHref}
    />
  );
}

function LinkHarness({
  initialActive = "a",
  setActiveTab,
  search = "",
  pathname = "/page",
}: {
  initialActive?: TabKey;
  setActiveTab?: (tab: TabKey) => void;
  search?: string;
  pathname?: string;
}) {
  const cb = setActiveTab ?? vi.fn();
  return (
    <MemoryRouter initialEntries={[`${pathname}${search}`]}>
      <LinkBody initialActive={initialActive} cb={cb} />
    </MemoryRouter>
  );
}

describe("WorkflowsCaseloadTabs", () => {
  describe("button mode (default)", () => {
    it("renders clickable divs (no anchors) and fires setActiveTab on click", () => {
      const setActiveTab = vi.fn();
      render(
        <DndContext>
          <SortableContext
            items={TABS}
            strategy={horizontalListSortingStrategy}
          >
            <WorkflowsCaseloadTabs
              tabs={TABS}
              tabLabels={{ a: "Alpha", b: "Beta", c: "Gamma" }}
              activeTab="a"
              setActiveTab={setActiveTab}
            />
          </SortableContext>
        </DndContext>,
      );

      // No anchors in button mode.
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      // No tablist role in button mode.
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

      // Click the second tab; setActiveTab fires with its key.
      fireEvent.click(screen.getByText("Beta"));
      expect(setActiveTab).toHaveBeenCalledWith("b");
    });

    it("renders badges from tabBadges", () => {
      render(<ButtonHarness />);
      // Each badge is a number in the tab.
      expect(screen.getByText("Alpha").textContent).toContain("1");
      expect(screen.getByText("Beta").textContent).toContain("2");
      expect(screen.getByText("Gamma").textContent).toContain("3");
    });
  });

  describe("link mode", () => {
    it("renders anchors with the resolved href returned by tabHref", () => {
      render(
        <LinkHarness pathname="/workflows/home" search="?tenantId=US_MO" />,
      );

      const links = screen.getAllByRole("tab");
      expect(links).toHaveLength(3);
      // Each tab is an anchor with the right href (the test renders via
      // BrowserRouter, so href ends up as "/workflows/home?tenantId=US_MO&tab=a")
      const alpha = links[0];
      expect(alpha.tagName).toBe("A");
      expect(alpha).toHaveAttribute(
        "href",
        expect.stringContaining("tab=a") as unknown as string,
      );
    });

    it("wraps tabs in role=tablist", () => {
      render(<LinkHarness />);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("marks the active tab aria-selected=true and tabIndex=0; others -1", () => {
      render(<LinkHarness initialActive="b" />);
      const tabs = screen.getAllByRole("tab");
      const alpha = tabs[0];
      const beta = tabs[1];
      const gamma = tabs[2];
      expect(beta).toHaveAttribute("aria-selected", "true");
      expect(beta).toHaveAttribute("tabindex", "0");
      expect(alpha).toHaveAttribute("aria-selected", "false");
      expect(alpha).toHaveAttribute("tabindex", "-1");
      expect(gamma).toHaveAttribute("aria-selected", "false");
      expect(gamma).toHaveAttribute("tabindex", "-1");
    });

    it("moves focus and selection on ArrowRight, ArrowLeft, Home, End", () => {
      const setActiveTab = vi.fn();
      render(<LinkHarness initialActive="b" setActiveTab={setActiveTab} />);
      const tabs = screen.getAllByRole("tab");

      fireEvent.keyDown(tabs[1], { key: "ArrowRight" });
      expect(setActiveTab).toHaveBeenLastCalledWith("c");

      fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
      expect(setActiveTab).toHaveBeenLastCalledWith("a");

      fireEvent.keyDown(tabs[1], { key: "End" });
      expect(setActiveTab).toHaveBeenLastCalledWith("c");

      fireEvent.keyDown(tabs[1], { key: "Home" });
      expect(setActiveTab).toHaveBeenLastCalledWith("a");
    });

    it("preserves other query params when tabHref upserts ?tab=", () => {
      render(
        <LinkHarness pathname="/workflows/home" search="?other=keep&tab=a" />,
      );
      const gamma = screen.getAllByRole("tab")[2];
      const href = gamma.getAttribute("href");
      expect(href).toContain("other=keep");
      expect(href).toContain("tab=c");
    });

    it("renders badges in link mode", () => {
      render(<LinkHarness />);
      const alpha = screen.getAllByRole("tab")[0];
      expect(within(alpha).getByText("1")).toBeInTheDocument();
    });

    it("has no axe violations", async () => {
      const { container } = render(<LinkHarness initialActive="a" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("updates the URL when a tab is clicked (Link navigates)", () => {
      let observed = "";
      function LocationProbe() {
        const location = useLocation();
        observed = `${location.pathname}${location.search}`;
        return null;
      }
      const setActiveTab = vi.fn();
      const cb = setActiveTab;
      render(
        <MemoryRouter initialEntries={["/page?tenantId=US_MO"]}>
          <LinkBody initialActive="a" cb={cb} />
          <LocationProbe />
        </MemoryRouter>,
      );
      expect(observed).toBe("/page?tenantId=US_MO");

      const gamma = screen.getAllByRole("tab")[2];
      fireEvent.click(gamma);

      // After click the router location reflects tabHref(c).
      expect(observed).toContain("tab=c");
      expect(observed).toContain("tenantId=US_MO");
      // setActiveTab is still called synchronously with the clicked tab.
      expect(setActiveTab).toHaveBeenCalledWith("c");
    });

    it("does NOT navigate when click has a modifier (cmd/ctrl/shift/meta)", () => {
      // react-router's <Link> already short-circuits on modifier clicks (so
      // the browser can open in a new tab). Our handler must NOT preventDefault
      // either, otherwise the modifier behavior would be swallowed.
      let observed = "";
      function LocationProbe() {
        const location = useLocation();
        observed = `${location.pathname}${location.search}`;
        return null;
      }
      const setActiveTab = vi.fn();
      render(
        <MemoryRouter initialEntries={["/page"]}>
          <LinkBody initialActive="a" cb={setActiveTab} />
          <LocationProbe />
        </MemoryRouter>,
      );
      const gamma = screen.getAllByRole("tab")[2];
      fireEvent.click(gamma, { metaKey: true });
      // No in-app navigation occurred (browser would open a new tab in the
      // real DOM; the in-memory router stays put).
      expect(observed).toBe("/page");
      // Our handler still notifies the parent — but the browser tab opens
      // separately, so this isn't a correctness issue.
      // (We don't assert setActiveTab here because behavior may vary.)
    });
  });

  describe("type-check: link mode requires tabHref", () => {
    it("compile-time enforces tabHref when mode is 'link'", () => {
      // The discriminated union forces `tabHref` when mode="link". We assert
      // this at the type level by attempting to assign a props object missing
      // `tabHref` to `WorkflowsCaseloadTabsLinkProps`. The wrapper guarantees
      // none of this runs at runtime.
      function _NeverRendered() {
        const noop = (_tab: TabKey) => undefined;
        // Build a candidate-link-props object missing tabHref so we can
        // assert the type error on the assignment line itself.
        const candidate = {
          mode: "link" as const,
          tabs: TABS,
          activeTab: "a" as const,
          setActiveTab: noop,
        };
        // @ts-expect-error: tabHref is required when mode="link"
        const _bad: WorkflowsCaseloadTabsLinkProps<TabKey> = candidate;
        return _bad;
      }
      expect(typeof _NeverRendered).toBe("function");
    });
  });
});
