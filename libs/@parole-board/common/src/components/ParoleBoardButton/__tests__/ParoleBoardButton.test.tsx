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

import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { getContrast } from "polished";
import { createRef } from "react";

import { semantics } from "../../../theme";
import { ParoleBoardButton } from "../ParoleBoardButton";

describe("ParoleBoardButton", () => {
  it("calls onClick when it isn't waiting", () => {
    const onClick = vi.fn();
    render(<ParoleBoardButton onClick={onClick}>Save</ParoleBoardButton>);

    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(
      screen.queryByTestId("parole-board-button-spinner"),
    ).not.toBeInTheDocument();
  });

  it("shows a spinner, sets aria-busy and ignores clicks while waiting", () => {
    const onClick = vi.fn();
    render(
      <ParoleBoardButton waiting onClick={onClick}>
        Save
      </ParoleBoardButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByTestId("parole-board-button-spinner"),
    ).toBeInTheDocument();
  });

  it("doesn't submit its form while waiting", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ParoleBoardButton type="submit" waiting>
          Publish
        </ParoleBoardButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("is disabled but not busy when only disabled is set", () => {
    render(<ParoleBoardButton disabled>Save</ParoleBoardButton>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("shows the spinner in place of an icon while waiting", () => {
    const { rerender } = render(
      <ParoleBoardButton icon="ItemDelete" aria-label="Delete hearing" />,
    );
    const button = screen.getByRole("button", { name: "Delete hearing" });
    expect(button.querySelector("svg")).toBeInTheDocument();

    rerender(
      <ParoleBoardButton
        icon="ItemDelete"
        aria-label="Delete hearing"
        waiting
      />,
    );

    expect(button.querySelector("svg")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("parole-board-button-spinner"),
    ).toBeInTheDocument();
  });

  it("calls onClick on a destructive button", () => {
    const onClick = vi.fn();
    render(
      <ParoleBoardButton kind="destructive" onClick={onClick}>
        Delete
      </ParoleBoardButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables a destructive button and ignores clicks while waiting", () => {
    const onClick = vi.fn();
    render(
      <ParoleBoardButton kind="destructive" waiting onClick={onClick}>
        Delete
      </ParoleBoardButton>,
    );

    const button = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it.each([
    ["idle", false],
    ["waiting", true],
  ])(
    "has no accessibility violations as a %s destructive button",
    async (_, waiting) => {
      const { container } = render(
        <ParoleBoardButton kind="destructive" waiting={waiting}>
          Delete
        </ParoleBoardButton>,
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it("shows the spinner on a waiting link button", () => {
    render(
      <ParoleBoardButton kind="link" waiting>
        Undo
      </ParoleBoardButton>,
    );

    const button = screen.getByRole("button", { name: "Undo" });
    expect(button).toBeDisabled();
    expect(
      screen.getByTestId("parole-board-button-spinner"),
    ).toBeInTheDocument();
  });

  it("uses destructive fill and text tokens that meet AA contrast", () => {
    expect(
      getContrast(semantics.text.onColor, semantics.action.destructive),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("forwards its ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ParoleBoardButton ref={ref}>Save</ParoleBoardButton>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
  });
});
