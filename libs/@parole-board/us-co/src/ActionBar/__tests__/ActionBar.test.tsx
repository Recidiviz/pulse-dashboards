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
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { semantics } from "~@parole-board/common";

import { ActionBar } from "../ActionBar";

describe("ActionBar", () => {
  it("shows the label, then the day with its full month", () => {
    const { container } = render(
      <ActionBar selected={[{ label: "FCF", date: "2026-09-14" }]} />,
    );

    expect(container).toHaveTextContent(/^FCF · September 14$/);
    expect(screen.getByText("· September 14")).toHaveStyleRule(
      "color",
      semantics.text.secondary,
    );
  });

  it("shows the first of the month as that day, unpadded", () => {
    const { container } = render(
      <ActionBar selected={[{ label: "FCF", date: "2026-09-01" }]} />,
    );

    expect(container).toHaveTextContent(/· September 1$/);
  });

  it("renders no toolbar and nothing focusable without actions", async () => {
    const user = userEvent.setup();
    render(<ActionBar selected={[{ label: "FCF", date: "2026-09-14" }]} />);

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("names the toolbar after the entry and its day, with the actions after the summary", () => {
    render(
      <ActionBar selected={[{ label: "ISP Grfld/Mesa", date: "2026-09-24" }]}>
        <button type="button">Delete hearing</button>
      </ActionBar>,
    );

    const toolbar = screen.getByRole("toolbar", {
      name: "Actions for ISP Grfld/Mesa on September 24",
    });
    expect(
      within(toolbar).getByRole("button", { name: "Delete hearing" }),
    ).toBeInTheDocument();
    expect(toolbar).toHaveTextContent(
      /^ISP Grfld\/Mesa · September 24Delete hearing$/,
    );
  });

  it("moves focus between actions with the arrow keys, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(
      <ActionBar selected={[{ label: "Full Board", date: "2026-09-11" }]}>
        <button type="button">Cancel</button>
        <button type="button">Delete hearing</button>
      </ActionBar>,
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const remove = screen.getByRole("button", { name: "Delete hearing" });
    cancel.focus();

    await user.keyboard("{ArrowRight}");
    expect(remove).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(cancel).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(remove).toHaveFocus();
  });

  it("keeps an empty slot a control's height with nothing selected", () => {
    const { container } = render(<ActionBar selected={[]} />);

    const slot = container.firstElementChild;
    expect(slot).toBeEmptyDOMElement();
    expect(slot).toHaveStyleRule("min-height", semantics.size.control);
  });

  it("shows the hint, in the same slot, with nothing selected", () => {
    const { container } = render(
      <ActionBar selected={[]} hint="Drag a session to move it" />,
    );

    const slot = container.firstElementChild;
    expect(slot).toHaveTextContent("Drag a session to move it");
    expect(slot).toHaveStyleRule("min-height", semantics.size.control);
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("hides the hint once an entry is selected", () => {
    render(
      <ActionBar
        selected={[{ label: "FCF", date: "2026-09-14" }]}
        hint="Drag a session to move it"
      />,
    );

    expect(
      screen.queryByText("Drag a session to move it"),
    ).not.toBeInTheDocument();
  });

  it("is a control's height with an entry selected", () => {
    const { container } = render(
      <ActionBar selected={[{ label: "FCF", date: "2026-09-14" }]} />,
    );

    expect(container.firstElementChild).toHaveStyleRule(
      "min-height",
      semantics.size.control,
    );
  });

  describe("with several selected", () => {
    const several = [
      { label: "FCF", date: "2026-09-14" },
      { label: "CCF", date: "2026-09-15" },
      { label: "SCF", date: "2026-09-15" },
    ];

    it("keeps an empty slot while it has no actions", () => {
      const { container } = render(<ActionBar selected={several} />);

      expect(container.firstElementChild).toBeEmptyDOMElement();
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    it("names the toolbar after the count, with no label or day", async () => {
      const { container } = render(
        <ActionBar selected={several}>
          <button type="button">Move to…</button>
        </ActionBar>,
      );

      const toolbar = screen.getByRole("toolbar", {
        name: "Actions for 3 selected hearings",
      });
      expect(toolbar).toHaveTextContent(/^Move to…$/);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("has no axe violations, with and without actions", async () => {
    const { container, rerender } = render(
      <ActionBar selected={[{ label: "FCF", date: "2026-09-14" }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <ActionBar selected={[{ label: "FCF", date: "2026-09-14" }]}>
        <button type="button">Delete hearing</button>
      </ActionBar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
