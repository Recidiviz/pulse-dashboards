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
import { axe } from "jest-axe";
import { MemoryRouter, useLocation, useNavigationType } from "react-router-dom";

import {
  calendarApiError,
  publicDecember2026,
  publicJanuary2027,
  publicNovember2026,
} from "~@parole-board/common/fixtures";

import { PUBLIC_MONTH_REFETCH_INTERVAL } from "../api/usePublicMonth";
import { App } from "../App";
import { createTestServices } from "./testUtils";

const notFound = () => calendarApiError("NOT_FOUND", "Month not found");

/**
 * December 2026 as the server returns it: notPublishedYet names November 2026
 * for the landing read, which skipped the unpublished current month, and is
 * null for a read that names the month.
 */
const decemberAfterSkip = (month: string | undefined) =>
  month === undefined
    ? { ...publicDecember2026, notPublishedYet: "November 2026" }
    : publicDecember2026;

/** Shows the current address and how the router got there. */
function LocationProbe() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  return (
    <output aria-label="location">{`${navigationType} ${pathname}`}</output>
  );
}

function renderApp(
  path: string,
  getMonth: Parameters<typeof createTestServices>[0],
) {
  const services = createTestServices(getMonth);
  const view = render(
    // The same router flag as main.tsx, so route changes run in a transition.
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true }}>
      <App services={services} />
      <LocationProbe />
    </MemoryRouter>,
  );
  return { services, ...view };
}

const location = () => screen.getByLabelText("location");

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1440,
  });
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-11-15T18:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("a month address", () => {
  test("loads that month", async () => {
    const { services } = renderApp("/2026-12", () => publicDecember2026);
    expect(
      await screen.findByRole("heading", { name: "December 2026" }),
    ).toBeInTheDocument();
    expect(services.getMonth).toHaveBeenCalledWith({ month: "2026-12" });
    expect(services.getMonth).toHaveBeenCalledTimes(1);
  });

  test("links the arrows to the neighbouring months' addresses", async () => {
    renderApp("/2026-12", () => publicDecember2026);
    expect(
      await screen.findByRole("link", { name: "Previous month" }),
    ).toHaveAttribute("href", "/2026-11");
    expect(screen.getByRole("link", { name: "Next month" })).toHaveAttribute(
      "href",
      "/2027-01",
    );
  });

  test("names the month in the document title", async () => {
    renderApp("/2026-12", () => publicDecember2026);
    await waitFor(() =>
      expect(document.title).toBe(
        "December 2026 — Colorado Parole Board Hearing Calendar",
      ),
    );
  });

  test("keeps the month on screen while the next one loads, then changes the title in place", async () => {
    let showJanuary: (month: unknown) => void = () => undefined;
    const january = new Promise((resolve) => {
      showJanuary = resolve;
    });
    const { services } = renderApp("/2026-12", (month) =>
      month === "2027-01" ? january : publicDecember2026,
    );
    const title = await screen.findByRole("heading", { name: "December 2026" });

    fireEvent.click(screen.getByRole("link", { name: "Next month" }));
    await waitFor(() =>
      expect(services.getMonth).toHaveBeenCalledWith({ month: "2027-01" }),
    );
    expect(title).toHaveTextContent("December 2026");
    expect(
      screen.getByRole("region", { name: "December 2026 calendar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading the month" }),
    ).not.toBeInTheDocument();

    await act(async () => showJanuary(publicJanuary2027));
    await waitFor(() => expect(location()).toHaveTextContent("PUSH /2027-01"));
    expect(screen.getByRole("heading", { name: "January 2027" })).toBe(title);
    await waitFor(() =>
      expect(document.title).toBe(
        "January 2027 — Colorado Parole Board Hearing Calendar",
      ),
    );
  });

  test("never shows notPublishedYet from a read that names the month", async () => {
    renderApp("/2026-12", () => ({
      ...publicDecember2026,
      notPublishedYet: "November 2026",
    }));
    await screen.findByRole("heading", { name: "December 2026" });
    expect(screen.queryByText(/isn't published yet/)).not.toBeInTheDocument();
  });

  test("shows the unavailable state for a month that isn't published", async () => {
    renderApp("/2026-08", () => {
      throw notFound();
    });
    expect(
      await screen.findByText("This month isn't available."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the calendar" }),
    ).toHaveAttribute("href", "/");
  });

  test.each(["/2026-13", "/1999-12", "/november", "/2026/11"])(
    "shows the unavailable state for %s without asking the server",
    async (path) => {
      const { services } = renderApp(path, () => publicDecember2026);
      expect(
        await screen.findByText("This month isn't available."),
      ).toBeInTheDocument();
      expect(services.getMonth).not.toHaveBeenCalled();
    },
  );

  test("shows the load error when the read fails", async () => {
    renderApp("/2026-12", () => {
      throw calendarApiError("INTERNAL_SERVER_ERROR", "Boom");
    });
    // Past React Query's three retries, 1, 2 and 4 seconds apart.
    await act(() => vi.advanceTimersByTimeAsync(8_000));
    expect(
      await screen.findByText("The calendar couldn't load."),
    ).toBeInTheDocument();
  });

  test("has no axe violations once loaded", async () => {
    vi.useRealTimers();
    const { container } = renderApp("/2026-12", () => publicDecember2026);
    await screen.findByRole("heading", { name: "December 2026" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("a month that goes back to draft", () => {
  const BANNER =
    "December 2026's calendar is being updated and is no longer live. Check back soon.";

  const poll = () =>
    act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));

  test("keeps the month under the banner, then clears it once republished", async () => {
    let published = true;
    renderApp("/2026-12", () => {
      if (published) return publicDecember2026;
      throw notFound();
    });
    await screen.findByRole("heading", { name: "December 2026" });
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();

    published = false;
    await poll();
    expect(await screen.findByText(BANNER)).toBeInTheDocument();
    // jsdom doesn't apply inert, so the role query still finds the grid.
    expect(
      screen
        .getByRole("region", { name: "December 2026 calendar" })
        .closest("[inert]"),
    ).toBeInTheDocument();
    expect(screen.getByText(BANNER).closest("[inert]")).toBeNull();
    expect(
      screen.queryByText("This month isn't available."),
    ).not.toBeInTheDocument();

    published = true;
    await poll();
    await waitFor(() =>
      expect(screen.queryByText(BANNER)).not.toBeInTheDocument(),
    );
    expect(document.querySelector("[inert]")).toBeNull();
  });

  test("shows the unavailable state, not the banner, on a fresh load", async () => {
    renderApp("/2026-12", () => {
      throw notFound();
    });
    expect(
      await screen.findByText("This month isn't available."),
    ).toBeInTheDocument();
    await poll();
    expect(screen.queryByText(/no longer live/)).not.toBeInTheDocument();
    expect(screen.getByText("This month isn't available.")).toBeInTheDocument();
  });

  test("leaves the banner behind on another month", async () => {
    let decemberPublished = true;
    renderApp("/2026-12", (month) => {
      if (month === "2027-01") return publicJanuary2027;
      if (decemberPublished) return publicDecember2026;
      throw notFound();
    });
    await screen.findByRole("heading", { name: "December 2026" });
    decemberPublished = false;
    await poll();
    await screen.findByText(BANNER);

    fireEvent.click(screen.getByRole("link", { name: "Next month" }));
    await screen.findByRole("heading", { name: "January 2027" });
    expect(location()).toHaveTextContent("PUSH /2027-01");
    expect(screen.queryByText(/no longer live/)).not.toBeInTheDocument();
    expect(document.querySelector("[inert]")).toBeNull();
  });

  test("has no axe violations with the banner showing", async () => {
    let published = true;
    const { container } = renderApp("/2026-12", () => {
      if (published) return publicDecember2026;
      throw notFound();
    });
    await screen.findByRole("heading", { name: "December 2026" });
    published = false;
    await poll();
    await screen.findByText(BANNER);
    vi.useRealTimers();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("the bare address", () => {
  test("replaces itself with the landing month's address", async () => {
    const { services } = renderApp("/", () => publicNovember2026);
    await waitFor(() =>
      expect(location()).toHaveTextContent("REPLACE /2026-11"),
    );
    expect(
      await screen.findByRole("heading", { name: "November 2026" }),
    ).toBeInTheDocument();
    // The month page starts from the landing read's result.
    expect(services.getMonth).toHaveBeenCalledTimes(1);
    expect(services.getMonth).toHaveBeenCalledWith({});
  });

  test("shows the landing read's notPublishedYet on the month it lands on", async () => {
    renderApp("/", decemberAfterSkip);
    expect(
      await screen.findByText("November 2026 isn't published yet."),
    ).toBeInTheDocument();
    expect(location()).toHaveTextContent("REPLACE /2026-12");
  });

  test("keeps that line when a poll of the month returns none", async () => {
    const { services } = renderApp("/", decemberAfterSkip);
    await screen.findByText("November 2026 isn't published yet.");
    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));
    await waitFor(() =>
      expect(services.getMonth).toHaveBeenLastCalledWith({ month: "2026-12" }),
    );
    expect(
      screen.getByText("November 2026 isn't published yet."),
    ).toBeInTheDocument();
  });

  test("leaves out that line when it lands on the current month", async () => {
    renderApp("/", () => publicNovember2026);
    await screen.findByRole("heading", { name: "November 2026" });
    expect(screen.queryByText(/isn't published yet/)).not.toBeInTheDocument();
  });

  test("shows the empty state when nothing is published", async () => {
    renderApp("/", () => null);
    expect(
      await screen.findByText("No months have been published yet."),
    ).toBeInTheDocument();
    expect(location()).toHaveTextContent("POP /");
  });
});

describe("page counts", () => {
  test("sends one page event naming the month", async () => {
    const { services } = renderApp("/", () => publicDecember2026);
    await screen.findByRole("heading", { name: "December 2026" });
    // The move to the month's address is a route change, which commits in a
    // transition, so its effects can run just after the month shows.
    await waitFor(() =>
      expect(services.pageCounts.page).toHaveBeenCalledTimes(1),
    );
    expect(services.pageCounts.page).toHaveBeenCalledWith("2026-12");
  });

  test("sends one with no month for the empty state", async () => {
    const { services } = renderApp("/", () => null);
    await screen.findByText("No months have been published yet.");
    expect(services.pageCounts.page).toHaveBeenCalledTimes(1);
    expect(services.pageCounts.page).toHaveBeenCalledWith(null);
  });

  test("sends another for each route change", async () => {
    const { services } = renderApp("/2026-12", (month) =>
      month === "2027-01" ? publicJanuary2027 : publicDecember2026,
    );
    await screen.findByRole("heading", { name: "December 2026" });
    fireEvent.click(screen.getByRole("link", { name: "Next month" }));
    await screen.findByRole("heading", { name: "January 2027" });
    expect(location()).toHaveTextContent("PUSH /2027-01");
    await waitFor(() =>
      expect(services.pageCounts.page.mock.calls).toEqual([
        ["2026-12"],
        ["2027-01"],
      ]),
    );
  });

  test("sends none when a poll reloads the month", async () => {
    const { services } = renderApp("/2026-12", () => publicDecember2026);
    await screen.findByRole("heading", { name: "December 2026" });
    await act(() => vi.advanceTimersByTimeAsync(PUBLIC_MONTH_REFETCH_INTERVAL));
    await waitFor(() => expect(services.getMonth).toHaveBeenCalledTimes(2));
    expect(services.pageCounts.page).toHaveBeenCalledTimes(1);
  });
});
