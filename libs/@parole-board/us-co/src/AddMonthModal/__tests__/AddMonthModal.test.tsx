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
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import toast from "react-hot-toast";
import ReactModal from "react-modal";
import { Route, Routes, useLocation } from "react-router-dom";

import type {
  CreateMonthsResult,
  YearMonthOption,
} from "~@parole-board/common";
import {
  addMonthChoices,
  calendarApiError,
} from "~@parole-board/common/fixtures";
import {
  createFakeCalendarTrpc,
  createFakeHost,
  renderWithHost,
} from "~@parole-board/common/testing";

import {
  ADD_MONTHS_ERROR_MESSAGE,
  AddMonthModal,
  readCreateNotices,
} from "../AddMonthModal";

vi.mock("react-hot-toast", () => ({ default: vi.fn() }));

const BASE = "/parole/public-calendar";
const CONFLICT_MESSAGE = "November 2026 already exists. Refresh to see it.";
const KIND_NOTICE =
  "Business Mtg entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.";

type Procedures = {
  addOptions: () => unknown;
  create: (input: { months: YearMonthOption[] }) => unknown;
};

function createdResult(
  months: YearMonthOption[],
  notices: Record<string, string[]> = {},
): CreateMonthsResult {
  return {
    created: months.map(({ year, month }) => ({
      id: `month-${year}-${month}`,
      year,
      month,
      entryCount: 40,
      notices: (notices[`${year}-${month}`] ?? []).map((message) => ({
        code: "KIND_WITHOUT_PATTERN" as const,
        kindCode: "BUSINESS_MEETING",
        message,
      })),
    })),
  };
}

function LocationDisplay() {
  const location = useLocation();
  return (
    <>
      <p data-testid="location">{location.pathname}</p>
      <p data-testid="notices">
        {JSON.stringify(readCreateNotices(location.state))}
      </p>
    </>
  );
}

/** Opens the dialog on render, and again from "Open" once it closes. */
function Harness() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open
      </button>
      <AddMonthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <LocationDisplay />
    </>
  );
}

function renderModal(overrides: Partial<Procedures> = {}) {
  // Months this fake server has created, so months.addOptions stops offering
  // them, as the real one does.
  const createdKeys = new Set<string>();
  const offered = (options: YearMonthOption[]) =>
    options.filter(({ year, month }) => !createdKeys.has(`${year}-${month}`));
  const procedures = {
    addOptions: vi.fn(
      overrides.addOptions ?? (() => offered(addMonthChoices.options)),
    ),
    listCurrent: vi.fn(() => addMonthChoices.currentPatterns),
    config: vi.fn(() => addMonthChoices.config),
    list: vi.fn(),
    create: vi.fn(
      overrides.create ??
        ((input: { months: YearMonthOption[] }) => {
          for (const { year, month } of input.months) {
            createdKeys.add(`${year}-${month}`);
          }
          return createdResult(input.months);
        }),
    ),
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const calendarTrpc = createFakeCalendarTrpc({
    queryClient,
    procedures: {
      "admin.months.addOptions": procedures.addOptions,
      "admin.patterns.listCurrent": procedures.listCurrent,
      "admin.config.get": procedures.config,
      "admin.months.list": procedures.list,
      "admin.months.create": (input) =>
        procedures.create(input as { months: YearMonthOption[] }),
    },
  });
  const host = createFakeHost({ calendarTrpc });
  vi.spyOn(host.analyticsStore, "trackPbPublicCalendarMonthAdded");
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  renderWithHost(
    // Nested like AdminRoutes, so "../2026-11" resolves as it does there.
    <Routes>
      <Route
        path={`${BASE}/*`}
        element={
          <Routes>
            <Route path=":yearMonth" element={<Harness />} />
          </Routes>
        }
      />
    </Routes>,
    { host, route: `${BASE}/2026-10` },
  );
  return { procedures, host, invalidate };
}

const dialog = () => screen.findByRole("dialog", { name: "Add a month" });
const generateButton = () => screen.getByRole("button", { name: /^Generate / });
const tile = (name: RegExp) => screen.getByRole("checkbox", { name });
const patternsToggle = () =>
  screen.getByRole("button", { name: "Facility patterns · 37 locations" });

/**
 * Presses Escape in the dialog. react-modal reads only keyCode, which
 * user-event leaves at 0, so this sets it as a browser does.
 */
function pressEscape() {
  fireEvent.keyDown(screen.getByRole("dialog", { name: "Add a month" }), {
    key: "Escape",
    code: "Escape",
    keyCode: 27,
  });
}

/** Selects November 2026 to January 2027 in place of October. */
async function selectThreeMonths() {
  await userEvent.click(tile(/^October 2026/));
  await userEvent.click(tile(/^November/));
  await userEvent.click(tile(/^December/));
  await userEvent.click(tile(/^January/));
}

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

beforeEach(() => {
  // 2026-10-08, 7pm in Denver, when it's already 2026-10-09 in UTC.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-09T01:00:00Z"));
  // React logs every error a boundary catches.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(toast).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AddMonthModal", () => {
  it("shows the server's add options from the current month, the earliest selected", async () => {
    renderModal();

    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });
    const checkboxes = within(
      screen.getByRole("group", { name: "Months to draft" }),
    ).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(13);
    expect(checkboxes[0]).toHaveAccessibleName(/^October 2026/);
    expect(checkboxes[12]).toHaveAccessibleName(/^October 2027/);
    expect(
      checkboxes.filter((box) => (box as HTMLInputElement).checked),
    ).toEqual([checkboxes[0]]);
    expect(generateButton()).toHaveTextContent("Generate October");
  });

  it("marks months the server leaves out as already added, without reading months.list", async () => {
    const { procedures } = renderModal({
      addOptions: () => addMonthChoices.optionsWithSomeAdded,
    });

    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });
    for (const name of [/^November/, /^December/]) {
      expect(tile(name)).toBeDisabled();
      expect(tile(name)).toHaveAccessibleName(/Already added/);
    }
    expect(tile(/^January/)).toBeEnabled();
    expect(procedures.list).not.toHaveBeenCalled();
  });

  it("lists the current patterns with their rules' text and full names", async () => {
    renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    expect(patternsToggle()).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(patternsToggle());
    expect(patternsToggle()).toHaveAttribute("aria-expanded", "true");

    const rows = within(
      screen.getByRole("list", { name: "Facility patterns" }),
    ).getAllByRole("listitem");
    expect(rows).toHaveLength(39);
    expect(rows[0]).toHaveTextContent("FCF — Fremont1st and 2nd Monday");
    expect(rows[8]).toHaveTextContent(
      "CCF — Centennial2nd Tuesday and Wednesday",
    );
    expect(rows[37]).toHaveTextContent("Full BoardEvery Friday");
    expect(rows[38]).toHaveTextContent("Business MtgNo pattern");
  });

  it("says every month exists and disables Generate with no options", async () => {
    renderModal({ addOptions: () => [] });

    expect(
      await screen.findByText(
        "Every month through October 2027 already exists.",
      ),
    ).toBeInTheDocument();
    expect(generateButton()).toBeDisabled();
  });

  it("creates the selected months in order, then closes, reports, toasts and opens the earliest", async () => {
    const { procedures, host, invalidate } = renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await selectThreeMonths();
    await userEvent.click(generateButton());

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        `${BASE}/2026-11`,
      ),
    );
    expect(procedures.create).toHaveBeenCalledOnce();
    expect(procedures.create).toHaveBeenCalledWith({
      months: [
        { year: 2026, month: 11 },
        { year: 2026, month: 12 },
        { year: 2027, month: 1 },
      ],
    });
    expect(
      host.analyticsStore.trackPbPublicCalendarMonthAdded,
    ).toHaveBeenCalledExactlyOnceWith({
      months: ["2026-11", "2026-12", "2027-01"],
      count: 3,
    });
    expect(toast).toHaveBeenCalledWith("Added 3 months", { id: "add-month" });
    // The lists and the add options refresh, and the open dialog's options
    // refetch without the new months; no other months query does.
    const { months } = host.calendarTrpc.querier.admin;
    expect(invalidate).toHaveBeenCalledWith(months.list.pathFilter());
    expect(invalidate).toHaveBeenCalledWith(months.addOptions.pathFilter());
    expect(invalidate).not.toHaveBeenCalledWith(months.pathFilter());
    expect(procedures.addOptions).toHaveBeenCalledTimes(2);
    expect(procedures.addOptions).toHaveLastReturnedWith(
      addMonthChoices.options.filter(
        ({ year, month }) =>
          !["2026-11", "2026-12", "2027-1"].includes(`${year}-${month}`),
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("notices")).toHaveTextContent("[]");
  });

  it("names the month in the toast when it creates one", async () => {
    renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await userEvent.click(generateButton());

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Added October 2026", {
        id: "add-month",
      }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(`${BASE}/2026-10`);
  });

  it("passes the server's notices to the month view in the router state", async () => {
    renderModal({
      create: (input) =>
        createdResult(input.months, { "2026-12": [KIND_NOTICE] }),
    });
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await selectThreeMonths();
    await userEvent.click(generateButton());

    await waitFor(() =>
      expect(
        JSON.parse(screen.getByTestId("notices").textContent ?? ""),
      ).toEqual([{ year: 2026, month: 12, messages: [KIND_NOTICE] }]),
    );
  });

  it("labels Generate by what's selected and disables it with nothing selected", async () => {
    renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await userEvent.click(tile(/^November/));
    await userEvent.click(tile(/^December/));
    expect(generateButton()).toHaveTextContent("Generate 3 months");
    expect(generateButton()).toBeEnabled();

    await userEvent.click(tile(/^October 2026/));
    await userEvent.click(tile(/^November/));
    expect(generateButton()).toHaveTextContent("Generate December");

    await userEvent.click(tile(/^December/));
    expect(generateButton()).toHaveTextContent("Generate month");
    expect(generateButton()).toBeDisabled();
  });

  it("submits on Enter in a tile, as Generate does", async () => {
    const { procedures } = renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await userEvent.click(tile(/^November/));
    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(procedures.create).toHaveBeenCalledExactlyOnceWith({
        months: [
          { year: 2026, month: 10 },
          { year: 2026, month: 11 },
        ],
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("keeps months that already exist disabled through a failed create", async () => {
    let fail: (error: unknown) => void = () => undefined;
    renderModal({
      addOptions: () => addMonthChoices.optionsWithSomeAdded,
      create: () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    });
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await userEvent.click(tile(/^January/));
    await userEvent.click(generateButton());
    await waitFor(() => expect(tile(/^January/)).toBeDisabled());
    fail(calendarApiError("INTERNAL_SERVER_ERROR", "connection reset"));

    await screen.findByRole("alert");
    expect(tile(/^January/)).toBeEnabled();
    expect(tile(/^January/)).toBeChecked();
    for (const name of [/^November/, /^December/]) {
      expect(tile(name)).toBeDisabled();
      expect(tile(name)).not.toBeChecked();
    }
  });

  it("shows a CONFLICT's message, keeps the dialog open, refetches the options and reports nothing", async () => {
    const addOptions = vi
      .fn()
      .mockReturnValueOnce(addMonthChoices.options)
      .mockReturnValue(
        addMonthChoices.options.filter(
          ({ year, month }) => !(year === 2026 && month === 11),
        ),
      );
    const { host } = renderModal({
      addOptions,
      create: () => {
        throw calendarApiError("CONFLICT", CONFLICT_MESSAGE);
      },
    });
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await userEvent.click(tile(/^October 2026/));
    await userEvent.click(tile(/^November/));
    await userEvent.click(generateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      CONFLICT_MESSAGE,
    );
    await waitFor(() => expect(tile(/^November/)).toBeDisabled());
    expect(addOptions).toHaveBeenCalledTimes(2);
    // November no longer exists to add, so it drops out of the selection.
    expect(tile(/^November/)).not.toBeChecked();
    expect(generateButton()).toHaveTextContent("Generate month");
    expect(screen.getByRole("dialog", { name: "Add a month" })).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent(`${BASE}/2026-10`);
    expect(
      host.analyticsStore.trackPbPublicCalendarMonthAdded,
    ).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("shows its own message for an error the server didn't write for editors", async () => {
    renderModal({
      create: () => {
        throw calendarApiError("INTERNAL_SERVER_ERROR", "connection reset");
      },
    });
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await userEvent.click(generateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ADD_MONTHS_ERROR_MESSAGE,
    );
    expect(screen.queryByText("connection reset")).not.toBeInTheDocument();
  });

  it("closes from Cancel with no request, and opens again with the error cleared", async () => {
    const { procedures } = renderModal({
      create: () => {
        throw calendarApiError("CONFLICT", CONFLICT_MESSAGE);
      },
    });
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });
    await userEvent.click(generateButton());
    await screen.findByRole("alert");
    procedures.create.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
    expect(procedures.create).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("starts over at the earliest month when it opens again", async () => {
    renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });
    await userEvent.click(tile(/^November/));
    expect(generateButton()).toHaveTextContent("Generate 2 months");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    expect(tile(/^October 2026/)).toBeChecked();
    expect(tile(/^November/)).not.toBeChecked();
    expect(generateButton()).toHaveTextContent("Generate October");
  });

  it("closes on Escape", async () => {
    renderModal();
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    pressEscape();

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("waits on Generate with the tiles and Cancel disabled while the create runs", async () => {
    let finish: (value: CreateMonthsResult) => void = () => undefined;
    renderModal({
      create: () =>
        new Promise<CreateMonthsResult>((resolve) => {
          finish = resolve;
        }),
    });
    await within(await dialog()).findByRole("group", {
      name: "Months to draft",
    });

    await selectThreeMonths();
    await userEvent.click(generateButton());
    await waitFor(() =>
      expect(generateButton()).toHaveAttribute("aria-busy", "true"),
    );
    expect(generateButton()).toHaveTextContent("Generate 3 months");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(tile(/^November/)).toBeDisabled();
    expect(tile(/^November/)).toBeChecked();
    pressEscape();
    expect(screen.getByRole("dialog", { name: "Add a month" })).toBeVisible();

    finish(
      createdResult([
        { year: 2026, month: 11 },
        { year: 2026, month: 12 },
        { year: 2027, month: 1 },
      ]),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add a month" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows the skeleton while the options load", async () => {
    renderModal({ addOptions: () => new Promise(() => undefined) });

    expect(
      await screen.findByRole("status", {
        name: "Loading the months you can add",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add a month" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(generateButton()).toBeDisabled();
  });

  it("shows a load error with Try again, which refetches", async () => {
    const addOptions = vi
      .fn()
      .mockImplementationOnce(() => {
        throw calendarApiError("INTERNAL_SERVER_ERROR", "Network error");
      })
      .mockReturnValue(addMonthChoices.options);
    renderModal({ addOptions });

    expect(
      await screen.findByText("We couldn't load the months you can add."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("group", { name: "Months to draft" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations with the patterns collapsed or open", async () => {
    renderModal();
    const modal = await dialog();
    await within(modal).findByRole("group", { name: "Months to draft" });
    expect(await axe(modal)).toHaveNoViolations();

    await userEvent.click(patternsToggle());
    expect(await axe(modal)).toHaveNoViolations();
  });
});

describe("readCreateNotices", () => {
  it("reads the notices Add month navigates with, and none from any other state", () => {
    const groups = [{ year: 2026, month: 11, messages: [KIND_NOTICE] }];
    expect(readCreateNotices({ createNotices: groups })).toEqual(groups);
    expect(readCreateNotices(null)).toEqual([]);
    expect(readCreateNotices({ from: "elsewhere" })).toEqual([]);
  });
});
