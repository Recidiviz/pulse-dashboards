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
import { Suspense } from "react";
import toast from "react-hot-toast";
import ReactModal from "react-modal";

import type {
  CalendarApiConfig,
  EntryDto,
  MonthDetail,
} from "~@parole-board/common";
import {
  calendarApiError,
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";
import {
  createFakeCalendarTrpc,
  createFakeHost,
  type FakeCalendarProcedures,
  renderWithHost,
} from "~@parole-board/common/testing";

import { ADD_ENTRY_ERROR_MESSAGE, AddHearingModal } from "../AddHearingModal";
import type { AddEntryInput } from "../buildAddEntryInput";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

const MONTH = september2026MonthDetail;

/** The entry entries.add returns for input, shaped like the fixture's. */
function addedEntry(input: AddEntryInput): EntryDto {
  const kind = september2026Config.kinds.find(
    ({ code }) => code === input.kindCode,
  );
  const resource = september2026Config.resources.find(
    ({ id }) => id === input.resourceId,
  );
  if (!kind) throw new Error(`No kind ${input.kindCode}`);
  return {
    ...MONTH.entries[0],
    id: "entry-new",
    date: input.date,
    kind: { ...MONTH.entries[0].kind, code: kind.code, label: kind.label },
    label: resource?.label ?? kind.label,
    resource: resource
      ? {
          id: resource.id,
          code: resource.code,
          label: resource.label,
          typeCode: resource.typeCode,
        }
      : null,
    slotKey: resource ? `${kind.code}:${resource.code}` : kind.code,
    source: "MANUAL",
  };
}

function renderModal({
  config = september2026Config,
  month = MONTH,
  selectedDate = null,
  procedures = {},
}: {
  config?: CalendarApiConfig;
  month?: MonthDetail;
  selectedDate?: string | null;
  procedures?: FakeCalendarProcedures;
} = {}) {
  const add = vi.fn((input: unknown) => {
    const entry = addedEntry(input as AddEntryInput);
    return {
      entry,
      month: { ...month, entries: [...month.entries, entry] },
      monthRevision: 2,
    };
  });
  const calendarTrpc = createFakeCalendarTrpc({
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
    procedures: {
      "admin.config.get": () => config,
      "admin.entries.add": add,
      ...procedures,
    },
  });
  const host = createFakeHost({ calendarTrpc });
  const track = vi.spyOn(
    host.analyticsStore,
    "trackPbPublicCalendarHearingAdded",
  );
  const onClose = vi.fn();
  const onAdded = vi.fn();
  // The dialog reads the calendar config with Suspense, as on the month
  // page, whose own boundary waits for it.
  const result = renderWithHost(
    <Suspense>
      <AddHearingModal
        isOpen
        month={month}
        selectedDate={selectedDate}
        onClose={onClose}
        onAdded={onAdded}
      />
    </Suspense>,
    { host },
  );
  return { ...result, add, track, onClose, onAdded };
}

const loaded = () => screen.findByRole("heading", { name: "Add a hearing" });

const addButton = () => screen.getByRole("button", { name: /^Add to / });

const facilitiesToggle = () =>
  screen.getByRole("button", { name: /^(Facilities|Facility: )/ });

async function openFacilities() {
  await userEvent.click(facilitiesToggle());
  return screen.getByRole("menu", { name: "Facilities" });
}

async function chooseFacility(label: string) {
  const menu = await openFacilities();
  await userEvent.click(
    within(menu).getByRole("menuitem", { name: new RegExp(`^${label} `) }),
  );
}

const day = (name: string) => screen.getByRole("radio", { name });

// react-modal 3.14 reads keyCode, which user-event's keyboard doesn't set.
const pressEscape = () =>
  fireEvent.keyDown(screen.getByRole("dialog"), {
    key: "Escape",
    keyCode: 27,
  });

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("AddHearingModal", () => {
  test("offers the config's kinds with no resource and its resources, in sortOrder", async () => {
    // Reversed, so only sorting by sortOrder gives the expected order.
    renderModal({
      config: {
        ...september2026Config,
        kinds: [...september2026Config.kinds].reverse(),
        resources: [...september2026Config.resources].reverse(),
      },
    });
    await loaded();

    expect(
      within(screen.getByRole("radiogroup", { name: "Board session" }))
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("value")),
    ).toEqual(["kind:FULL_BOARD", "kind:BUSINESS_MEETING"]);
    // The modal's overlay fades in once react-modal marks it open, which can
    // land a moment after the first render.
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Business Mtg" })).toBeVisible(),
    );

    const menu = await openFacilities();
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(
      september2026Config.resources.map(({ label, name }) =>
        name === label ? label : `${label}${name}`,
      ),
    );
  });

  test("opens with nothing chosen on the month's first allowed day", async () => {
    renderModal();
    await loaded();

    expect(screen.getAllByRole("radio", { checked: true })).toEqual([
      day("September 1"),
    ]);
    expect(facilitiesToggle()).toHaveTextContent("Facilities");
    expect(addButton()).toHaveTextContent("Add to September 1");
    expect(addButton()).toBeDisabled();
  });

  test("opens on the selected entry's day", async () => {
    renderModal({ selectedDate: "2026-09-14" });
    await loaded();

    expect(day("September 14")).toBeChecked();
    expect(addButton()).toHaveTextContent("Add to September 14");
  });

  test("disables the days outside the config's allowed weekdays", async () => {
    renderModal();
    await loaded();

    expect(day("September 5")).toBeDisabled();
    expect(day("September 6")).toBeDisabled();
    expect(day("September 4")).toBeEnabled();
  });

  test("enables every day when the config allows every weekday", async () => {
    renderModal({
      config: {
        ...september2026Config,
        calendar: {
          ...september2026Config.calendar,
          allowedWeekdays: [
            "SUNDAY",
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
          ],
        },
      },
    });
    await loaded();

    expect(day("September 5")).toBeEnabled();
  });

  test("disables the choices already on the chosen day", async () => {
    renderModal({ selectedDate: "2026-09-25" });
    await loaded();

    expect(
      screen.getByRole("radio", { name: /^Full Board \(already on/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("radio", {
        name: "Business Mtg (already on September 25)",
      }),
    ).toBeDisabled();

    await userEvent.click(day("September 14"));
    expect(screen.getByRole("radio", { name: "Full Board" })).toBeEnabled();
    const menu = await openFacilities();
    expect(
      within(menu).getByRole("menuitem", {
        name: "FCF Fremont Correctional Facility (already on September 14)",
      }),
    ).toBeDisabled();
  });

  test("adds a facility's hearing, then tracks, toasts and reports the new entry", async () => {
    const { add, track, onAdded } = renderModal();
    await loaded();

    await chooseFacility("FCF");
    expect(facilitiesToggle()).toHaveTextContent(
      "FCF — Fremont Correctional Facility",
    );
    await userEvent.click(day("September 16"));
    await userEvent.click(addButton());

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
    expect(add).toHaveBeenCalledWith({
      monthId: MONTH.id,
      date: "2026-09-16",
      kindCode: "HEARING",
      resourceId: "resource-FCF",
    });
    expect(onAdded.mock.calls[0][0]).toMatchObject({
      id: "entry-new",
      date: "2026-09-16",
    });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({
      year: 2026,
      month: 9,
      kind: "HEARING",
    });
    expect(toast).toHaveBeenCalledWith(
      "Added FCF to September 16",
      expect.objectContaining({ id: expect.any(String) }),
    );
  });

  test.each([
    ["Full Board", "FULL_BOARD"],
    ["Business Mtg", "BUSINESS_MEETING"],
  ])("adds a %s with no resource", async (label, kindCode) => {
    const { add, track } = renderModal();
    await loaded();

    await userEvent.click(screen.getByRole("radio", { name: label }));
    await userEvent.click(day("September 15"));
    await userEvent.click(addButton());

    await waitFor(() => expect(track).toHaveBeenCalledTimes(1));
    expect(add).toHaveBeenCalledWith({
      monthId: MONTH.id,
      date: "2026-09-15",
      kindCode,
      resourceId: null,
    });
    expect(track).toHaveBeenCalledWith({
      year: 2026,
      month: 9,
      kind: kindCode,
    });
  });

  test.each([
    ["CONFLICT", "FCF is already on September 16.", undefined],
    ["BAD_REQUEST", "Pick a weekday.", undefined],
    ["NOT_FOUND", "This month no longer exists.", undefined],
    ["INTERNAL_SERVER_ERROR", "db timeout", ADD_ENTRY_ERROR_MESSAGE],
  ] as const)(
    "shows a %s inline and keeps the dialog open",
    async (code, serverMessage, shown) => {
      const { track, onAdded, onClose } = renderModal({
        procedures: {
          "admin.entries.add": () => {
            throw calendarApiError(code, serverMessage);
          },
        },
      });
      await loaded();

      await chooseFacility("FCF");
      await userEvent.click(day("September 16"));
      await userEvent.click(addButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(
        shown ?? serverMessage,
      );
      expect(track).not.toHaveBeenCalled();
      expect(onAdded).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(addButton()).toBeEnabled();
      expect(toast.error).not.toHaveBeenCalled();
    },
  );

  test("closes and toasts the server's message when the month was published meanwhile", async () => {
    const message =
      "September 2026 is published. Click Edit month to change it.";
    const { track, onAdded, onClose } = renderModal({
      procedures: {
        "admin.entries.add": () => {
          throw calendarApiError("PRECONDITION_FAILED", message);
        },
      },
    });
    await loaded();

    await chooseFacility("FCF");
    await userEvent.click(day("September 16"));
    await userEvent.click(addButton());

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      message,
      expect.objectContaining({ id: expect.any(String) }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(track).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
  });

  test("waits on the add, and ignores Escape and Cancel until it settles", async () => {
    const { onClose } = renderModal({
      procedures: { "admin.entries.add": () => new Promise(() => undefined) },
    });
    await loaded();
    await chooseFacility("FCF");
    await userEvent.click(addButton());

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Full Board" })).toBeDisabled(),
    );
    pressEscape();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test("closes from Cancel", async () => {
    const { onClose } = renderModal();
    await loaded();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("closes from Escape", async () => {
    const { onClose } = renderModal();
    await loaded();

    pressEscape();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("has no axe violations", async () => {
    renderModal({ selectedDate: "2026-09-25" });
    await loaded();

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
