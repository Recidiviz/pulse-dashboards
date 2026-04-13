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
import { useState } from "react";

import { Radio } from "../Radio";
import { RadioGroup } from "../RadioGroup";

const renderGroup = (props?: {
  initial?: string;
  ariaLabel?: string;
  onChange?: (value: string) => void;
}) => {
  const Wrapper = () => {
    const [value, setValue] = useState<string | undefined>(props?.initial);
    return (
      <RadioGroup
        ariaLabel={props?.ariaLabel ?? "Test group"}
        value={value}
        onChange={(v) => {
          setValue(v);
          props?.onChange?.(v);
        }}
      >
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
        <Radio value="c">Option C</Radio>
      </RadioGroup>
    );
  };
  return render(<Wrapper />);
};

const getRadios = () => screen.getAllByRole("radio") as HTMLInputElement[];

describe("RadioGroup", () => {
  it("renders a radiogroup with the provided label", () => {
    renderGroup({ ariaLabel: "Time period" });
    expect(
      screen.getByRole("radiogroup", { name: "Time period" }),
    ).toBeInTheDocument();
    expect(getRadios()).toHaveLength(3);
  });

  it("reflects the controlled value as checked", () => {
    renderGroup({ initial: "b" });
    const [a, b, c] = getRadios();
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
    expect(c.checked).toBe(false);
  });

  it("places the only tab stop on the checked radio", () => {
    renderGroup({ initial: "b" });
    const [a, b, c] = getRadios();
    expect(a.tabIndex).toBe(-1);
    expect(b.tabIndex).toBe(0);
    expect(c.tabIndex).toBe(-1);
  });

  it("places the tab stop on the first radio when nothing is checked", () => {
    renderGroup();
    const [a, b, c] = getRadios();
    expect(a.tabIndex).toBe(0);
    expect(b.tabIndex).toBe(-1);
    expect(c.tabIndex).toBe(-1);
  });

  it("calls onChange when a radio is clicked", () => {
    const onChange = vi.fn();
    renderGroup({ onChange });
    fireEvent.click(getRadios()[2]);
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("ArrowDown moves focus to next radio and selects it (APG)", () => {
    const onChange = vi.fn();
    renderGroup({ initial: "a", onChange });
    const radios = getRadios();
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith("b");
    expect(document.activeElement).toBe(radios[1]);
  });

  it("ArrowUp wraps to the last radio and selects it", () => {
    const onChange = vi.fn();
    renderGroup({ initial: "a", onChange });
    const radios = getRadios();
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith("c");
    expect(document.activeElement).toBe(radios[2]);
  });

  it("Home / End jump to the first / last radio", () => {
    const onChange = vi.fn();
    renderGroup({ initial: "b", onChange });
    const radios = getRadios();
    radios[1].focus();
    fireEvent.keyDown(radios[1], { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("c");
    expect(document.activeElement).toBe(radios[2]);

    fireEvent.keyDown(radios[2], { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("a");
    expect(document.activeElement).toBe(radios[0]);
  });

  it("uses ArrowRight/Left when orientation is horizontal", () => {
    const Wrapper = () => {
      const [value, setValue] = useState<string | undefined>("a");
      return (
        <RadioGroup
          ariaLabel="Group"
          value={value}
          onChange={setValue}
          orientation="horizontal"
        >
          <Radio value="a">A</Radio>
          <Radio value="b">B</Radio>
        </RadioGroup>
      );
    };
    render(<Wrapper />);
    const radios = getRadios();
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(radios[1]);
  });

  it("does not move focus on unrelated keys", () => {
    renderGroup({ initial: "a" });
    const radios = getRadios();
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "Enter" });
    expect(document.activeElement).toBe(radios[0]);
  });

  it("throws when Radio is rendered outside RadioGroup", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Radio value="x">X</Radio>)).toThrow(
      /Radio must be rendered inside a <RadioGroup>/,
    );
    spy.mockRestore();
  });

  it("has no axe violations", async () => {
    const { container } = renderGroup({ initial: "a" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
