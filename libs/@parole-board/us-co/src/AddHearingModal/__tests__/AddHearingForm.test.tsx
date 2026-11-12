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
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ReactModal from "react-modal";

import type { EntryDto, MonthDetail } from "~@parole-board/common";
import {
  calendarApiError,
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { AddHearingForm } from "../AddHearingForm";
import { AddHearingModalForm } from "../AddHearingModal";
import { parseChoice } from "../hearingChoices";
import { useAddHearingForm } from "../useAddHearingForm";

// An entry in a choice's slot on date, so that choice is already on the day.
function entryIn(choice: string, date: string): EntryDto {
  const parsed = parseChoice(choice);
  const resource = september2026Config.resources.find(
    ({ id }) => parsed?.type === "facility" && id === parsed.resourceId,
  );
  return {
    ...september2026MonthDetail.entries[0],
    id: `entry-${choice}-${date}`,
    date,
    slotKey:
      parsed?.type === "boardSession"
        ? parsed.kindCode
        : `HEARING:${resource?.code}`,
  };
}

function Dialog({
  month,
  initialChoice,
  initialDay,
  send,
  onCancel,
}: {
  month: MonthDetail;
  initialChoice: string | null;
  initialDay: string | null;
  send: () => Promise<void>;
  onCancel: () => void;
}) {
  const parsed = initialChoice ? parseChoice(initialChoice) : null;
  const form = useAddHearingForm({
    month,
    config: september2026Config,
    defaultValues: {
      boardSession: parsed?.type === "boardSession" ? initialChoice : null,
      facility: parsed?.type === "facility" ? initialChoice : null,
      day: initialDay,
    },
    send,
  });
  return (
    <AddHearingModalForm
      form={form}
      isOpen
      month={month}
      config={september2026Config}
      onCancel={onCancel}
    >
      <AddHearingForm
        form={form}
        month={month}
        config={september2026Config}
        entries={month.entries}
      />
    </AddHearingModalForm>
  );
}

async function renderForm({
  initialChoice = null,
  initialDay = "2026-09-16",
  alreadyOnDay = [],
  send = vi.fn(() => Promise.resolve()),
}: {
  initialChoice?: string | null;
  initialDay?: string | null;
  /** Choice values already on initialDay. */
  alreadyOnDay?: string[];
  send?: () => Promise<void>;
} = {}) {
  const month = {
    ...september2026MonthDetail,
    entries: initialDay
      ? alreadyOnDay.map((choice) => entryIn(choice, initialDay))
      : [],
  };
  const onCancel = vi.fn();
  const result = render(
    <Dialog
      month={month}
      initialChoice={initialChoice}
      initialDay={initialDay}
      send={send}
      onCancel={onCancel}
    />,
  );
  await screen.findByRole("heading", { name: "Add a hearing" });
  return { ...result, send, onCancel };
}

const facilitiesToggle = () =>
  screen.getByRole("button", { name: /^(Facilities|Facility: )/ });

const addButton = () => screen.getByRole("button", { name: /^Add to / });

async function chooseFacility(name: string) {
  await userEvent.click(facilitiesToggle());
  await userEvent.click(
    within(screen.getByRole("menu", { name: "Facilities" })).getByRole(
      "menuitem",
      { name },
    ),
  );
}

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("AddHearingForm", () => {
  it("shows the design's copy", async () => {
    await renderForm();

    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Board session" }),
    ).toBeInTheDocument();
    // The modal's overlay fades in once react-modal marks it open, which can
    // land a moment after the first render.
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Full Board" })).toBeVisible(),
    );
    expect(screen.getByRole("radio", { name: "Business Mtg" })).toBeVisible();
    expect(facilitiesToggle()).toHaveTextContent("Facilities");
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Day" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(addButton()).toHaveTextContent("Add to September 16");
  });

  it("draws the board-session tiles at the design's height, with no label margin or padding", async () => {
    // Bootstrap Reboot, which the staff app loads, gives labels a margin.
    const reboot = document.createElement("style");
    reboot.textContent = "label { display: inline-block; margin-bottom: 8px; }";
    document.head.append(reboot);
    onTestFinished(() => reboot.remove());
    await renderForm();

    const tiles = [
      ...screen
        .getByRole("radiogroup", { name: "Board session" })
        .querySelectorAll(".ds-radio"),
    ];
    expect(tiles).toHaveLength(2);
    for (const element of tiles) {
      expect(getComputedStyle(element).height).toBe("2.25rem");
      const label = getComputedStyle(element.querySelector("label") as Element);
      expect(label.marginBottom).toBe("0px");
      expect(label.paddingTop).toBe("0px");
    }
  });

  it("lists the board sessions and facilities in sort order", async () => {
    await renderForm();

    expect(
      within(screen.getByRole("radiogroup", { name: "Board session" }))
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("value")),
    ).toEqual(["kind:FULL_BOARD", "kind:BUSINESS_MEETING"]);

    await userEvent.click(facilitiesToggle());
    const items = within(
      screen.getByRole("menu", { name: "Facilities" }),
    ).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(
      september2026Config.resources.map(({ label, name }) =>
        name === label ? label : `${label}${name}`,
      ),
    );
  });

  it("starts with nothing chosen and keeps the add button disabled until a choice", async () => {
    const { send } = await renderForm();

    for (const radio of within(
      screen.getByRole("radiogroup", { name: "Board session" }),
    ).getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(addButton()).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: "Business Mtg" }));
    expect(addButton()).toBeEnabled();

    await userEvent.click(addButton());
    await waitFor(() => expect(send).toHaveBeenCalledOnce());
  });

  it("adds with Enter in a field", async () => {
    const { send } = await renderForm({ initialChoice: "kind:FULL_BOARD" });

    fireEvent.keyDown(screen.getByRole("radio", { name: "September 16" }), {
      key: "Enter",
    });

    await waitFor(() => expect(send).toHaveBeenCalledOnce());
  });

  it("keeps the add button disabled with a choice but no day", async () => {
    await renderForm({ initialChoice: "kind:FULL_BOARD", initialDay: null });

    expect(addButton()).toHaveTextContent("Add to September");
    expect(addButton()).toBeDisabled();
  });

  it("shows a chosen facility in the toggle and clears the board session, without adding", async () => {
    const { send } = await renderForm({ initialChoice: "kind:FULL_BOARD" });
    expect(screen.getByRole("radio", { name: "Full Board" })).toBeChecked();

    await chooseFacility("FCF Fremont Correctional Facility");

    expect(facilitiesToggle()).toHaveAccessibleName(
      "Facility: FCF — Fremont Correctional Facility",
    );
    expect(facilitiesToggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("radio", { name: "Full Board" })).not.toBeChecked();
    expect(addButton()).toBeEnabled();
    expect(send).not.toHaveBeenCalled();
  });

  it("shows only the label when a facility's full name matches it", async () => {
    await renderForm();

    await chooseFacility("Boulder");

    expect(facilitiesToggle()).toHaveAccessibleName("Facility: Boulder");
  });

  it("clears the facility when a board session is chosen", async () => {
    await renderForm({ initialChoice: "resource:resource-FCF" });
    expect(facilitiesToggle()).toHaveAccessibleName(
      "Facility: FCF — Fremont Correctional Facility",
    );

    await userEvent.click(screen.getByRole("radio", { name: "Full Board" }));

    expect(screen.getByRole("radio", { name: "Full Board" })).toBeChecked();
    expect(facilitiesToggle()).toHaveAccessibleName("Facilities");
  });

  it("updates the add button with the chosen day", async () => {
    await renderForm({ initialChoice: "kind:FULL_BOARD" });

    await userEvent.click(screen.getByRole("radio", { name: "September 4" }));

    expect(addButton()).toHaveTextContent("Add to September 4");
  });

  it("disables the days outside the allowed weekdays", async () => {
    await renderForm();

    expect(screen.getByRole("radio", { name: "September 12" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "September 13" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "September 14" })).toBeEnabled();
  });

  it("disables the choices already on the chosen day and says why", async () => {
    await renderForm({
      initialDay: "2026-09-18",
      alreadyOnDay: ["kind:FULL_BOARD", "resource:resource-FCF"],
    });

    expect(
      screen.getByRole("radio", {
        name: "Full Board (already on September 18)",
      }),
    ).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Business Mtg" })).toBeEnabled();

    await userEvent.click(facilitiesToggle());
    const menu = screen.getByRole("menu", { name: "Facilities" });
    expect(
      within(menu).getByRole("menuitem", {
        name: "FCF Fremont Correctional Facility (already on September 18)",
      }),
    ).toBeDisabled();
    expect(
      within(menu).getByRole("menuitem", {
        name: "CSP Colorado State Penitentiary",
      }),
    ).toBeEnabled();
  });

  it("keeps a choice that is already on the day selected but blocks adding it", async () => {
    await renderForm({
      initialChoice: "resource:resource-FCF",
      alreadyOnDay: ["resource:resource-FCF"],
    });

    expect(facilitiesToggle()).toHaveAccessibleName(
      "Facility: FCF — Fremont Correctional Facility",
    );
    expect(addButton()).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: "Business Mtg" }));
    expect(addButton()).toBeEnabled();
  });

  it("marks the chosen facility in the open menu", async () => {
    await renderForm({ initialChoice: "resource:resource-CSP" });

    await userEvent.click(facilitiesToggle());

    expect(
      within(screen.getByRole("menu", { name: "Facilities" })).getByRole(
        "menuitem",
        { name: "CSP Colorado State Penitentiary (selected)" },
      ),
    ).toBeInTheDocument();
  });

  it("waits and disables every choice and Cancel while adding", async () => {
    await renderForm({
      initialChoice: "resource:resource-FCF",
      send: () => new Promise(() => undefined),
    });

    await userEvent.click(addButton());

    await waitFor(() =>
      expect(addButton()).toHaveAttribute("aria-busy", "true"),
    );
    expect(addButton()).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Full Board" })).toBeDisabled();
    expect(facilitiesToggle()).toBeDisabled();
    expect(screen.getByRole("radio", { name: "September 16" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("shows a refused add as an alert above the buttons", async () => {
    await renderForm({
      initialChoice: "resource:resource-FCF",
      initialDay: "2026-09-14",
      send: () =>
        Promise.reject(
          calendarApiError("CONFLICT", "FCF is already on September 14."),
        ),
    });

    await userEvent.click(addButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "FCF is already on September 14.",
    );
  });

  it("calls onCancel from Cancel", async () => {
    const { onCancel } = await renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("has no axe violations with a choice, disabled options and an error", async () => {
    await renderForm({
      initialChoice: "resource:resource-FCF",
      initialDay: "2026-09-18",
      alreadyOnDay: ["kind:FULL_BOARD", "resource:resource-CSP"],
      send: () =>
        Promise.reject(
          calendarApiError("CONFLICT", "FCF is already on September 18."),
        ),
    });
    await userEvent.click(addButton());
    await screen.findByRole("alert");

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
