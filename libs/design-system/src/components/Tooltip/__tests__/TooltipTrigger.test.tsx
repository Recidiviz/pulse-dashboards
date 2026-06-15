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
import { rem } from "polished";

import { TooltipTrigger } from "../TooltipTrigger";

const getTrigger = () => {
  const button = screen.getByRole("button", { name: "Trigger" });
  const parent = button.parentElement;
  if (!parent) throw new Error("trigger wrapper not found");
  return parent;
};

describe("TooltipTrigger", () => {
  it("renders the child without the tooltip initially", () => {
    render(
      <TooltipTrigger contents="Hint">
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    expect(screen.getByRole("button", { name: "Trigger" })).toBeInTheDocument();
    expect(screen.queryByText("Hint")).not.toBeInTheDocument();
  });

  it("portals the tooltip into document.body after mouseEnter", () => {
    render(
      <TooltipTrigger contents="Hint contents">
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();
    fireEvent.mouseEnter(trigger);

    const tip = screen.getByText("Hint contents");
    expect(tip).toBeInTheDocument();
    expect(document.body.contains(tip)).toBe(true);
    expect(trigger.contains(tip)).toBe(false);
  });

  it("removes the tooltip immediately on mouseLeave", () => {
    render(
      <TooltipTrigger contents="Goodbye">
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();

    fireEvent.mouseEnter(trigger);
    expect(screen.getByText("Goodbye")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByText("Goodbye")).not.toBeInTheDocument();
  });

  it("shows the tooltip on focus and removes it immediately on blur", () => {
    render(
      <TooltipTrigger contents="Focus tip">
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();

    fireEvent.focus(trigger);
    expect(screen.getByText("Focus tip")).toBeInTheDocument();

    fireEvent.blur(trigger);
    expect(screen.queryByText("Focus tip")).not.toBeInTheDocument();
  });

  it("does not show the tooltip when contents is falsy", () => {
    render(
      <TooltipTrigger contents="">
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();
    fireEvent.mouseEnter(trigger);
    expect(document.body.querySelectorAll("[style*='top']").length).toBe(0);
  });

  it("respects maxWidth on the portaled tooltip", () => {
    render(
      <TooltipTrigger contents="With width" maxWidth={200}>
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();
    fireEvent.mouseEnter(trigger);
    const tip = screen.getByText("With width");
    expect(tip).toHaveStyleRule("max-width", rem(200));
  });

  it("respects a custom backgroundColor on the portaled tooltip", () => {
    render(
      <TooltipTrigger contents="With bg" backgroundColor="rgb(10, 20, 30)">
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();
    fireEvent.mouseEnter(trigger);
    const tip = screen.getByText("With bg");
    expect(tip).toHaveStyleRule("background-color", "rgb(10, 20, 30)");
  });

  it("renders ReactNode contents (not just strings)", () => {
    render(
      <TooltipTrigger contents={<span data-testid="rich">Rich contents</span>}>
        <button type="button">Trigger</button>
      </TooltipTrigger>,
    );
    const trigger = getTrigger();
    fireEvent.mouseEnter(trigger);
    expect(screen.getByTestId("rich")).toBeInTheDocument();
  });
});
