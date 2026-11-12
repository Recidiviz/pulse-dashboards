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

import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ComponentProps, forwardRef, ReactNode } from "react";
import {
  Link as RouterLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

import type { YearMonthOption } from "~@parole-board/common";
import { useMonthsList, usePrefetchMonth } from "~@parole-board/common";
import {
  december2026Summary,
  infiniteQueryResult,
  monthListPage,
  november2026Summary,
  september2026Summary,
} from "~@parole-board/common/fixtures";
import { createFakeHost, renderWithHost } from "~@parole-board/common/testing";

import { formatMonthYear, parseYearMonthParam } from "../../model/month";
import { MonthHeader } from "../MonthHeader";
import { MonthLink, MonthNav } from "../MonthNav";
import { MonthPicker } from "../MonthPicker";

vi.mock("~@parole-board/common", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~@parole-board/common")>()),
  useMonthsList: vi.fn(),
  usePrefetchMonth: vi.fn(),
}));

const BASE = "/parole/public-calendar";
// The clock is at 2026-10-08 in Denver.
const OCTOBER_2026 = { year: 2026, month: 10 };
const earlierPage = monthListPage([september2026Summary], {
  nextCursor: { year: 2026, month: 9 },
});
const laterPage = monthListPage([november2026Summary, december2026Summary], {
  prevCursor: { year: 2026, month: 11 },
});

let listResult: ReturnType<typeof infiniteQueryResult>;
const prefetch = vi.fn();

function mockMonthsList(
  ...args: Parameters<typeof infiniteQueryResult<typeof earlierPage>>
) {
  listResult = infiniteQueryResult(...args);
  vi.spyOn(listResult, "fetchNextPage");
  vi.spyOn(listResult, "fetchPreviousPage");
  vi.mocked(useMonthsList).mockReturnValue(
    listResult as unknown as ReturnType<typeof useMonthsList>,
  );
}

type HeaderOptions = {
  previous?: YearMonthOption | null;
  next?: YearMonthOption | null;
  actions?: ReactNode;
};

function LocationDisplay() {
  const { pathname, search } = useLocation();
  return <p data-testid="location">{pathname + search}</p>;
}

// The header as the admin view composes it, on the month's route.
function Header({
  previous = { year: 2026, month: 9 },
  next = { year: 2026, month: 11 },
  actions,
}: HeaderOptions) {
  const viewed = parseYearMonthParam(useParams()["yearMonth"]);
  if (!viewed) return null;
  return (
    <MonthHeader
      title={formatMonthYear(viewed)}
      navigation={
        <MonthNav>
          <MonthLink month={previous} label="Previous month">
            ‹
          </MonthLink>
          <MonthPicker viewed={viewed} current={OCTOBER_2026} />
          <MonthLink month={next} label="Next month">
            ›
          </MonthLink>
        </MonthNav>
      }
      actions={actions}
    />
  );
}

function renderHeader(
  options: HeaderOptions = {},
  { route = `${BASE}/2026-10`, host = createFakeHost() } = {},
) {
  return renderWithHost(
    <Routes>
      <Route
        path={`${BASE}/*`}
        element={
          <>
            <Routes>
              <Route path=":yearMonth" element={<Header {...options} />} />
            </Routes>
            <LocationDisplay />
          </>
        }
      />
    </Routes>,
    { route, host },
  );
}

const location = () => screen.getByTestId("location");

const picker = () => screen.getByRole("combobox", { name: "Month" });

const optionNames = () =>
  within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .map((option) => option.textContent);

beforeEach(() => {
  vi.mocked(useMonthsList).mockReset();
  mockMonthsList([earlierPage, laterPage], {
    hasNextPage: true,
    hasPreviousPage: true,
  });
  prefetch.mockReset();
  vi.mocked(usePrefetchMonth).mockReturnValue(prefetch);
});

describe("MonthHeader", () => {
  test("shows the eyebrow and the title as the page heading, with no status tag", () => {
    renderWithHost(<MonthHeader title="October 2026" />);

    expect(screen.getByText("Public Calendar")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "October 2026" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/draft|published/i)).not.toBeInTheDocument();
  });

  test("renders what it's given for the navigation and the actions", () => {
    renderWithHost(
      <MonthHeader
        title="October 2026"
        navigation={<button type="button">+ Add month</button>}
        actions={<button type="button">Review & Publish</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "+ Add month" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review & Publish" }),
    ).toBeInTheDocument();
  });

  test("has no Facility patterns link", () => {
    renderHeader();

    expect(
      screen.queryByRole("link", { name: /facility patterns/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /facility patterns/i }),
    ).not.toBeInTheDocument();
  });

  test("has no axe violations, with the menu open", async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(picker());

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MonthLink", () => {
  test("links to the month by a path relative to the month's route", () => {
    renderHeader({}, { route: `${BASE}/2026-10?tenantId=US_CO` });

    const nav = screen.getByRole("navigation", { name: "Months" });
    expect(
      within(nav).getByRole("link", { name: "Previous month" }),
    ).toHaveAttribute("href", `${BASE}/2026-09`);
    expect(
      within(nav).getByRole("link", { name: "Next month" }),
    ).toHaveAttribute("href", `${BASE}/2026-11`);
  });

  test("goes to the month when followed", async () => {
    renderHeader();

    await userEvent.click(screen.getByRole("link", { name: "Next month" }));

    expect(location()).toHaveTextContent(`${BASE}/2026-11`);
    expect(
      screen.getByRole("heading", { level: 1, name: "November 2026" }),
    ).toBeInTheDocument();
  });

  test("renders the host's Link, which can keep the query string", async () => {
    // A stand-in for the staff Link, which adds the current tenantId.
    const HostLink = forwardRef<
      HTMLAnchorElement,
      ComponentProps<typeof RouterLink>
    >(function HostLink({ to, ...props }, ref) {
      const pathname = typeof to === "string" ? to : to.pathname;
      return (
        <RouterLink
          ref={ref}
          to={{ pathname, search: "?tenantId=US_CO" }}
          {...props}
        />
      );
    });
    renderHeader({}, { host: createFakeHost({ Link: HostLink }) });

    await userEvent.click(screen.getByRole("link", { name: "Next month" }));

    expect(location()).toHaveTextContent(`${BASE}/2026-11?tenantId=US_CO`);
  });

  test("is a disabled button with the same label when there's no month", () => {
    renderHeader({ previous: null, next: null });

    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("prefetches its month, and again on hover and focus", async () => {
    renderHeader();

    expect(usePrefetchMonth).toHaveBeenCalledWith({ year: 2026, month: 11 });
    expect(usePrefetchMonth).toHaveBeenCalledWith({ year: 2026, month: 9 });

    await userEvent.hover(screen.getByRole("link", { name: "Next month" }));
    expect(prefetch).toHaveBeenCalledOnce();

    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Previous month" })).toHaveFocus();
    expect(prefetch).toHaveBeenCalledTimes(2);
  });
});

describe("MonthPicker", () => {
  test("lists the months from both pages in order, with the viewed month inserted and past months marked", async () => {
    renderHeader();

    await userEvent.click(picker());

    expect(optionNames()).toEqual([
      "September 2026 · past",
      "October 2026",
      "November 2026",
      "December 2026",
    ]);
    expect(useMonthsList).toHaveBeenCalledWith({
      around: OCTOBER_2026,
      search: undefined,
    });
  });

  test("opens on the current month", async () => {
    const { container } = renderHeader();

    await userEvent.click(picker());

    expect(
      screen.getByRole("option", { name: "October 2026", selected: true }),
    ).toBeInTheDocument();
    // react-select marks the option the keyboard is on with this class.
    expect(
      container.querySelector(".MonthPicker__option--is-focused"),
    ).toHaveTextContent("October 2026");
  });

  test("opens on the viewed month when it isn't the current one, with the list centred on the current month", async () => {
    const { container } = renderHeader({}, { route: `${BASE}/2026-09` });

    await userEvent.click(picker());

    expect(
      container.querySelector(".MonthPicker__option--is-focused"),
    ).toHaveTextContent("September 2026 · past");
    expect(useMonthsList).toHaveBeenCalledWith({
      around: OCTOBER_2026,
      search: undefined,
    });
  });

  test("shows the viewed month's label, past or not", () => {
    renderHeader({}, { route: `${BASE}/2026-09` });

    expect(screen.getByText("September 2026 · past")).toBeInTheDocument();
  });

  test("sends typed text to months.list as the search", async () => {
    renderHeader();

    await userEvent.type(picker(), "Oct");

    expect(useMonthsList).toHaveBeenLastCalledWith({
      around: OCTOBER_2026,
      search: "Oct",
    });
  });

  test("lists only the search results while searching", async () => {
    renderHeader();
    mockMonthsList([monthListPage([november2026Summary])]);

    await userEvent.type(picker(), "Nov");

    expect(optionNames()).toEqual(["November 2026"]);
  });

  test("goes to the month picked with the keyboard alone, keeping the query string", async () => {
    renderHeader({}, { route: `${BASE}/2026-10?tenantId=US_CO` });

    await userEvent.tab();
    await userEvent.tab();
    expect(picker()).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(location()).toHaveTextContent(`${BASE}/2026-11?tenantId=US_CO`);
  });

  test("loads the next page at the bottom of the menu and the previous one at the top", async () => {
    renderHeader();
    await userEvent.click(picker());
    const menuList = screen.getByRole("listbox");

    fireEvent.wheel(menuList, { deltaY: 10 });
    fireEvent.wheel(menuList, { deltaY: -10 });

    expect(listResult.fetchNextPage).toHaveBeenCalled();
    expect(listResult.fetchPreviousPage).toHaveBeenCalled();
  });
});
