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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { parseISO } from "date-fns";
import tk from "timekeeper";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SARByClient, sarUrl } from "~sentencing-client";

import { SARReportAction } from "./SARReportAction";

/** Test data factory; we only populate the fields the component reads. */
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

/** Fixed "now" so archived/not-archived branching is deterministic. */
const NOW = new Date(2026, 4, 28); // 2026-05-28

/** Archived: status Complete + a completionDate in the past relative to NOW. */
const archivedSAR = makeSAR({
  id: "archived-1",
  status: "Complete",
  completionDate: parseISO("2026-05-05"),
  staff: { pseudonymizedId: "staff-archived" },
});

/** A never-resolving handler whose resolver is captured for manual control. */
function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve: () => resolve() };
}

describe("SARReportAction", () => {
  beforeEach(() => {
    tk.freeze(NOW);
  });

  afterEach(() => {
    tk.reset();
    // builderHref appends window.location.search; reset the URL so a query
    // string set by one test can't leak into another.
    window.history.replaceState(null, "", "/");
  });

  test("not-archived: renders the SAR Builder link and fires onBuilderLinkClick", () => {
    const activeSAR = makeSAR({ id: "active-1", status: "InProgress" });
    const onBuilderLinkClick = vi.fn();

    render(
      <SARReportAction
        sar={activeSAR}
        onDownload={vi.fn()}
        onPrefetch={vi.fn()}
        onBuilderLinkClick={onBuilderLinkClick}
      />,
    );

    const link = screen.getByRole("link", { name: "Go to SAR Builder" });
    expect(link).toHaveAttribute(
      "href",
      sarUrl("sarDetails", {
        staffPseudoId: "staff-pseudo-1",
        sarId: "active-1",
      }),
    );

    fireEvent.click(link);
    expect(onBuilderLinkClick).toHaveBeenCalledWith(activeSAR);
  });

  test("not-archived: appends the current query string so the builder loads the same view", () => {
    const activeSAR = makeSAR({ id: "active-qs", status: "InProgress" });
    // Mirror landing on the profile from a caseload-scoped URL — the builder
    // must carry those params through so it loads the accurate view.
    window.history.replaceState(
      null,
      "",
      "/clients/abc?officerId=OFFICER1&tab=sar",
    );

    render(
      <SARReportAction
        sar={activeSAR}
        onDownload={vi.fn()}
        onPrefetch={vi.fn()}
        onBuilderLinkClick={vi.fn()}
      />,
    );

    const link = screen.getByRole("link", { name: "Go to SAR Builder" });
    expect(link).toHaveAttribute(
      "href",
      `${sarUrl("sarDetails", {
        staffPseudoId: "staff-pseudo-1",
        sarId: "active-qs",
      })}?officerId=OFFICER1&tab=sar`,
    );
  });

  test("Complete but not yet archived: renders the Download Report button, not the link", () => {
    // A Complete SAR has a finished report to download even before its
    // completionDate passes, so it shows Download rather than the builder link.
    const completeSAR = makeSAR({
      id: "complete-active",
      status: "Complete",
      completionDate: null,
    });

    render(
      <SARReportAction
        sar={completeSAR}
        onDownload={vi.fn()}
        onPrefetch={vi.fn()}
        onBuilderLinkClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Download Report" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Go to SAR Builder" }),
    ).not.toBeInTheDocument();
  });

  test("archived but not Complete: renders the Download Report button, not the link", () => {
    // Archival (completionDate passed) alone routes to Download regardless of
    // status — only an actively-in-progress SAR keeps the builder link.
    const archivedIncompleteSAR = makeSAR({
      id: "archived-incomplete",
      status: "InProgress",
      completionDate: parseISO("2026-05-05"),
    });

    render(
      <SARReportAction
        sar={archivedIncompleteSAR}
        onDownload={vi.fn()}
        onPrefetch={vi.fn()}
        onBuilderLinkClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Download Report" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Go to SAR Builder" }),
    ).not.toBeInTheDocument();
  });

  test("archived: renders the Download Report button and warms the cache on hover + focus", () => {
    const onPrefetch = vi.fn();

    render(
      <SARReportAction
        sar={archivedSAR}
        onDownload={vi.fn()}
        onPrefetch={onPrefetch}
        onBuilderLinkClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Download Report" });
    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetch).toHaveBeenCalledTimes(2);
    expect(onPrefetch).toHaveBeenCalledWith(archivedSAR);
  });

  test("archived: click downloads, disables + relabels while in flight, then resets", async () => {
    const { promise, resolve } = deferred();
    const onDownload = vi.fn(() => promise);

    render(
      <SARReportAction
        sar={archivedSAR}
        onDownload={onDownload}
        onPrefetch={vi.fn()}
        onBuilderLinkClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Download Report" }));
    expect(onDownload).toHaveBeenCalledWith(archivedSAR);

    // In flight: the button locks itself and swaps its label.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Downloading…" }),
      ).toBeDisabled(),
    );

    // Once generation finishes, the lock clears and the label reverts.
    await act(async () => {
      resolve();
    });
    expect(
      screen.getByRole("button", { name: "Download Report" }),
    ).toBeEnabled();
  });

  test("each instance owns its own lock — clicking one leaves the other enabled", async () => {
    const a = deferred();
    const onDownloadA = vi.fn(() => a.promise);
    const onDownloadB = vi.fn().mockResolvedValue(undefined);

    const sarA = makeSAR({
      id: "a",
      status: "Complete",
      completionDate: parseISO("2026-05-05"),
    });
    const sarB = makeSAR({
      id: "b",
      status: "Complete",
      completionDate: parseISO("2026-05-05"),
    });

    render(
      <>
        <SARReportAction
          sar={sarA}
          onDownload={onDownloadA}
          onPrefetch={vi.fn()}
          onBuilderLinkClick={vi.fn()}
        />
        <SARReportAction
          sar={sarB}
          onDownload={onDownloadB}
          onPrefetch={vi.fn()}
          onBuilderLinkClick={vi.fn()}
        />
      </>,
    );

    const [buttonA] = screen.getAllByRole("button", {
      name: "Download Report",
    });
    fireEvent.click(buttonA);

    // A locks itself...
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Downloading…" }),
      ).toBeDisabled(),
    );

    // ...while B (the only remaining "Download Report" button) stays usable and
    // was never triggered — the regression a shared `downloadingId` caused.
    const buttonB = screen.getByRole("button", { name: "Download Report" });
    expect(buttonB).toBeEnabled();
    expect(onDownloadB).not.toHaveBeenCalled();

    await act(async () => {
      a.resolve();
    });
  });
});
