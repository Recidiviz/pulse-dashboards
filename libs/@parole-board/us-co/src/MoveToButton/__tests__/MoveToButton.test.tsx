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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";

import { MoveToButton } from "../MoveToButton";

describe("MoveToButton", () => {
  it("reads 'Move to…' and is named with that text, the entry and its day", () => {
    render(<MoveToButton label="CCF" date="2026-09-15" onClick={vi.fn()} />);

    const button = screen.getByRole("button", {
      name: "Move to…: CCF on September 15",
    });
    expect(button).toHaveTextContent("Move to…");
  });

  it("is named with the hearing count when several are selected", async () => {
    const onClick = vi.fn();
    render(<MoveToButton count={3} onClick={onClick} />);

    const button = screen.getByRole("button", {
      name: "Move to…: 3 hearings",
    });
    expect(button).toHaveTextContent("Move to…");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick from the keyboard", async () => {
    const onClick = vi.fn();
    render(<MoveToButton label="CCF" date="2026-09-15" onClick={onClick} />);

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled", async () => {
    const onClick = vi.fn();
    render(
      <MoveToButton label="CCF" date="2026-09-15" disabled onClick={onClick} />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards its ref to the button, so focus can return to it", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <MoveToButton
        ref={ref}
        label="CCF"
        date="2026-09-15"
        onClick={vi.fn()}
      />,
    );

    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MoveToButton label="CCF" date="2026-09-15" onClick={vi.fn()} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
