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

import { render, screen, waitFor, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";

import {
  publicDecember2026,
  publicJanuary2027,
  publicNovember2026,
  publicNovember2026WithCancelledMeeting,
} from "~@parole-board/common/fixtures";

import { SuspenseBoundary } from "../../loading/SuspenseBoundary";
import { renderWithHost } from "../../testing";
import { semantics } from "../../theme";
import { PublicCalendarLoadError } from "../PublicCalendarLoadError";
import { PublicCalendarSkeleton } from "../PublicCalendarSkeleton";
import { PublicCalendarView } from "../PublicCalendarView";
import type { PublicCalendarViewProps } from "../types";

const baseProps: PublicCalendarViewProps = {
  month: publicDecember2026,
  monthHref: (month) => `/${month}`,
  landingHref: "/",
};

// The arrows are router links. The wrapper stays around rerendered views.
function renderView(props: Partial<PublicCalendarViewProps> = {}) {
  return render(<PublicCalendarView {...baseProps} {...props} />, {
    wrapper: MemoryRouter,
  });
}

const dayCell = (date: string) => {
  const cell = document.querySelector<HTMLElement>(`[data-date="${date}"]`);
  if (!cell) throw new Error(`No cell for ${date}`);
  return cell;
};

// jsdom has no layout, so FullCalendar leaves chips at visibility: hidden,
// which hides their text from accessible-name queries. Find them by their
// hover title instead.
const chip = (date: string, title: string) =>
  within(dayCell(date)).getByTitle(title);

const inertArea = () => {
  const area = document.querySelector<HTMLElement>("[inert]");
  if (!area) throw new Error("Nothing is inert");
  return area;
};

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

const DESKTOP_WIDTH = 1440;

afterEach(() => setWindowWidth(DESKTOP_WIDTH));
beforeEach(() => setWindowWidth(DESKTOP_WIDTH));

describe("PublicCalendarView with a published month", () => {
  test("shows the heading, the month title and the grid", () => {
    renderView();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Parole Hearing Calendar",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: "December 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "December 2026 calendar" }),
    ).toBeInTheDocument();
  });

  test("announces the month title in a polite live region", () => {
    const { rerender } = renderView();
    const title = screen.getByRole("heading", { name: "December 2026" });
    expect(title).toHaveAttribute("aria-live", "polite");
    rerender(<PublicCalendarView {...baseProps} month={publicJanuary2027} />);
    expect(title).toHaveTextContent("January 2027");
  });

  test("links the arrows to the previous and next published months", () => {
    renderView();
    expect(
      screen.getByRole("link", { name: "Previous month" }),
    ).toHaveAttribute("href", "/2026-11");
    expect(screen.getByRole("link", { name: "Next month" })).toHaveAttribute(
      "href",
      "/2027-01",
    );
  });

  test("disables Previous at the first published month", () => {
    renderView({ month: publicNovember2026 });
    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: "Previous month" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Next month" }),
    ).toBeInTheDocument();
  });

  test("disables Next at the last published month", () => {
    renderView({ month: publicJanuary2027 });
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Previous month" }),
    ).toBeInTheDocument();
  });

  test("spells out the Business Meeting on its chip", () => {
    renderView();
    const meeting = chip("2026-12-18", "Business Meeting");
    expect(meeting).toHaveTextContent("Business Meeting");
    expect(screen.queryByText("Business Mtg")).not.toBeInTheDocument();
  });

  test("tags a cancelled entry with plain Cancelled text that reads as Full Board, cancelled", () => {
    renderView({ month: publicNovember2026WithCancelledMeeting });
    const cancelled = chip("2026-11-13", "Full Board");
    expect(within(cancelled).getByText("Cancelled")).toBeInTheDocument();
    expect(cancelled).toHaveTextContent("Full Board, cancelled");
    expect(chip("2026-11-06", "Full Board")).not.toHaveTextContent("cancelled");
  });

  test("labels each holiday with its name", () => {
    renderView({ month: publicNovember2026 });
    expect(
      within(dayCell("2026-11-11")).getByText("Veterans' Day"),
    ).toBeInTheDocument();
    expect(
      within(dayCell("2026-11-26")).getByText("Thanksgiving Day"),
    ).toBeInTheDocument();
  });

  test("names the month in the document title", () => {
    renderView();
    expect(document.title).toBe(
      "December 2026 — Colorado Parole Board Hearing Calendar",
    );
  });

  test("shows no line about an unpublished month by default", () => {
    renderView();
    expect(screen.queryByText(/isn't published yet/)).not.toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = renderView({
      month: publicNovember2026WithCancelledMeeting,
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarView when the landing page moved forward", () => {
  const month = {
    ...publicDecember2026,
    previous: null,
    notPublishedYet: "November 2026",
  };

  test("says the current month isn't published yet, above the grid", () => {
    renderView({ month });
    expect(
      screen.getByText("November 2026 isn't published yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "December 2026 calendar" }),
    ).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = renderView({ month });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarView for a month that's no longer live", () => {
  const BANNER =
    "December 2026's calendar is being updated and is no longer live. Check back soon.";

  test("keeps the grid under a banner naming the month", () => {
    renderView({ noLongerLive: true });
    expect(screen.getByText(BANNER)).toBeInTheDocument();
    expect(chip("2026-12-07", "FCF")).toBeInTheDocument();
  });

  // jsdom doesn't apply inert, so role queries and focus still reach the
  // grid here. These tests check what sits inside the inert element instead.
  test("puts the whole grid, and only the grid, in an inert area", () => {
    renderView({ noLongerLive: true });
    const inert = inertArea();
    const region = screen.getByRole("region", {
      name: "December 2026 calendar",
    });
    expect(region.parentElement).toBe(inert);
    expect(inert).toContainElement(chip("2026-12-07", "FCF"));
    expect(document.querySelectorAll("[inert]")).toHaveLength(1);
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
  });

  test("keeps the banner, the arrows and the note outside the inert grid", () => {
    renderView({
      noLongerLive: true,
      month: { ...publicDecember2026, notPublishedYet: "January 2027" },
    });
    const inert = inertArea();
    expect(inert).not.toContainElement(screen.getByRole("status"));
    expect(screen.getByRole("status")).toHaveTextContent(BANNER);
    expect(inert).not.toContainElement(
      screen.getByRole("link", { name: "Previous month" }),
    );
    expect(inert).not.toContainElement(
      screen.getByRole("link", { name: "Next month" }),
    );
    expect(inert).not.toContainElement(
      screen.getByText("January 2027 isn't published yet."),
    );
  });

  test("puts the banner in a section right under the header, outside the main area", () => {
    renderView({ noLongerLive: true });
    const section = screen.getByRole("region", { name: "Month status" });
    expect(section).toContainElement(screen.getByRole("status"));
    expect(section).toHaveTextContent(BANNER);
    expect(screen.getByRole("main")).not.toContainElement(section);
    expect(screen.getByRole("banner").nextElementSibling).toBe(section);
  });

  test("leaves the empty banner section unnamed while the month is live", () => {
    renderView();
    expect(
      screen.queryByRole("region", { name: "Month status" }),
    ).not.toBeInTheDocument();
  });

  test("tags the banner UPDATING", () => {
    renderView({ noLongerLive: true });
    expect(
      within(screen.getByRole("status")).getByText("UPDATING"),
    ).toBeInTheDocument();
  });

  test("greys the grid", () => {
    renderView({ noLongerLive: true });
    const grid = screen.getByRole("region", {
      name: "December 2026 calendar",
    }).firstElementChild;
    expect(grid).toHaveStyleRule("opacity", String(semantics.opacity.disabled));
  });

  test("puts the banner in a polite live region that was already on the page", () => {
    const { rerender } = renderView();
    const region = screen.getByRole("status");
    expect(region).toBeEmptyDOMElement();
    rerender(<PublicCalendarView {...baseProps} noLongerLive />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent(BANNER);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("keeps the arrows as links", () => {
    renderView({ noLongerLive: true });
    expect(
      screen.getByRole("link", { name: "Previous month" }),
    ).toHaveAttribute("href", "/2026-11");
    expect(screen.getByRole("link", { name: "Next month" })).toHaveAttribute(
      "href",
      "/2027-01",
    );
  });

  test("shows no banner or grey, and nothing inert, once it's live again", () => {
    const { rerender } = renderView({ noLongerLive: true });
    rerender(<PublicCalendarView {...baseProps} noLongerLive={false} />);
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
    expect(document.querySelector("[inert]")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "December 2026 calendar" })
        .firstElementChild,
    ).toHaveStyleRule("opacity", "1");
  });

  test("has no axe violations", async () => {
    const { container } = renderView({ noLongerLive: true });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarView for an unavailable month", () => {
  test("says the month isn't available and links to the landing page", () => {
    renderView({ month: null, status: "unavailable" });
    expect(screen.getByText("This month isn't available.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the calendar" }),
    ).toHaveAttribute("href", "/");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(document.title).toBe("Colorado Parole Board Hearing Calendar");
  });

  test("has no axe violations", async () => {
    const { container } = renderView({ month: null, status: "unavailable" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarView with no published months", () => {
  test("says so, with no navigation and no grid", () => {
    renderView({ month: null });
    expect(
      screen.getByText("No months have been published yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Next month" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(document.title).toBe("Colorado Parole Board Hearing Calendar");
  });

  test("has no axe violations", async () => {
    const { container } = renderView({ month: null });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarView on a phone", () => {
  test("keeps the month grid, holidays included, with the navigation", () => {
    setWindowWidth(375);
    renderView();
    expect(dayCell("2026-12-01")).toBeInTheDocument();
    expect(
      within(dayCell("2026-12-25")).getByText("Christmas Day"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Next month" }),
    ).toBeInTheDocument();
  });

  test("puts the grid in a focusable scroll region named for the month", () => {
    setWindowWidth(375);
    renderView();
    const region = screen.getByRole("region", {
      name: "December 2026 calendar",
    });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(
      within(region).getByRole("columnheader", { name: /Sun/ }),
    ).toBeInTheDocument();
    expect(region).toContainElement(dayCell("2026-12-01"));
  });

  test("has no axe violations", async () => {
    setWindowWidth(375);
    const { container } = renderView();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarView's scroll when a month opens", () => {
  const scrollIntoView = vi.fn();

  // jsdom lays nothing out, so each test sets the grid's scroll width and
  // the scroll area's visible width.
  function layOut({ grid, visible }: { grid: number; visible: number }) {
    vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(grid);
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(visible);
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T17:00:00Z"));
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  test("brings today's cell into view in the current month", async () => {
    layOut({ grid: 770, visible: 343 });
    renderView({ month: publicNovember2026 });
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toBe(dayCell("2026-11-19"));
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "start",
    });
  });

  test("brings the first day with sessions into view in another month", async () => {
    layOut({ grid: 770, visible: 343 });
    renderView();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toBe(dayCell("2026-12-01"));
  });

  test("scrolls again when the month changes", async () => {
    layOut({ grid: 770, visible: 343 });
    const { rerender } = renderView();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    rerender(<PublicCalendarView {...baseProps} month={publicJanuary2027} />);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2));
    expect(scrollIntoView.mock.contexts[1]).toBe(dayCell("2027-01-04"));
  });

  test("doesn't scroll when the grid fits", async () => {
    layOut({ grid: 1376, visible: 1376 });
    renderView({ month: publicNovember2026 });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("PublicCalendarSkeleton", () => {
  test("shows the heading and the grid skeleton, without the navigation", () => {
    render(<PublicCalendarSkeleton />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Parole Hearing Calendar",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading the month" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(<PublicCalendarSkeleton />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PublicCalendarLoadError", () => {
  beforeEach(() => {
    // React logs every error a boundary catches.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  function Failing(): never {
    throw new Error("Network error");
  }

  test("shows the error copy as the SuspenseBoundary's error fallback", async () => {
    renderWithHost(
      <SuspenseBoundary
        fallback={<PublicCalendarSkeleton />}
        renderError={() => <PublicCalendarLoadError />}
      >
        <Failing />
      </SuspenseBoundary>,
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The calendar couldn't load.");
    expect(alert).toHaveTextContent("Refresh the page to try again.");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Parole Hearing Calendar",
      }),
    ).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(<PublicCalendarLoadError />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
