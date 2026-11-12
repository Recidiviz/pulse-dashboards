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

import { QueryClient } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import toast from "react-hot-toast";
import ReactModal from "react-modal";
import { Route, Routes, useLocation } from "react-router-dom";

import type {
  CreateMonthsResult,
  MonthDetail,
  YearMonthOption,
} from "~@parole-board/common";
import {
  CalendarGrid,
  useAddMonthOptions,
  useCalendarConfig,
  useCreateMonths,
  useCurrentPatterns,
  useMonth,
  useMonthsList,
} from "~@parole-board/common";
import {
  addMonthChoices,
  calendarApiConfig,
  calendarApiError,
  december2026Summary,
  infiniteQueryResult,
  monthDetail,
  monthSummariesPage,
  mutationResult,
  november2026Summary,
  publishPreview,
  queryResult,
  september2026Config,
  september2026MonthDetail,
  september2026MonthDetailWithHolidayHearings,
  september2026Summary,
  suspendedQuery,
} from "~@parole-board/common/fixtures";
import {
  createFakeCalendarTrpc,
  createFakeHost,
  FakeCalendarProcedures,
  renderWithHost,
} from "~@parole-board/common/testing";

import { AdminRoutes } from "../AdminRoutes";
import { MONTH_LOAD_ERROR_TITLE } from "../loadErrors";
import { MOVE_TOAST_ID } from "../model/useMoveEntryFlow";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("~@parole-board/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@parole-board/common")>();
  return {
    ...actual,
    // Wrapped so a test can drop chips through its onEntriesDrop, since jsdom
    // can't run a real drag.
    CalendarGrid: vi.fn(),
    useAddMonthOptions: vi.fn(),
    useCalendarConfig: vi.fn(),
    useCreateMonths: vi.fn(),
    useCurrentPatterns: vi.fn(),
    useMonth: vi.fn(),
    useMonthsList: vi.fn(),
  };
});

const actualHooks = await vi.importActual<
  typeof import("~@parole-board/common")
>("~@parole-board/common");

const BASE = "/parole/public-calendar";
const FORBIDDEN_MESSAGE = "You don't have access to the Public Calendar.";

const storedMonths: Record<string, MonthDetail> = {
  "2026-9": september2026MonthDetail,
  "2026-11": monthDetail(november2026Summary),
  "2026-12": monthDetail(december2026Summary),
};

/** Answers months.get from storedMonths, read on each call. */
const storedMonth = ({ year, month }: YearMonthOption) =>
  storedMonths[`${year}-${month}`] ?? null;

/**
 * Answers useMonth from storedMonths, read on each call so a test can change
 * a month mid-test, with replacements taking the place of stored months.
 */
function mockStoredMonths(replacements: Record<string, MonthDetail> = {}) {
  vi.mocked(useMonth).mockImplementation(({ year, month }: YearMonthOption) => {
    const key = `${year}-${month}`;
    return queryResult(
      replacements[key] ?? storedMonths[key] ?? null,
    ) as ReturnType<typeof useMonth>;
  });
}

/**
 * Switches the data hooks back to the real ones, reading through a fake
 * calendar client that answers config.get, months.list and months.get from
 * storedMonths. getMonth answers months.get when passed, such as with a
 * promise that never settles, and procedures answers any others.
 */
function withRealHooks(
  getMonth: (input: YearMonthOption) => unknown = storedMonth,
  procedures: FakeCalendarProcedures = {},
) {
  vi.mocked(useCalendarConfig).mockImplementation(
    actualHooks.useCalendarConfig,
  );
  vi.mocked(useMonthsList).mockImplementation(actualHooks.useMonthsList);
  vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
  return createFakeCalendarTrpc({
    procedures: {
      "admin.config.get": () => calendarApiConfig,
      "admin.months.list": () => monthSummariesPage,
      "admin.months.get": (input) => getMonth(input as YearMonthOption),
      ...procedures,
    },
  });
}

function LocationDisplay() {
  const { pathname, search } = useLocation();
  return (
    <>
      <p data-testid="location">{`${pathname}${search}`}</p>
      <p data-testid="search">{search}</p>
    </>
  );
}

function renderAdmin(path: string, host = createFakeHost()) {
  vi.spyOn(host.analyticsStore, "trackPbPublicCalendarAdminViewed");
  return renderWithHost(
    <Routes>
      <Route
        path={`${BASE}/*`}
        element={
          <>
            <AdminRoutes />
            <LocationDisplay />
          </>
        }
      />
    </Routes>,
    { host, route: path },
  );
}

const title = (name: string) =>
  screen.findByRole("heading", { level: 1, name });

// The routes lazy-load the month view. Loading it once here keeps that
// import out of the first test's wait for the title, which CI runners can
// take longer than findByRole's timeout to finish.
beforeAll(async () => {
  await import("../ParoleCalendarAdminView");
});

beforeEach(() => {
  window.sessionStorage.clear();
  // 2026-10-08, 7pm in Denver, when it's already 2026-10-09 in UTC.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-09T01:00:00Z"));
  // React logs every error a boundary catches.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(CalendarGrid).mockImplementation(actualHooks.CalendarGrid);
  vi.mocked(useCalendarConfig).mockReturnValue(
    queryResult(september2026Config) as ReturnType<typeof useCalendarConfig>,
  );
  vi.mocked(useMonthsList).mockReturnValue(
    infiniteQueryResult([monthSummariesPage]) as unknown as ReturnType<
      typeof useMonthsList
    >,
  );
  mockStoredMonths();
  // The month view always renders the closed Add a month dialog, which holds
  // the create mutation.
  vi.mocked(useCreateMonths).mockReturnValue(
    mutationResult() as ReturnType<typeof useCreateMonths>,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("routes", () => {
  test("the index redirects to the current month in Denver", async () => {
    renderAdmin(BASE);

    expect(await title("October 2026")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(`${BASE}/2026-10`);
  });

  test.each(["2026-13", "abc", "1999-12"])(
    "an invalid month (%s) redirects to the index, then the current month",
    async (param) => {
      renderAdmin(`${BASE}/${param}`);

      expect(await title("October 2026")).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent(
        `${BASE}/2026-10`,
      );
    },
  );

  test("the index redirect keeps the query string", async () => {
    renderAdmin(`${BASE}?tenantId=US_CO`);

    expect(await title("October 2026")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      `${BASE}/2026-10?tenantId=US_CO`,
    );
  });

  test("an invalid month's redirect keeps the query string", async () => {
    renderAdmin(`${BASE}/2026-13?tenantId=US_CO`);

    expect(await title("October 2026")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      `${BASE}/2026-10?tenantId=US_CO`,
    );
  });

  test("a past month in the URL renders like any other month", async () => {
    renderAdmin(`${BASE}/2026-09`);

    expect(await title("September 2026")).toBeInTheDocument();
    expect(screen.getByText("September 2026 · past")).toBeInTheDocument();
  });

  test("an unknown path shows the not-found message", async () => {
    renderAdmin(`${BASE}/2026-10/extra`);

    expect(
      await screen.findByText("This page doesn't exist."),
    ).toBeInTheDocument();
  });
});

describe("ParoleCalendarAdminView", () => {
  test("shows the month's header and DRAFT banner", async () => {
    const { container } = renderAdmin(`${BASE}/2026-12`);

    expect(await title("December 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Month status" }),
    ).toHaveTextContent("December 2026 is back in draft");
    expect(await axe(container)).toHaveNoViolations();
  });

  test("shows no DRAFT banner for a published month", async () => {
    renderAdmin(`${BASE}/2026-11`);

    expect(await title("November 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Month status" }),
    ).toHaveTextContent("UPLOAD COMPLETE");
    expect(screen.queryByText("DRAFT")).not.toBeInTheDocument();
  });

  test("shows the empty state for a month that doesn't exist", async () => {
    const { container } = renderAdmin(`${BASE}/2026-10`);

    expect(await title("October 2026")).toBeInTheDocument();
    expect(
      screen.getByText("No calendar yet for October 2026."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Month status" }),
    ).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("shows the month section's skeleton under the header, and no spinner, while the month loads", async () => {
    vi.mocked(useMonth).mockImplementation(suspendedQuery);

    renderAdmin(`${BASE}/2026-10`);

    expect(
      await screen.findByLabelText("Loading the month"),
    ).toBeInTheDocument();
    expect(await title("October 2026")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Loading the calendar"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  test("shows the page skeleton while the month list first loads", async () => {
    vi.mocked(useMonthsList).mockImplementation(suspendedQuery);

    renderAdmin(`${BASE}/2026-10`);

    expect(
      await screen.findByLabelText("Loading the calendar"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  test("shows the access message for FORBIDDEN", async () => {
    vi.mocked(useMonth).mockImplementation(() => {
      throw calendarApiError("FORBIDDEN", "Not allowed");
    });

    renderAdmin(`${BASE}/2026-10`);

    expect(await screen.findByText(FORBIDDEN_MESSAGE)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  test("shows the load error for any other error, and Try again loads the month", async () => {
    let fail = true;
    vi.mocked(useMonth).mockImplementation(() => {
      if (fail) throw calendarApiError("INTERNAL_SERVER_ERROR", "boom");
      return queryResult(storedMonths["2026-11"]) as ReturnType<
        typeof useMonth
      >;
    });

    renderAdmin(`${BASE}/2026-11`);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(MONTH_LOAD_ERROR_TITLE);
    expect(screen.queryByText(FORBIDDEN_MESSAGE)).not.toBeInTheDocument();

    fail = false;
    await userEvent.click(
      within(alert).getByRole("button", { name: "Try again" }),
    );

    expect(await title("November 2026")).toBeInTheDocument();
  });

  test("keeps showing the month when a background refetch fails", async () => {
    vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
    let fail = false;
    const calendarTrpc = createFakeCalendarTrpc({
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
      procedures: {
        "admin.months.get": () => {
          if (fail) throw calendarApiError("INTERNAL_SERVER_ERROR", "boom");
          return storedMonths["2026-11"];
        },
      },
    });

    renderAdmin(`${BASE}/2026-11`, createFakeHost({ calendarTrpc }));
    expect(await title("November 2026")).toBeInTheDocument();

    fail = true;
    await calendarTrpc.queryClient.refetchQueries();
    const monthQuery = calendarTrpc.queryClient.getQueryState(
      calendarTrpc.querier.admin.months.get.queryKey({ year: 2026, month: 11 }),
    );
    expect(monthQuery?.error).toBeTruthy();

    expect(
      screen.getByRole("heading", { level: 1, name: "November 2026" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("changing month", () => {
  test("shows a cached month at once, with no skeleton", async () => {
    const calendarTrpc = withRealHooks();
    renderAdmin(`${BASE}/2026-11`, createFakeHost({ calendarTrpc }));
    expect(await title("November 2026")).toBeInTheDocument();
    // The Next month link loads December into the cache as it renders.
    await waitFor(() =>
      expect(
        calendarTrpc.queryClient.getQueryData(
          calendarTrpc.querier.admin.months.get.queryKey({
            year: 2026,
            month: 12,
          }),
        ),
      ).toBeTruthy(),
    );

    await userEvent.click(screen.getByRole("link", { name: "Next month" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "December 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Month status" }),
    ).toHaveTextContent("December 2026 is back in draft");
    expect(
      screen.queryByRole("status", { name: "Loading the month" }),
    ).not.toBeInTheDocument();
  });

  test("keeps the header and shows only the month section's skeleton for a month that isn't cached", async () => {
    const calendarTrpc = withRealHooks(({ year, month }) =>
      month === 12
        ? new Promise(() => undefined)
        : storedMonths[`${year}-${month}`] ?? null,
    );
    renderAdmin(`${BASE}/2026-11`, createFakeHost({ calendarTrpc }));
    expect(await title("November 2026")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Next month" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "December 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Months" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading the month" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Loading the calendar"),
    ).not.toBeInTheDocument();
    // The header holds its actions' place with two placeholders.
    expect(
      screen
        .getAllByTestId("skeleton")
        .filter((element) => !element.closest('[role="status"]')),
    ).toHaveLength(2);
  });
});

describe("month body", () => {
  const SEPTEMBER = `${BASE}/2026-09`;

  const dayCell = (date: string) => {
    const cell = document.querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (!cell) throw new Error(`No cell for ${date}`);
    return cell;
  };
  // By hover title, the facility's full name, since jsdom leaves FullCalendar's
  // chips at visibility: hidden, which hides their text from name queries.
  const chip = (date: string, fullName: string) =>
    within(dayCell(date)).getByTitle(fullName);
  const fcf14 = () => chip("2026-09-14", "Fremont Correctional Facility");
  const ccf15 = () => chip("2026-09-15", "Centennial Correctional Facility");
  const pressed = () => document.querySelectorAll('[aria-pressed="true"]');
  const publishedSeptember: MonthDetail = {
    ...september2026MonthDetail,
    status: "PUBLISHED",
    latestPublication: november2026Summary.latestPublication,
  };

  beforeEach(() => {
    // 2026-09-08 in Denver, so September is the current month and editable.
    vi.setSystemTime(new Date("2026-09-08T18:00:00Z"));
  });

  // The header shows from the URL at once, so the grid says the month has
  // loaded.
  const septemberGrid = () =>
    screen.findByRole("region", { name: "September 2026 calendar" });

  async function renderSeptember() {
    const result = renderAdmin(SEPTEMBER);
    expect(await title("September 2026")).toBeInTheDocument();
    return result;
  }

  test("shows the server's counts and the grid for the month", async () => {
    await renderSeptember();

    const counts = screen.getByText("Hearing days").closest("dl");
    expect(counts).toHaveTextContent("Hearing days13Hearings37");
    expect(
      screen.getByRole("region", { name: "September 2026 calendar" }),
    ).toBeInTheDocument();
  });

  test("titles each chip with the facility's full name and keeps the label as its text", async () => {
    await renderSeptember();

    expect(fcf14()).toHaveTextContent("FCF");
    expect(chip("2026-09-25", "Business Mtg")).toHaveTextContent(
      "Business Mtg",
    );
  });

  test("clicking a chip selects it and shows the action bar with the facility and day", async () => {
    const user = userEvent.setup();
    const { container } = await renderSeptember();
    expect(screen.queryByText(/· September/)).not.toBeInTheDocument();

    await user.click(fcf14());

    expect(fcf14()).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("· September 14").parentElement).toHaveTextContent(
      "FCF · September 14",
    );
    expect(await axe(container)).toHaveNoViolations();

    await user.click(fcf14());

    expect(fcf14()).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/· September/)).not.toBeInTheDocument();
  });

  test("a second chip on another day keeps both selected and drops the facility and day from the bar", async () => {
    const user = userEvent.setup();
    await renderSeptember();

    await user.click(fcf14());
    await user.click(ccf15());

    expect(fcf14()).toHaveAttribute("aria-pressed", "true");
    expect(ccf15()).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/· September/)).not.toBeInTheDocument();
  });

  test("Enter and Space on a focused chip toggle it", async () => {
    const user = userEvent.setup();
    await renderSeptember();

    fcf14().focus();
    await user.keyboard("{Enter}");
    expect(fcf14()).toHaveAttribute("aria-pressed", "true");

    await user.keyboard(" ");
    expect(fcf14()).toHaveAttribute("aria-pressed", "false");
  });

  test("switching months clears the selection", async () => {
    const user = userEvent.setup();
    await renderSeptember();
    await user.click(fcf14());
    await user.click(ccf15());

    await user.click(screen.getByRole("link", { name: "Next month" }));
    expect(await title("November 2026")).toBeInTheDocument();
    expect(pressed()).toHaveLength(0);

    await user.click(screen.getByRole("link", { name: "Previous month" }));
    expect(await title("September 2026")).toBeInTheDocument();
    expect(fcf14()).toHaveAttribute("aria-pressed", "false");
    expect(pressed()).toHaveLength(0);
    expect(screen.queryByText(/· September/)).not.toBeInTheDocument();
  });

  test("a published month is read-only: no selection and no action bar", async () => {
    const user = userEvent.setup();
    vi.mocked(useMonth).mockReturnValue(
      queryResult(publishedSeptember) as ReturnType<typeof useMonth>,
    );
    await renderSeptember();

    await user.click(fcf14());

    expect(fcf14()).not.toHaveAttribute("aria-pressed");
    expect(pressed()).toHaveLength(0);
    expect(screen.queryByText(/· September/)).not.toBeInTheDocument();
  });

  test("a past month is read-only: no selection and no action bar", async () => {
    const user = userEvent.setup();
    vi.setSystemTime(new Date("2026-10-08T18:00:00Z"));
    await renderSeptember();

    await user.click(fcf14());

    expect(fcf14()).not.toHaveAttribute("aria-pressed");
    expect(screen.queryByText(/· September/)).not.toBeInTheDocument();
  });

  describe("on a holiday", () => {
    const fcf7 = () => chip("2026-09-07", "Fremont Correctional Facility");
    const ctcf7 = () =>
      chip("2026-09-07", "Colorado Territorial Correctional Facility");
    const laborDay = () => within(dayCell("2026-09-07")).getByText("Labor Day");

    test("labels the day with the holiday's name", async () => {
      await renderSeptember();

      expect(laborDay()).toHaveTextContent(/^Labor Day$/);
      expect(
        within(dayCell("2026-09-14")).queryByText("Labor Day"),
      ).not.toBeInTheDocument();
    });

    test("marks the day for screen readers when entries sit on it, with no badge on them", async () => {
      mockStoredMonths({
        "2026-9": september2026MonthDetailWithHolidayHearings,
      });
      const { container } = await renderSeptember();

      expect(laborDay()).toHaveTextContent(
        "Labor Day, holiday with sessions scheduled",
      );
      expect(fcf7()).toHaveTextContent(/^FCF$/);
      expect(ctcf7()).toHaveTextContent(/^CTCF$/);
      expect(screen.getByText("Hearing days").closest("dl")).toHaveTextContent(
        "Hearing days14Hearings39",
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    test("an entry on it can be selected like any other", async () => {
      mockStoredMonths({
        "2026-9": september2026MonthDetailWithHolidayHearings,
      });
      const user = userEvent.setup();
      await renderSeptember();

      await user.click(fcf7());

      expect(fcf7()).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("· September 7")).toBeInTheDocument();
    });
  });

  describe("on a refetch", () => {
    function renderWithServer() {
      vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
      let month = september2026MonthDetail;
      const calendarTrpc = createFakeCalendarTrpc({
        procedures: {
          // A new object each time, as the network returns.
          "admin.months.get": () => structuredClone(month),
        },
      });
      renderAdmin(SEPTEMBER, createFakeHost({ calendarTrpc }));
      return {
        calendarTrpc,
        setMonth: (next: MonthDetail) => {
          month = next;
        },
      };
    }

    test("with unchanged data, keeps the selection", async () => {
      const user = userEvent.setup();
      const { calendarTrpc } = renderWithServer();
      expect(await septemberGrid()).toBeInTheDocument();
      await user.click(fcf14());

      await calendarTrpc.queryClient.refetchQueries();

      expect(fcf14()).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("· September 14")).toBeInTheDocument();
    });

    test("that drops a selected entry, drops it from the selection", async () => {
      const user = userEvent.setup();
      const { calendarTrpc, setMonth } = renderWithServer();
      expect(await septemberGrid()).toBeInTheDocument();
      await user.click(fcf14());
      await user.click(ccf15());

      setMonth({
        ...september2026MonthDetail,
        entries: september2026MonthDetail.entries.filter(
          (entry) => entry.id !== "2026-09-15:HEARING:CCF",
        ),
      });
      await calendarTrpc.queryClient.refetchQueries();

      expect(await screen.findByText("· September 14")).toBeInTheDocument();
      expect(fcf14()).toHaveAttribute("aria-pressed", "true");
      expect(pressed()).toHaveLength(1);
    });

    test("that finds the month published, as from another tab, clears the selection and the action bar", async () => {
      const user = userEvent.setup();
      const { calendarTrpc, setMonth } = renderWithServer();
      expect(await septemberGrid()).toBeInTheDocument();
      await user.click(fcf14());

      setMonth(publishedSeptember);
      await calendarTrpc.queryClient.refetchQueries();

      // A published month is read-only, so its chips can't be pressed.
      await waitFor(() => expect(fcf14()).not.toHaveAttribute("aria-pressed"));
      expect(pressed()).toHaveLength(0);
      expect(screen.queryByText(/· September/)).not.toBeInTheDocument();
    });

    test("marks a holiday once an entry moves onto it, and clears it when it moves off", async () => {
      const { calendarTrpc, setMonth } = renderWithServer();
      expect(await septemberGrid()).toBeInTheDocument();
      const laborDay = () =>
        within(dayCell("2026-09-07")).getByText("Labor Day");
      const fcfOn = (date: string) =>
        within(dayCell(date)).queryByTitle("Fremont Correctional Facility");
      const moveFcf14To = (date: string) =>
        setMonth({
          ...september2026MonthDetail,
          entries: september2026MonthDetail.entries.map((entry) =>
            entry.id === "2026-09-14:HEARING:FCF" ? { ...entry, date } : entry,
          ),
        });
      expect(laborDay()).toHaveTextContent(/^Labor Day$/);

      moveFcf14To("2026-09-07");
      await calendarTrpc.queryClient.refetchQueries();

      await waitFor(() =>
        expect(laborDay()).toHaveTextContent(
          "Labor Day, holiday with sessions scheduled",
        ),
      );
      expect(fcfOn("2026-09-07")).toHaveTextContent(/^FCF$/);

      moveFcf14To("2026-09-08");
      await calendarTrpc.queryClient.refetchQueries();

      await waitFor(() => expect(fcfOn("2026-09-08")).toBeInTheDocument());
      expect(laborDay()).toHaveTextContent(/^Labor Day$/);
    });
  });

  describe("entry actions", () => {
    const DELETE_FCF = "Delete hearing: FCF on September 14";
    const deleteFcf = () => screen.getByRole("button", { name: DELETE_FCF });

    // What entries.delete returns for FCF on September 14: the month without
    // it.
    const septemberWithoutFcf14 = {
      ...september2026MonthDetail,
      entries: september2026MonthDetail.entries.filter(
        (entry) => entry.id !== "2026-09-14:HEARING:FCF",
      ),
    };

    /**
     * Renders September on 2026-09-08 through the real useMonth, with
     * months.get answering month and entries.delete answering deleteEntry.
     */
    function renderEditableSeptember({
      month = september2026MonthDetail,
      deleteEntry = () => ({ month: septemberWithoutFcf14 }),
    }: {
      month?: MonthDetail;
      deleteEntry?: (input: unknown) => unknown;
    } = {}) {
      const deleteProcedure = vi.fn(deleteEntry);
      const getMonth = vi.fn(() => structuredClone(month));
      vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
      const host = createFakeHost({
        calendarTrpc: createFakeCalendarTrpc({
          procedures: {
            "admin.months.get": getMonth,
            "admin.entries.delete": deleteProcedure,
          },
        }),
      });
      vi.spyOn(host.analyticsStore, "trackPbPublicCalendarHearingDeleted");
      renderAdmin(SEPTEMBER, host);
      return { host, deleteProcedure, getMonth };
    }

    test("one hearing selected in the current month shows Delete hearing, named for the hearing and day", async () => {
      const user = userEvent.setup();
      renderEditableSeptember();
      await septemberGrid();

      await user.click(fcf14());

      expect(deleteFcf()).toHaveTextContent("Delete hearing");
    });

    test("a published month is read-only: no Delete hearing", async () => {
      const user = userEvent.setup();
      renderEditableSeptember({ month: publishedSeptember });
      await septemberGrid();

      await user.click(fcf14());

      expect(
        screen.queryByRole("button", { name: /Delete hearing/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    test("a past month is read-only: no Delete hearing", async () => {
      const user = userEvent.setup();
      vi.setSystemTime(new Date("2026-10-08T18:00:00Z"));
      await renderSeptember();

      await user.click(fcf14());

      expect(
        screen.queryByRole("button", { name: /Delete hearing/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    test("Full Board shows Delete hearing and a Business Meeting doesn't", async () => {
      const user = userEvent.setup();
      renderEditableSeptember();
      await septemberGrid();

      await user.click(chip("2026-09-11", "Full Board"));
      expect(
        screen.getByRole("button", {
          name: "Delete hearing: Full Board on September 11",
        }),
      ).toBeInTheDocument();

      await user.click(chip("2026-09-11", "Full Board"));
      await user.click(chip("2026-09-25", "Business Mtg"));
      expect(screen.getByText("· September 25")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Delete hearing/ }),
      ).not.toBeInTheDocument();
    });

    test("several selected show no Delete hearing", async () => {
      const user = userEvent.setup();
      renderEditableSeptember();
      await septemberGrid();

      await user.click(fcf14());
      await user.click(ccf15());

      expect(
        screen.queryByRole("button", { name: /Delete hearing/ }),
      ).not.toBeInTheDocument();
    });

    test("the arrow keys reach both of the question's buttons inside the toolbar", async () => {
      const user = userEvent.setup();
      renderEditableSeptember();
      await septemberGrid();
      await user.click(fcf14());

      await user.click(deleteFcf());
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
    });

    test("Delete sends the entry's version, shows the returned month without a refetch, clears the selection, reports the delete and moves focus to the month title", async () => {
      const user = userEvent.setup();
      const { host, deleteProcedure, getMonth } = renderEditableSeptember();
      await septemberGrid();
      await user.click(fcf14());
      const fetches = getMonth.mock.calls.length;

      await user.click(deleteFcf());
      await user.click(screen.getByRole("button", { name: "Delete" }));

      const heading = await title("September 2026");
      await waitFor(() => expect(heading).toHaveFocus());
      expect(deleteProcedure).toHaveBeenCalledWith({
        entryId: "2026-09-14:HEARING:FCF",
        expectedVersion: 1,
      });
      expect(
        host.analyticsStore.trackPbPublicCalendarHearingDeleted,
      ).toHaveBeenCalledExactlyOnceWith({
        year: 2026,
        month: 9,
        kind: "HEARING",
      });
      expect(toast).toHaveBeenCalledWith("Deleted FCF from September 14", {
        id: "pb-calendar-entry-delete",
      });
      expect(pressed()).toHaveLength(0);
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
      expect(
        within(dayCell("2026-09-14")).queryByTitle(
          "Fremont Correctional Facility",
        ),
      ).not.toBeInTheDocument();
      expect(getMonth).toHaveBeenCalledTimes(fetches);
    });

    test("CONFLICT toasts the server's message, refetches the month and sends no analytics", async () => {
      const user = userEvent.setup();
      const message =
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.";
      const { host, getMonth } = renderEditableSeptember({
        deleteEntry: () => {
          throw calendarApiError("CONFLICT", message);
        },
      });
      await septemberGrid();
      await user.click(fcf14());
      const fetches = getMonth.mock.calls.length;

      await user.click(deleteFcf());
      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(deleteFcf()).toHaveFocus());
      expect(toast.error).toHaveBeenCalledWith(message, {
        id: "pb-calendar-entry-delete",
      });
      expect(
        host.analyticsStore.trackPbPublicCalendarHearingDeleted,
      ).not.toHaveBeenCalled();
      expect(getMonth.mock.calls.length).toBeGreaterThan(fetches);
    });

    test("PRECONDITION_FAILED from a month published in another tab toasts the server's message, and the refetched month is read-only", async () => {
      const user = userEvent.setup();
      const message =
        "September 2026 is published. Click Edit month to change it.";
      vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
      let month = september2026MonthDetail;
      const host = createFakeHost({
        calendarTrpc: createFakeCalendarTrpc({
          procedures: {
            "admin.months.get": () => structuredClone(month),
            // Another tab published the month before this delete arrived.
            "admin.entries.delete": () => {
              month = publishedSeptember;
              throw calendarApiError("PRECONDITION_FAILED", message);
            },
          },
        }),
      });
      renderAdmin(SEPTEMBER, host);
      await septemberGrid();
      await user.click(fcf14());

      await user.click(deleteFcf());
      await user.click(screen.getByRole("button", { name: "Delete" }));

      const heading = await title("September 2026");
      await waitFor(() => expect(heading).toHaveFocus());
      expect(toast.error).toHaveBeenCalledWith(message, {
        id: "pb-calendar-entry-delete",
      });
      // The refetch shows the month published, so its chips can't be pressed.
      expect(fcf14()).not.toHaveAttribute("aria-pressed");
      expect(pressed()).toHaveLength(0);
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });
  });

  describe("cancel and undo", () => {
    const FULL_BOARD = "2026-09-11:FULL_BOARD:Full Board";
    const CANCEL_FULL_BOARD = "Cancel Full Board on September 11";
    const UNDO_FULL_BOARD =
      "Undo the cancellation of Full Board on September 11";
    const fullBoard11 = () => chip("2026-09-11", "Full Board");
    const toolbarButtons = () =>
      within(screen.getByRole("toolbar"))
        .getAllByRole("button")
        .map((button) => button.textContent);

    /**
     * Renders September as the current month against a fake server whose
     * cancel and uncancel change the month that months.get returns and
     * return it, as the real server does.
     */
    function renderWithServer({
      cancel,
    }: { cancel?: (input: unknown) => unknown } = {}) {
      vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
      let month = september2026MonthDetail;
      const setCancelled = (input: unknown, cancelled: boolean) => {
        const { entryId } = input as { entryId: string };
        month = {
          ...month,
          entries: month.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, cancelled, version: entry.version + 1 }
              : entry,
          ),
        };
        return { month: structuredClone(month) };
      };
      const getMonth = vi.fn(() => structuredClone(month));
      const cancelProcedure = vi.fn(
        cancel ?? ((input: unknown) => setCancelled(input, true)),
      );
      const uncancelProcedure = vi.fn((input: unknown) =>
        setCancelled(input, false),
      );
      const host = createFakeHost({
        calendarTrpc: createFakeCalendarTrpc({
          procedures: {
            "admin.months.get": getMonth,
            "admin.entries.cancel": cancelProcedure,
            "admin.entries.uncancel": uncancelProcedure,
          },
        }),
      });
      const { container } = renderAdmin(SEPTEMBER, host);
      return { getMonth, cancelProcedure, uncancelProcedure, container };
    }

    test("a Full Board shows Cancel before Delete hearing, and a hearing shows no Cancel", async () => {
      const user = userEvent.setup();
      renderWithServer();
      await septemberGrid();

      await user.click(fullBoard11());
      expect(toolbarButtons()).toEqual([
        "Cancel",
        "Delete hearing",
        "Move to…",
      ]);

      await user.click(fullBoard11());
      await user.click(fcf14());
      expect(toolbarButtons()).toEqual(["Delete hearing", "Move to…"]);
    });

    test("a Business Meeting shows Cancel and no Delete hearing", async () => {
      const user = userEvent.setup();
      renderWithServer();
      await septemberGrid();

      await user.click(chip("2026-09-25", "Business Mtg"));

      expect(
        screen.getByRole("button", {
          name: "Cancel Business Mtg on September 25",
        }),
      ).toBeInTheDocument();
      expect(toolbarButtons()).toEqual(["Cancel", "Move to…"]);
    });

    test("a published month is read-only: no Cancel", async () => {
      const user = userEvent.setup();
      vi.mocked(useMonth).mockReturnValue(
        queryResult(publishedSeptember) as ReturnType<typeof useMonth>,
      );
      await renderSeptember();

      await user.click(fullBoard11());

      expect(
        screen.queryByRole("button", { name: CANCEL_FULL_BOARD }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    test("a past month is read-only: no Cancel", async () => {
      const user = userEvent.setup();
      vi.setSystemTime(new Date("2026-10-08T18:00:00Z"));
      await renderSeptember();

      await user.click(fullBoard11());

      expect(
        screen.queryByRole("button", { name: CANCEL_FULL_BOARD }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    test("a PRECONDITION_FAILED from a month published in another tab toasts the server's message, and the refetched month is read-only", async () => {
      const user = userEvent.setup();
      const message =
        "September 2026 is published. Click Edit month to change it.";
      const { getMonth } = renderWithServer({
        cancel: () => {
          throw calendarApiError("PRECONDITION_FAILED", message);
        },
      });
      await septemberGrid();
      await user.click(fullBoard11());
      // Another tab publishes the month before this cancel arrives.
      getMonth.mockImplementation(() => structuredClone(publishedSeptember));

      await user.click(screen.getByRole("button", { name: CANCEL_FULL_BOARD }));

      const heading = await title("September 2026");
      await waitFor(() => expect(heading).toHaveFocus());
      expect(toast.error).toHaveBeenCalledWith(message, {
        id: "pb-calendar-entry-cancel",
      });
      // The refetch shows the month published, so its chips can't be pressed.
      expect(fullBoard11()).not.toHaveAttribute("aria-pressed");
      expect(pressed()).toHaveLength(0);
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    test("Cancel sends the version and turns into Undo, which restores the meeting, with the meeting kept selected and no refetch", async () => {
      const user = userEvent.setup();
      const { cancelProcedure, uncancelProcedure, container, getMonth } =
        renderWithServer();
      await septemberGrid();
      await user.click(fullBoard11());
      const fetches = getMonth.mock.calls.length;

      // From the keyboard, so focus is on the button as the request starts.
      screen.getByRole("button", { name: CANCEL_FULL_BOARD }).focus();
      await user.keyboard("{Enter}");

      const undo = await screen.findByRole("button", {
        name: UNDO_FULL_BOARD,
      });
      await waitFor(() => expect(undo).toHaveFocus());
      expect(cancelProcedure).toHaveBeenCalledExactlyOnceWith({
        entryId: FULL_BOARD,
        expectedVersion: 1,
      });
      expect(toast).toHaveBeenCalledWith(
        "Cancelled Full Board on September 11",
        { id: "pb-calendar-entry-cancel" },
      );
      expect(fullBoard11()).toHaveAttribute("aria-pressed", "true");
      expect(fullBoard11()).toHaveTextContent("Full Board, cancelled");
      // The tag is on the chip only, not beside the day number.
      expect(within(dayCell("2026-09-11")).getAllByText("Cancelled")).toEqual([
        within(fullBoard11()).getByText("Cancelled"),
      ]);
      expect(await axe(container)).toHaveNoViolations();

      await user.click(undo);

      expect(
        await screen.findByRole("button", { name: CANCEL_FULL_BOARD }),
      ).toBeInTheDocument();
      expect(uncancelProcedure).toHaveBeenCalledExactlyOnceWith({
        entryId: FULL_BOARD,
        expectedVersion: 2,
      });
      expect(toast).toHaveBeenLastCalledWith(
        "Full Board on September 11 is back on",
        { id: "pb-calendar-entry-cancel" },
      );
      expect(fullBoard11()).not.toHaveTextContent("Cancelled");
      expect(getMonth).toHaveBeenCalledTimes(fetches);
    });

    test("a CONFLICT toasts the server's message and refetches the month", async () => {
      const user = userEvent.setup();
      const message =
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.";
      const { getMonth } = renderWithServer({
        cancel: () => {
          throw calendarApiError("CONFLICT", message);
        },
      });
      await septemberGrid();
      await user.click(fullBoard11());
      const fetches = getMonth.mock.calls.length;

      await user.click(screen.getByRole("button", { name: CANCEL_FULL_BOARD }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(message, {
          id: "pb-calendar-entry-cancel",
        }),
      );
      expect(getMonth.mock.calls.length).toBeGreaterThan(fetches);
      expect(
        screen.getByRole("button", { name: CANCEL_FULL_BOARD }),
      ).toBeEnabled();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});

describe("Add hearing", () => {
  const addHearing = () =>
    screen.queryByRole("button", { name: "+ Add hearing" });

  beforeAll(() => {
    ReactModal.setAppElement(document.createElement("div"));
  });

  // The header's actions read the month without suspending, so these tests
  // wait for the month's counts or empty state before checking them.
  const renderLoaded = async (path: string) => {
    const result = renderAdmin(
      path,
      createFakeHost({ calendarTrpc: withRealHooks() }),
    );
    await screen.findByText(/^(Hearing days|No calendar yet for .*)$/);
    return result;
  };

  test("shows for a draft month from the current month on, not for a past or missing one", async () => {
    const { unmount } = await renderLoaded(`${BASE}/2026-12`);
    expect(addHearing()).toBeInTheDocument();
    unmount();

    const past = await renderLoaded(`${BASE}/2026-09`);
    expect(addHearing()).not.toBeInTheDocument();
    past.unmount();

    await renderLoaded(`${BASE}/2026-10`);
    expect(addHearing()).not.toBeInTheDocument();
  });

  test("a published month is read-only: no + Add hearing", async () => {
    await renderLoaded(`${BASE}/2026-11`);

    expect(addHearing()).not.toBeInTheDocument();
  });

  test("when another tab has published the month, the add closes the dialog, toasts the server's message and locks the month", async () => {
    // 2026-09-08 in Denver, so September is the current month.
    vi.setSystemTime(new Date("2026-09-08T18:00:00Z"));
    vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
    vi.mocked(useCalendarConfig).mockImplementation(
      actualHooks.useCalendarConfig,
    );
    const toastError = vi.spyOn(toast, "error");
    const message =
      "September 2026 is published. Click Edit month to change it.";
    let month = september2026MonthDetail;
    const queryClient = new QueryClient();
    const calendarTrpc = createFakeCalendarTrpc({
      queryClient,
      procedures: {
        "admin.config.get": () => september2026Config,
        "admin.months.get": () => structuredClone(month),
        "admin.entries.add": () => {
          month = { ...month, status: "PUBLISHED" };
          throw calendarApiError("PRECONDITION_FAILED", message);
        },
      },
    });
    renderAdmin(`${BASE}/2026-09`, createFakeHost({ calendarTrpc }));
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "+ Add hearing" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Add a hearing" });
    await user.click(
      await within(dialog).findByRole("radio", { name: "Full Board" }),
    );
    await user.click(within(dialog).getByRole("button", { name: /^Add to / }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledExactlyOnceWith(
        message,
        expect.objectContaining({ id: expect.any(String) }),
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The refetch finds the month published, which takes + Add hearing away.
    await waitFor(() => expect(addHearing()).not.toBeInTheDocument());

    // Edit month in the other tab: the month is a draft again, and the
    // dialog stays closed until the editor opens it.
    month = { ...month, status: "DRAFT" };
    await act(() => queryClient.invalidateQueries());
    expect(
      await screen.findByRole("button", { name: "+ Add hearing" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("opens on the selected hearing's day, then selects the added entry", async () => {
    // 2026-09-08 in Denver, so September is the current month.
    vi.setSystemTime(new Date("2026-09-08T18:00:00Z"));
    vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
    vi.mocked(useCalendarConfig).mockImplementation(
      actualHooks.useCalendarConfig,
    );
    const fullBoard = september2026MonthDetail.entries.find(
      (entry) => entry.id === "2026-09-11:FULL_BOARD:Full Board",
    );
    if (!fullBoard) throw new Error("No Full Board on the 11th");
    const added = {
      ...fullBoard,
      id: "entry-added",
      date: "2026-09-14",
      source: "MANUAL" as const,
    };
    let month = september2026MonthDetail;
    const calendarTrpc = createFakeCalendarTrpc({
      procedures: {
        "admin.config.get": () => september2026Config,
        "admin.months.get": () => structuredClone(month),
        "admin.entries.add": () => {
          month = { ...month, entries: [...month.entries, added] };
          return {
            entry: added,
            month: structuredClone(month),
            monthRevision: 2,
          };
        },
      },
    });
    renderAdmin(`${BASE}/2026-09`, createFakeHost({ calendarTrpc }));
    const user = userEvent.setup();
    await screen.findByText("Hearing days");
    const fcf14 = () => {
      const cell = document.querySelector<HTMLElement>(
        '[data-date="2026-09-14"]',
      );
      if (!cell) throw new Error("No cell for 2026-09-14");
      return within(cell).getByTitle("Fremont Correctional Facility");
    };

    await user.click(fcf14());
    await user.click(screen.getByRole("button", { name: "+ Add hearing" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a hearing" });
    await within(dialog).findByRole("radio", { name: "Full Board" });
    expect(
      within(dialog).getByRole("button", { name: /^Add to / }),
    ).toHaveTextContent("Add to September 14");

    await user.click(within(dialog).getByRole("radio", { name: "Full Board" }));
    await user.click(within(dialog).getByRole("button", { name: /^Add to / }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(fcf14()).toHaveAttribute("aria-pressed", "false");
    const pressed = document.querySelectorAll('[aria-pressed="true"]');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].closest("[data-date]")).toHaveAttribute(
      "data-date",
      "2026-09-14",
    );
  });
});

describe("moving entries", () => {
  const MOVE_NAME = "Move to…: CCF on September 15";

  const cell = (date: string) => {
    const found = document.querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (!found) throw new Error(`No cell for ${date}`);
    return found;
  };
  const chipOn = (date: string, fullName: string) =>
    within(cell(date)).getByTitle(fullName);
  const ccf15 = () => chipOn("2026-09-15", "Centennial Correctional Facility");
  const fcf14 = () => chipOn("2026-09-14", "Fremont Correctional Facility");
  // CalendarGrid gives draggable chips its entryEditable class, which the
  // test build of the CSS module prefixes and suffixes.
  const draggable = (chip: HTMLElement) =>
    chip.closest('[class*="entryEditable"]') !== null;

  beforeAll(() => {
    ReactModal.setAppElement(document.createElement("div"));
  });

  /**
   * September 2026 as the current month, on a fake server whose
   * entries.move moves the entries, or runs move when given.
   */
  function renderMovable(
    move?: () => unknown,
    status: MonthDetail["status"] = "DRAFT",
  ) {
    // 2026-09-08 in Denver, so September is the current month.
    vi.setSystemTime(new Date("2026-09-08T18:00:00Z"));
    vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
    let month: MonthDetail = { ...september2026MonthDetail, status };
    const moveProcedure = vi.fn(
      move ??
        ((raw: unknown): unknown => {
          const input = raw as {
            entries: { entryId: string }[];
            newDate: string;
          };
          const ids = new Set(input.entries.map(({ entryId }) => entryId));
          month = {
            ...month,
            entries: month.entries.map((entry) =>
              ids.has(entry.id)
                ? { ...entry, date: input.newDate, version: entry.version + 1 }
                : entry,
            ),
          };
          return {
            entries: month.entries.filter(({ id }) => ids.has(id)),
            month: structuredClone(month),
            monthRevision: 2,
          };
        }),
    );
    const calendarTrpc = createFakeCalendarTrpc({
      procedures: {
        "admin.months.get": () => structuredClone(month),
        "admin.entries.move": moveProcedure,
      },
    });
    const host = createFakeHost({ calendarTrpc });
    vi.spyOn(host.analyticsStore, "trackPbPublicCalendarHearingMoved");
    renderAdmin(`${BASE}/2026-09`, host);
    return { moveProcedure, host };
  }

  test("dragging is on for the current month", async () => {
    renderMovable();
    await screen.findByText("Hearing days");
    expect(draggable(ccf15())).toBe(true);
  });

  test("shows the drag hint while nothing is selected", async () => {
    const user = userEvent.setup();
    renderMovable();
    await screen.findByText("Hearing days");
    expect(screen.getByText("Drag a session to move it")).toBeInTheDocument();

    await user.click(ccf15());

    expect(
      screen.queryByText("Drag a session to move it"),
    ).not.toBeInTheDocument();
  });

  test("a published month is read-only: no drag and no Move to…", async () => {
    const user = userEvent.setup();
    renderMovable(undefined, "PUBLISHED");
    await screen.findByText("Hearing days");

    await user.click(ccf15());

    expect(draggable(ccf15())).toBe(false);
    expect(
      screen.queryByRole("button", { name: /^Move to/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Drag a session to move it"),
    ).not.toBeInTheDocument();
  });

  test("a past month can't be dragged and has no Move to…", async () => {
    const user = userEvent.setup();
    renderAdmin(`${BASE}/2026-09`);
    expect(await title("September 2026")).toBeInTheDocument();

    await user.click(ccf15());

    expect(draggable(ccf15())).toBe(false);
    expect(
      screen.queryByRole("button", { name: /^Move to/ }),
    ).not.toBeInTheDocument();
  });

  test("Move to… moves one hearing with the keyboard and focuses its chip on the new day", async () => {
    const user = userEvent.setup();
    const { moveProcedure, host } = renderMovable();
    await screen.findByText("Hearing days");

    ccf15().focus();
    await user.keyboard("{Enter}");
    // Focus enters the toolbar on its first button, "Delete hearing", and
    // the arrow moves on to "Move to…".
    screen.getByRole("button", { name: MOVE_NAME }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: MOVE_NAME })).toHaveFocus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Move CCF" });
    // Focus starts on the current day; the 16th already has CCF, so the
    // arrow skips it to the 17th.
    await waitFor(() =>
      expect(
        within(dialog).getByRole("radio", { name: /September 15/ }),
      ).toHaveFocus(),
    );
    await user.keyboard("{ArrowRight}");
    expect(
      within(dialog).getByRole("radio", { name: /September 17/ }),
    ).toBeChecked();
    within(dialog)
      .getByRole("button", { name: "Move to September 17" })
      .focus();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(moveProcedure).toHaveBeenCalledWith({
      entries: [{ entryId: "2026-09-15:HEARING:CCF", expectedVersion: 1 }],
      newDate: "2026-09-17",
    });
    const moved = chipOn("2026-09-17", "Centennial Correctional Facility");
    expect(moved).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(moved).toHaveFocus());
    expect(
      host.analyticsStore.trackPbPublicCalendarHearingMoved,
    ).toHaveBeenCalledExactlyOnceWith({
      year: 2026,
      month: 9,
      kind: "HEARING",
      method: "move_to",
      dayDelta: 2,
    });
  });

  test("with several selected, the bar holds only Move to…, which moves them all in one request", async () => {
    const user = userEvent.setup();
    const { moveProcedure } = renderMovable();
    await screen.findByText("Hearing days");

    await user.click(fcf14());
    await user.click(ccf15());
    const toolbar = screen.getByRole("toolbar", {
      name: "Actions for 2 selected hearings",
    });
    expect(within(toolbar).getAllByRole("button")).toHaveLength(1);
    await user.click(
      within(toolbar).getByRole("button", { name: "Move to…: 2 hearings" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Move 2 hearings",
    });
    await user.click(
      within(dialog).getByRole("radio", { name: /September 21/ }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Move to September 21" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(moveProcedure).toHaveBeenCalledExactlyOnceWith({
      entries: [
        { entryId: "2026-09-14:HEARING:FCF", expectedVersion: 1 },
        { entryId: "2026-09-15:HEARING:CCF", expectedVersion: 1 },
      ],
      newDate: "2026-09-21",
    });
    expect(
      chipOn("2026-09-21", "Fremont Correctional Facility"),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      chipOn("2026-09-21", "Centennial Correctional Facility"),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("dragging and Move to… stop while a move runs", async () => {
    const user = userEvent.setup();
    renderMovable(() => new Promise(() => undefined));
    await screen.findByText("Hearing days");

    await user.click(ccf15());
    await user.click(screen.getByRole("button", { name: MOVE_NAME }));
    const dialog = await screen.findByRole("dialog", { name: "Move CCF" });
    await user.click(
      within(dialog).getByRole("radio", { name: /September 21/ }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Move to September 21" }),
    );

    await waitFor(() => expect(draggable(fcf14())).toBe(false));
    expect(screen.getByRole("button", { name: MOVE_NAME })).toBeDisabled();
  });

  /** Drops the entries of ids on date, as a drag in the grid does. */
  const drop = (ids: string[], date: string) =>
    act(() => {
      vi.mocked(CalendarGrid).mock.lastCall?.[0].onEntriesDrop?.(ids, date);
    });

  test("a dragged hearing shows on its new day as busy, and screen readers hear it, while the move saves", async () => {
    renderMovable(() => new Promise(() => undefined));
    await screen.findByText("Hearing days");

    drop(["2026-09-15:HEARING:CCF"], "2026-09-21");

    const moving = chipOn("2026-09-21", "Centennial Correctional Facility");
    expect(moving).toHaveAttribute("aria-busy", "true");
    expect(moving).toHaveAttribute("aria-disabled", "true");
    expect(
      within(cell("2026-09-15")).queryByTitle(
        "Centennial Correctional Facility",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Moving CCF to September 21…")).toHaveAttribute(
      "role",
      "status",
    );
    expect(draggable(fcf14())).toBe(false);
    // The counts change only when the server answers.
    expect(screen.getByText("Hearing days").parentElement).toHaveTextContent(
      "13",
    );
  });

  test("a dragged hearing stays on its new day once the move saves, never showing on its old day again", async () => {
    const { moveProcedure } = renderMovable();
    await screen.findByText("Hearing days");
    const rendersBefore = vi.mocked(CalendarGrid).mock.calls.length;

    drop(["2026-09-15:HEARING:CCF"], "2026-09-21");

    await waitFor(() =>
      expect(
        chipOn("2026-09-21", "Centennial Correctional Facility"),
      ).not.toHaveAttribute("aria-busy"),
    );
    expect(moveProcedure).toHaveBeenCalledOnce();
    expect(screen.queryByText(/^Moving /)).not.toBeInTheDocument();
    const ccfDates = vi
      .mocked(CalendarGrid)
      .mock.calls.slice(rendersBefore)
      .map(
        ([props]) =>
          props.entries.find(({ id }) => id === "2026-09-15:HEARING:CCF")?.date,
      );
    expect(new Set(ccfDates)).toEqual(new Set(["2026-09-21"]));
  });

  test("a drag the server refuses puts the hearing back on its day", async () => {
    renderMovable(() => {
      throw calendarApiError("BAD_REQUEST", "Pick a weekday.");
    });
    await screen.findByText("Hearing days");

    drop(["2026-09-15:HEARING:CCF"], "2026-09-21");

    await waitFor(() =>
      expect(
        chipOn("2026-09-15", "Centennial Correctional Facility"),
      ).not.toHaveAttribute("aria-busy"),
    );
    expect(
      within(cell("2026-09-21")).queryByTitle(
        "Centennial Correctional Facility",
      ),
    ).not.toBeInTheDocument();
  });

  test("a move the server rejects as CONFLICT closes the dialog and leaves the hearing on its day", async () => {
    const user = userEvent.setup();
    renderMovable(() => {
      throw calendarApiError(
        "CONFLICT",
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
      );
    });
    await screen.findByText("Hearing days");

    await user.click(ccf15());
    await user.click(screen.getByRole("button", { name: MOVE_NAME }));
    const dialog = await screen.findByRole("dialog", { name: "Move CCF" });
    await user.click(
      within(dialog).getByRole("radio", { name: /September 21/ }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Move to September 21" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(ccf15()).toHaveAttribute("aria-pressed", "true");
  });

  test("a move that fails for another reason keeps the dialog open with the error", async () => {
    const user = userEvent.setup();
    renderMovable(() => {
      throw calendarApiError("INTERNAL_SERVER_ERROR", "db down");
    });
    await screen.findByText("Hearing days");

    await user.click(ccf15());
    await user.click(screen.getByRole("button", { name: MOVE_NAME }));
    const dialog = await screen.findByRole("dialog", { name: "Move CCF" });
    await user.click(
      within(dialog).getByRole("radio", { name: /September 21/ }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Move to September 21" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "We couldn't move this. Try again or contact Recidiviz support.",
    );
    expect(ccf15()).toBeInTheDocument();
  });

  test("when another tab has published the month, Move to… toasts the server's message and the month locks", async () => {
    // 2026-09-08 in Denver, so September is the current month.
    vi.setSystemTime(new Date("2026-09-08T18:00:00Z"));
    vi.mocked(useMonth).mockImplementation(actualHooks.useMonth);
    const toastError = vi.spyOn(toast, "error");
    const message =
      "September 2026 is published. Click Edit month to change it.";
    let month = september2026MonthDetail;
    const calendarTrpc = createFakeCalendarTrpc({
      procedures: {
        "admin.months.get": () => structuredClone(month),
        "admin.entries.move": () => {
          month = { ...month, status: "PUBLISHED" };
          throw calendarApiError("PRECONDITION_FAILED", message);
        },
      },
    });
    renderAdmin(`${BASE}/2026-09`, createFakeHost({ calendarTrpc }));
    const user = userEvent.setup();
    await screen.findByText("Hearing days");

    await user.click(ccf15());
    await user.click(screen.getByRole("button", { name: MOVE_NAME }));
    const dialog = await screen.findByRole("dialog", { name: "Move CCF" });
    await user.click(
      within(dialog).getByRole("radio", { name: /September 21/ }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Move to September 21" }),
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledExactlyOnceWith(message, {
        id: MOVE_TOAST_ID,
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The refetch finds the month published, which locks its chips in place.
    await waitFor(() => expect(draggable(ccf15())).toBe(false));
    expect(
      screen.queryByRole("button", { name: /^Move to/ }),
    ).not.toBeInTheDocument();
  });
});

describe("the publish button", () => {
  beforeAll(() => {
    ReactModal.setAppElement(document.createElement("div"));
  });

  const publishButton = () =>
    screen.queryByRole("button", { name: "Review & Publish" });
  // The header's action placeholders show until the month loads.
  const monthLoaded = () =>
    waitFor(() => expect(screen.queryAllByTestId("skeleton")).toHaveLength(0));

  test("Review & Publish opens the publish dialog for a draft month", async () => {
    const calendarTrpc = withRealHooks();
    renderAdmin(`${BASE}/2026-12`, createFakeHost({ calendarTrpc }));

    await userEvent.click(
      await screen.findByRole("button", { name: "Review & Publish" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Publish December 2026" }),
    ).toBeInTheDocument();
  });

  test.each([
    ["a published month, which is locked", "2026-11", "November 2026"],
    ["a past draft month", "2026-09", "September 2026"],
    ["a month that doesn't exist", "2026-10", "October 2026"],
  ])("isn't offered for %s", async (_, param, name) => {
    const calendarTrpc = withRealHooks();
    renderAdmin(`${BASE}/${param}`, createFakeHost({ calendarTrpc }));

    expect(await title(name)).toBeInTheDocument();
    await monthLoaded();
    expect(publishButton()).not.toBeInTheDocument();
  });

  /**
   * Publishes December from the publish dialog, with months.publish
   * returning it as PUBLISHED.
   */
  async function publishDecember(getMonth = vi.fn(storedMonth)) {
    const calendarTrpc = withRealHooks(getMonth, {
      "admin.months.publishPreview": () =>
        publishPreview({
          monthId: storedMonths["2026-12"].id,
          month: 12,
          revision: storedMonths["2026-12"].revision,
        }),
      "admin.months.publish": () => ({
        monthId: storedMonths["2026-12"].id,
        status: "PUBLISHED",
        revision: storedMonths["2026-12"].revision + 1,
        month: {
          ...storedMonths["2026-12"],
          status: "PUBLISHED",
          revision: storedMonths["2026-12"].revision + 1,
          latestPublication: {
            publishedAt: new Date("2026-10-09T01:00:00Z"),
            publishedByEmail: "editor-a@example.com",
          },
        },
      }),
    });
    renderAdmin(`${BASE}/2026-12`, createFakeHost({ calendarTrpc }));
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Review & Publish" }),
    );
    await user.click(await screen.findByRole("checkbox"));
    const reads = getMonth.mock.calls.length;

    await user.click(screen.getByRole("button", { name: "Publish calendar" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    return reads;
  }

  test("goes once the month is published, from the month the publish returns", async () => {
    const getMonth = vi.fn(storedMonth);

    const reads = await publishDecember(getMonth);

    expect(publishButton()).not.toBeInTheDocument();
    expect(getMonth).toHaveBeenCalledTimes(reads);
  });

  test("returns focus to the same button, now Edit month, after a publish", async () => {
    await publishDecember();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Edit month: December 2026" }),
      ).toHaveFocus(),
    );
  });
});

describe("a published month", () => {
  beforeAll(() => {
    ReactModal.setAppElement(document.createElement("div"));
  });

  const editButton = () =>
    screen.queryByRole("button", { name: /^Edit month: / });
  // The header's action placeholders show until the month loads.
  const monthLoaded = () =>
    waitFor(() => expect(screen.queryAllByTestId("skeleton")).toHaveLength(0));

  /** Renders storedMonths[key] replaced by month, then puts it back. */
  async function withStoredMonth(
    key: string,
    month: MonthDetail,
    run: () => Promise<void>,
  ) {
    const original = storedMonths[key];
    storedMonths[key] = month;
    try {
      await run();
    } finally {
      storedMonths[key] = original;
    }
  }

  test("shows the published banner with the month's counts, and Edit month as its only action", async () => {
    const calendarTrpc = withRealHooks();
    const { container } = renderAdmin(
      `${BASE}/2026-11`,
      createFakeHost({ calendarTrpc }),
    );

    const edit = await screen.findByRole("button", { name: /^Edit month: / });
    expect(
      screen.getByRole("region", { name: "Month status" }),
    ).toHaveTextContent(
      "November 2026 is live on the public calendar — 1 hearing day, 1 hearing.",
    );
    expect(edit).toHaveAccessibleName("Edit month: November 2026");
    expect(edit).toHaveTextContent("Edit month");
    expect(
      screen.queryByRole("button", { name: "Review & Publish" }),
    ).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("a past published month offers no Edit month", async () => {
    await withStoredMonth(
      "2026-9",
      monthDetail({ ...november2026Summary, id: "month-2026-9", month: 9 }),
      async () => {
        const calendarTrpc = withRealHooks();
        renderAdmin(`${BASE}/2026-09`, createFakeHost({ calendarTrpc }));

        expect(
          await screen.findByRole("region", { name: "Month status" }),
        ).toHaveTextContent("UPLOAD COMPLETE");
        await monthLoaded();
        expect(editButton()).not.toBeInTheDocument();
      },
    );
  });

  test("a draft offers Review & Publish and no Edit month", async () => {
    const calendarTrpc = withRealHooks();
    renderAdmin(`${BASE}/2026-12`, createFakeHost({ calendarTrpc }));

    expect(
      await screen.findByRole("button", { name: "Review & Publish" }),
    ).toBeInTheDocument();
    expect(editButton()).not.toBeInTheDocument();
  });

  test("moving to another month closes an open Edit month dialog, and coming back doesn't reopen it", async () => {
    const calendarTrpc = withRealHooks();
    renderAdmin(`${BASE}/2026-11`, createFakeHost({ calendarTrpc }));
    await userEvent.click(
      await screen.findByRole("button", { name: /^Edit month: / }),
    );
    expect(
      await screen.findByRole("alertdialog", { name: "Edit November 2026?" }),
    ).toBeInTheDocument();

    // The open dialog covers the header, so this stands in for the
    // browser's Back button, which changes the month without a click.
    fireEvent.click(screen.getByRole("link", { name: "Next month" }));

    expect(await title("December 2026")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("link", { name: "Previous month" }));

    expect(await title("November 2026")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /^Edit month: / }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  /**
   * Moves November back to draft from the Edit month dialog, with
   * months.unpublish returning it as DRAFT.
   */
  async function unpublishNovember(getMonth = vi.fn(storedMonth)) {
    const published = storedMonths["2026-11"];
    const calendarTrpc = withRealHooks(getMonth, {
      "admin.months.unpublish": () => ({
        monthId: published.id,
        status: "DRAFT",
        revision: published.revision + 1,
        month: {
          ...published,
          status: "DRAFT",
          revision: published.revision + 1,
        },
      }),
    });
    const host = createFakeHost({ calendarTrpc });
    const track = vi.spyOn(
      host.analyticsStore,
      "trackPbPublicCalendarMonthUnpublished",
    );
    renderAdmin(`${BASE}/2026-11`, host);
    await userEvent.click(
      await screen.findByRole("button", { name: /^Edit month: / }),
    );
    const dialog = await screen.findByRole("alertdialog", {
      name: "Edit November 2026?",
    });
    const reads = getMonth.mock.calls.length;

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Edit month" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    return { reads, track };
  }

  test("Edit month moves it back to draft from the month it returns: the DRAFT strip and Review & Publish", async () => {
    const getMonth = vi.fn(storedMonth);

    const { reads, track } = await unpublishNovember(getMonth);

    expect(
      screen.getByRole("region", { name: "Month status" }),
    ).toHaveTextContent("November 2026 is back in draft");
    expect(screen.queryByText("UPLOAD COMPLETE")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review & Publish" }),
    ).toBeInTheDocument();
    expect(editButton()).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledExactlyOnceWith({ year: 2026, month: 11 });
    expect(getMonth).toHaveBeenCalledTimes(reads);
  });

  test("returns focus to the same button, now Review & Publish, after Edit month", async () => {
    await unpublishNovember();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Review & Publish" }),
      ).toHaveFocus(),
    );
  });
});

describe("page view analytics", () => {
  test("fires on mount and on each month change, with NONE for an empty month", async () => {
    const { host } = renderAdmin(`${BASE}/2026-10`);
    const track = vi.mocked(
      host.analyticsStore.trackPbPublicCalendarAdminViewed,
    );

    expect(await title("October 2026")).toBeInTheDocument();
    expect(track).toHaveBeenCalledExactlyOnceWith({
      year: 2026,
      month: 10,
      status: "NONE",
    });

    await userEvent.click(screen.getByRole("link", { name: "Next month" }));

    expect(await title("November 2026")).toBeInTheDocument();
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith({
      year: 2026,
      month: 11,
      status: "PUBLISHED",
    });
  });

  test("doesn't fire again when the same month re-renders", async () => {
    const { host } = renderAdmin(`${BASE}/2026-11`);
    expect(await title("November 2026")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("combobox", { name: "Month" }));
    await userEvent.keyboard("{Escape}");

    expect(
      host.analyticsStore.trackPbPublicCalendarAdminViewed,
    ).toHaveBeenCalledOnce();
  });

  test("doesn't fire on an error", async () => {
    vi.mocked(useMonth).mockImplementation(() => {
      throw calendarApiError("INTERNAL_SERVER_ERROR", "boom");
    });

    const { host } = renderAdmin(`${BASE}/2026-10`);

    await screen.findByRole("alert");
    expect(
      host.analyticsStore.trackPbPublicCalendarAdminViewed,
    ).not.toHaveBeenCalled();
  });
});

describe("Add month", () => {
  const KIND_NOTICE =
    "Business Mtg entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.";
  const created: CreateMonthsResult = {
    created: [
      {
        id: "month-2026-10",
        year: 2026,
        month: 10,
        entryCount: 40,
        notices: [
          {
            code: "KIND_WITHOUT_PATTERN",
            kindCode: "BUSINESS_MEETING",
            message: KIND_NOTICE,
          },
        ],
      },
    ],
  };

  beforeAll(() => {
    ReactModal.setAppElement(document.createElement("div"));
  });

  beforeEach(() => {
    vi.mocked(useAddMonthOptions).mockReturnValue(
      queryResult(addMonthChoices.options) as ReturnType<
        typeof useAddMonthOptions
      >,
    );
    vi.mocked(useCurrentPatterns).mockReturnValue(
      queryResult(addMonthChoices.currentPatterns) as ReturnType<
        typeof useCurrentPatterns
      >,
    );
    // A create that succeeds at once, as months.create would.
    vi.mocked(useCreateMonths).mockReturnValue({
      ...mutationResult(),
      mutateAsync: () => Promise.resolve(created),
    } as ReturnType<typeof useCreateMonths>);
  });

  const addMonthButtons = () =>
    screen.getAllByRole("button", { name: "+ Add month" });
  const addMonthDialog = () =>
    screen.findByRole("dialog", { name: "Add a month" });

  test("the header's + Add month opens the dialog", async () => {
    renderAdmin(`${BASE}/2026-11`);
    expect(await title("November 2026")).toBeInTheDocument();

    expect(addMonthButtons()).toHaveLength(1);
    await userEvent.click(addMonthButtons()[0]);

    expect(await addMonthDialog()).toBeInTheDocument();
  });

  test("the empty state's + Add month opens the dialog, and Escape closes it", async () => {
    renderAdmin(`${BASE}/2026-10`);
    expect(await title("October 2026")).toBeInTheDocument();

    await userEvent.click(addMonthButtons()[1]);
    const dialog = await addMonthDialog();
    // react-modal reads only keyCode, which user-event leaves at 0.
    fireEvent.keyDown(dialog, { key: "Escape", keyCode: 27 });

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
  });

  test("shows the new month's notices once after creating it, until dismissed, keeping the tenantId", async () => {
    renderAdmin(`${BASE}/2026-11?tenantId=US_CO`);
    expect(await title("November 2026")).toBeInTheDocument();
    // October exists once the create has run.
    const october = monthDetail({
      ...september2026Summary,
      id: "month-2026-10",
      month: 10,
    });
    vi.mocked(useMonth).mockImplementation(
      ({ year, month }: YearMonthOption) =>
        queryResult(
          month === 10 ? october : storedMonths[`${year}-${month}`] ?? null,
        ) as ReturnType<typeof useMonth>,
    );

    await userEvent.click(addMonthButtons()[0]);
    await userEvent.click(
      within(await addMonthDialog()).getByRole("button", {
        name: "Generate October",
      }),
    );

    expect(await title("October 2026")).toBeInTheDocument();
    expect(
      await screen.findByText("Notices for October 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText(KIND_NOTICE)).toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveTextContent("?tenantId=US_CO");

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() =>
      expect(screen.queryByText(KIND_NOTICE)).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(`${BASE}/2026-10`);
    expect(screen.getByTestId("search")).toHaveTextContent("?tenantId=US_CO");
  });
});
