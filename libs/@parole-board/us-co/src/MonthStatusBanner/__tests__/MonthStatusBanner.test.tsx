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
import { axe } from "jest-axe";
import { ReactElement, ReactNode } from "react";

import type { MonthSummary, ParoleBoardHost } from "~@parole-board/common";
import { ParoleBoardHostProvider, semantics } from "~@parole-board/common";
import {
  december2026Summary,
  monthSummary,
  november2026Summary,
  september2026Summary,
} from "~@parole-board/common/fixtures";
import { createFakeHost } from "~@parole-board/common/testing";

import { MonthStatusBanner } from "../MonthStatusBanner";

const DENVER = "America/Denver";

/** A months.list month with the live counts months.get adds. */
const withCounts = (summary: MonthSummary) => ({
  ...summary,
  counts: { entryDays: 13, entryCount: 37 },
});

/** Renders ui under a host, the fake host by default. */
function renderInHost(
  ui: ReactElement,
  host: ParoleBoardHost = createFakeHost(),
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ParoleBoardHostProvider host={host}>{children}</ParoleBoardHostProvider>
    ),
  });
}

const published = withCounts(november2026Summary);
const backInDraft = withCounts(december2026Summary);

// Both strips are the "Month status" region, so the published banner is the
// one with the UPLOAD COMPLETE tag.
const publishedBanner = () =>
  screen
    .queryAllByRole("region", { name: "Month status" })
    .find((region) => within(region).queryByText("UPLOAD COMPLETE")) ?? null;

describe("MonthStatusBanner", () => {
  describe("a published month", () => {
    test("shows the published banner with the month's counts and its latest publish, in Denver time", async () => {
      const { container } = renderInHost(
        <MonthStatusBanner month={published} timeZone={DENVER} />,
      );

      expect(publishedBanner()).toHaveTextContent(
        "November 2026 is live on the public calendar — 13 hearing days, 37 hearings.",
      );
      expect(
        screen.getByText(
          "Published Oct 5, 2026 at 11:00 AM by editor-a@example.com",
        ),
      ).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });

    test("links View public page to that month on the public calendar", () => {
      renderInHost(<MonthStatusBanner month={published} timeZone={DENVER} />);

      expect(
        screen.getByRole("link", { name: /^View public page/ }),
      ).toHaveAttribute("href", "https://public-calendar.test/2026-11");
    });

    test("leaves out View public page when the host has no public calendar address", () => {
      renderInHost(
        <MonthStatusBanner month={published} timeZone={DENVER} />,
        createFakeHost({ publicCalendarUrl: undefined }),
      );

      expect(publishedBanner()).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    test("has no dismiss button, so it stays while the month is published", () => {
      renderInHost(<MonthStatusBanner month={published} timeZone={DENVER} />);

      expect(publishedBanner()).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    test("shows the other month's counts and publish after switching to another published month", () => {
      const { rerender } = renderInHost(
        <MonthStatusBanner month={published} timeZone={DENVER} />,
      );

      rerender(
        <MonthStatusBanner
          month={{
            ...published,
            year: 2027,
            month: 1,
            counts: { entryDays: 9, entryCount: 21 },
            latestPublication: {
              publishedAt: new Date("2026-12-08T17:00:00Z"),
              publishedByEmail: "editor-b@example.com",
            },
          }}
          timeZone={DENVER}
        />,
      );

      expect(publishedBanner()).toHaveTextContent(
        "January 2027 is live on the public calendar — 9 hearing days, 21 hearings.",
      );
      expect(publishedBanner()).toHaveTextContent(
        "Published Dec 8, 2026 at 10:00 AM by editor-b@example.com",
      );
      expect(publishedBanner()).not.toHaveTextContent("November 2026");
    });
  });

  test("shows the DRAFT strip for a month back in draft after Edit month", async () => {
    const { container } = renderInHost(
      <MonthStatusBanner month={backInDraft} timeZone={DENVER} />,
    );

    const banner = screen.getByRole("region", { name: "Month status" });
    expect(banner).toHaveTextContent(
      "December 2026 is back in draft and no longer live on the public calendar. Re-publish when your edits are complete.",
    );
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(publishedBanner()).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  // A jsdom layout has no heights to measure, so this checks the rule that
  // sets them.
  test.each([
    ["the DRAFT strip", backInDraft],
    ["the published banner", published],
  ])("gives %s the shared banner min height", (_, month) => {
    renderInHost(<MonthStatusBanner month={month} timeZone={DENVER} />);

    expect(
      screen.getByRole("region", { name: "Month status" }).firstElementChild,
    ).toHaveStyleRule("min-height", semantics.size.banner);
  });

  test("isn't a live region, since it's part of the page", () => {
    renderInHost(<MonthStatusBanner month={backInDraft} timeZone={DENVER} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test.each([
    ["a never-published draft", withCounts(september2026Summary)],
    ["an edited draft", withCounts(monthSummary({ revision: 3 }))],
    [
      "a published month with no publication record",
      withCounts(monthSummary({ status: "PUBLISHED" })),
    ],
    ["a month that doesn't exist", null],
  ])("renders nothing for %s", (_, month) => {
    const { container } = renderInHost(
      <MonthStatusBanner month={month} timeZone={DENVER} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
