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

import { render, screen } from "@testing-library/react";
import { parseISO } from "date-fns";
import tk from "timekeeper";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

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
    const { container } = render(<SARReportsSection sars={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders an archived row with a 'View Report' link and the completion date", () => {
    render(<SARReportsSection sars={[archivedSAR]} />);

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("SAR - Completed 05/05/2026")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "View Report" });
    expect(link).toHaveAttribute(
      "href",
      sarUrl("sarDetails", {
        staffPseudoId: "staff-archived",
        sarId: "archived-1",
      }),
    );
  });

  test("renders one row per non-archived status with 'Go to SAR Builder' links", () => {
    const sars: SARsByClient = [
      makeSAR({ id: "s-not-yet", status: "NotYetStarted" }),
      makeSAR({ id: "s-in-progress", status: "InProgress" }),
      // `Complete` without completionDate (or with a future completionDate)
      // is treated as not archived; exercise that branch too.
      makeSAR({ id: "s-complete", status: "Complete", completionDate: null }),
    ];

    render(<SARReportsSection sars={sars} />);

    expect(screen.getByText("SAR - Not yet started")).toBeInTheDocument();
    expect(screen.getByText("SAR - In Progress")).toBeInTheDocument();
    expect(screen.getByText("SAR - Complete")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "Go to SAR Builder" });
    expect(links).toHaveLength(3);
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
    expect(links[2]).toHaveAttribute(
      "href",
      sarUrl("sarDetails", {
        staffPseudoId: "staff-pseudo-1",
        sarId: "s-complete",
      }),
    );
  });

  test("renders a mixed archived + in-progress fixture in input order", () => {
    const sars: SARsByClient = [
      archivedSAR,
      makeSAR({ id: "active-1", status: "InProgress" }),
    ];

    render(<SARReportsSection sars={sars} />);

    const labels = screen.getAllByText(/^SAR - /).map((el) => el.textContent);
    expect(labels).toEqual(["SAR - Completed 05/05/2026", "SAR - In Progress"]);

    // Both action types are present.
    expect(
      screen.getByRole("link", { name: "View Report" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to SAR Builder" }),
    ).toBeInTheDocument();
  });

  test("renders inside a <section> so the CardFrame divider rule applies", () => {
    const { container } = render(<SARReportsSection sars={[archivedSAR]} />);
    expect(container.querySelector("section")).not.toBeNull();
  });

  test("treats a future completionDate as not archived", () => {
    // completionDate is after NOW (2026-05-28), so the row should still show
    // the live status + 'Go to SAR Builder', not the archived branch.
    const futureSAR = makeSAR({
      id: "future-1",
      status: "Complete",
      completionDate: parseISO("2026-12-31"),
    });
    render(<SARReportsSection sars={[futureSAR]} />);
    expect(screen.getByText("SAR - Complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to SAR Builder" }),
    ).toBeInTheDocument();
  });
});
