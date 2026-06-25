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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { parseISO } from "date-fns";
import type { ComponentProps } from "react";
import tk from "timekeeper";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SARByClient, SARsByClient, sarUrl } from "~sentencing-client";

import { SARReportsSection } from "./SARReportsSection";

/** Test data factory. The runtime `SARByClient` row carries a handful of
 * fields the production tRPC procedure selects; we cast to satisfy the
 * structural type but only populate what the section reads. */
function makeSAR(overrides: Partial<SARByClient> = {}): SARByClient {
  return {
    id: "sar-id-1",
    externalId: "ext-1",
    status: "InProgress",
    completionDate: null,
    courtDate: null,
    staff: { pseudonymizedId: "staff-pseudo-1" },
    ...overrides,
  } as SARByClient;
}

/** Render the section with stub handlers; returns the spies for assertions. */
function renderSection(
  sars: SARsByClient,
  props: Partial<ComponentProps<typeof SARReportsSection>> = {},
) {
  const handlers = {
    onDownload: vi.fn(),
    onPrefetch: vi.fn(),
    onBuilderLinkClick: vi.fn(),
    ...props,
  };
  const utils = render(<SARReportsSection sars={sars} {...handlers} />);
  return { ...utils, ...handlers };
}

/** Fixed "now" for deterministic archived/not-archived branching. */
const NOW = new Date(2026, 4, 28); // 2026-05-28

const archivedSAR = makeSAR({
  id: "archived-1",
  status: "Complete",
  completionDate: parseISO("2026-05-05"),
  staff: { pseudonymizedId: "staff-archived" },
});

describe("SARReportsSection", () => {
  beforeEach(() => {
    tk.freeze(NOW);
  });

  afterEach(() => {
    tk.reset();
  });

  test("renders null when the SAR list is empty", () => {
    const { container } = renderSection([]);
    expect(container.firstChild).toBeNull();
  });

  test("archived row: completion date + 'Download Report' button; hover prefetches, click downloads", async () => {
    const { onDownload, onPrefetch } = renderSection([archivedSAR]);

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("SAR - Completed 05/05/2026")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Download Report" });
    fireEvent.mouseEnter(button);
    expect(onPrefetch).toHaveBeenCalledWith(archivedSAR);

    // The row delegates to `SARReportAction`, which manages an async in-flight
    // lock — flush its state updates inside `act` to avoid a warning.
    await act(async () => {
      fireEvent.click(button);
    });
    expect(onDownload).toHaveBeenCalledWith(archivedSAR);
  });

  test("renders a 'Go to SAR Builder' link for each in-progress (not archived, not Complete) status", () => {
    const sars: SARsByClient = [
      makeSAR({ id: "s-not-yet", status: "NotYetStarted" }),
      makeSAR({ id: "s-in-progress", status: "InProgress" }),
    ];

    renderSection(sars);

    expect(screen.getByText("SAR - Not yet started")).toBeInTheDocument();
    expect(screen.getByText("SAR - In Progress")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "Go to SAR Builder" });
    expect(links).toHaveLength(2);
    // Each link points at the right (staff, sar) pair.
    expect(links[0]).toHaveAttribute(
      "href",
      sarUrl("sarDetails", {
        staffPseudoId: "staff-pseudo-1",
        sarId: "s-not-yet",
      }),
    );
    expect(links[1]).toHaveAttribute(
      "href",
      sarUrl("sarDetails", {
        staffPseudoId: "staff-pseudo-1",
        sarId: "s-in-progress",
      }),
    );
  });

  test("a Complete SAR shows Download Report even when not archived", () => {
    // `Complete` without a past completionDate is not archived (label stays
    // live), but a Complete SAR always offers Download rather than the builder.
    const sars: SARsByClient = [
      makeSAR({ id: "s-complete", status: "Complete", completionDate: null }),
    ];

    renderSection(sars);

    expect(screen.getByText("SAR - Complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download Report" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Go to SAR Builder" }),
    ).not.toBeInTheDocument();
  });

  test("fires onBuilderLinkClick when a 'Go to SAR Builder' link is clicked", () => {
    const activeSAR = makeSAR({ id: "active-1", status: "InProgress" });
    const { onBuilderLinkClick } = renderSection([activeSAR]);

    fireEvent.click(screen.getByRole("link", { name: "Go to SAR Builder" }));
    expect(onBuilderLinkClick).toHaveBeenCalledWith(activeSAR);
  });

  test("renders a mixed archived + in-progress fixture in input order", () => {
    const sars: SARsByClient = [
      archivedSAR,
      makeSAR({ id: "active-1", status: "InProgress" }),
    ];

    renderSection(sars);

    const labels = screen.getAllByText(/^SAR - /).map((el) => el.textContent);
    expect(labels).toEqual(["SAR - Completed 05/05/2026", "SAR - In Progress"]);

    // Both action types are present.
    expect(
      screen.getByRole("button", { name: "Download Report" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to SAR Builder" }),
    ).toBeInTheDocument();
  });

  test("renders inside a <section> so the CardFrame divider rule applies", () => {
    const { container } = renderSection([archivedSAR]);
    expect(container.querySelector("section")).not.toBeNull();
  });

  test("treats a future completionDate as not archived (label stays live)", () => {
    // completionDate is after NOW (2026-05-28), so the row is not archived and
    // keeps the live "SAR - Complete" label rather than "Completed <date>".
    // Being Complete, its action is Download Report (Complete → Download).
    const futureSAR = makeSAR({
      id: "future-1",
      status: "Complete",
      completionDate: parseISO("2026-12-31"),
    });
    renderSection([futureSAR]);
    expect(screen.getByText("SAR - Complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download Report" }),
    ).toBeInTheDocument();
  });
});
