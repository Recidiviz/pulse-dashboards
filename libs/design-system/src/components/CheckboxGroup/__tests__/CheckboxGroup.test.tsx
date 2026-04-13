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

import { Checkbox } from "../Checkbox";
import { CheckboxGroup } from "../CheckboxGroup";

const renderGroup = (props?: {
  initial?: string[];
  ariaLabel?: string;
  onChange?: (value: string[]) => void;
}) => {
  const Wrapper = () => {
    const [value, setValue] = useState<string[]>(props?.initial ?? []);
    return (
      <CheckboxGroup
        ariaLabel={props?.ariaLabel ?? "Test group"}
        value={value}
        onChange={(v) => {
          setValue(v);
          props?.onChange?.(v);
        }}
      >
        <Checkbox value="a">Option A</Checkbox>
        <Checkbox value="b">Option B</Checkbox>
        <Checkbox value="c">Option C</Checkbox>
      </CheckboxGroup>
    );
  };
  return render(<Wrapper />);
};

const getCheckboxes = () =>
  screen.getAllByRole("checkbox") as HTMLInputElement[];

describe("CheckboxGroup", () => {
  it("renders a group with the provided label", () => {
    renderGroup({ ariaLabel: "Categories" });
    expect(
      screen.getByRole("group", { name: "Categories" }),
    ).toBeInTheDocument();
    expect(getCheckboxes()).toHaveLength(3);
  });

  it("reflects the controlled value as checked state", () => {
    renderGroup({ initial: ["a", "c"] });
    const [a, b, c] = getCheckboxes();
    expect(a.checked).toBe(true);
    expect(b.checked).toBe(false);
    expect(c.checked).toBe(true);
  });

  it("places exactly one tab stop on the first checkbox by default", () => {
    renderGroup();
    const [a, b, c] = getCheckboxes();
    expect(a.tabIndex).toBe(0);
    expect(b.tabIndex).toBe(-1);
    expect(c.tabIndex).toBe(-1);
  });

  it("toggles a value on click without affecting other values", () => {
    const onChange = vi.fn();
    renderGroup({ initial: ["a"], onChange });
    fireEvent.click(getCheckboxes()[1]);
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    fireEvent.click(getCheckboxes()[0]);
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
  });

  it("ArrowDown moves focus without toggling state", () => {
    const onChange = vi.fn();
    renderGroup({ initial: ["a"], onChange });
    const boxes = getCheckboxes();
    boxes[0].focus();
    fireEvent.keyDown(boxes[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(boxes[1]);
    expect(onChange).not.toHaveBeenCalled();
    expect(boxes[1].checked).toBe(false);
  });

  it("ArrowUp wraps to the last checkbox", () => {
    renderGroup();
    const boxes = getCheckboxes();
    boxes[0].focus();
    fireEvent.keyDown(boxes[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(boxes[2]);
  });

  it("Home / End jump to the first / last checkbox", () => {
    renderGroup();
    const boxes = getCheckboxes();
    boxes[1].focus();
    fireEvent.keyDown(boxes[1], { key: "End" });
    expect(document.activeElement).toBe(boxes[2]);
    fireEvent.keyDown(boxes[2], { key: "Home" });
    expect(document.activeElement).toBe(boxes[0]);
  });

  it("moves the tab stop to follow keyboard focus", () => {
    renderGroup();
    const boxes = getCheckboxes();
    boxes[0].focus();
    fireEvent.keyDown(boxes[0], { key: "ArrowDown" });
    expect(boxes[0].tabIndex).toBe(-1);
    expect(boxes[1].tabIndex).toBe(0);
    expect(boxes[2].tabIndex).toBe(-1);
  });

  it("uses ArrowRight/Left when orientation is horizontal", () => {
    const Wrapper = () => {
      const [value, setValue] = useState<string[]>([]);
      return (
        <CheckboxGroup
          ariaLabel="Group"
          value={value}
          onChange={setValue}
          orientation="horizontal"
        >
          <Checkbox value="a">A</Checkbox>
          <Checkbox value="b">B</Checkbox>
        </CheckboxGroup>
      );
    };
    render(<Wrapper />);
    const boxes = getCheckboxes();
    boxes[0].focus();
    fireEvent.keyDown(boxes[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(boxes[1]);
  });

  it("throws when Checkbox is rendered outside CheckboxGroup", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Checkbox value="x">X</Checkbox>)).toThrow(
      /Checkbox must be rendered inside a <CheckboxGroup>/,
    );
    spy.mockRestore();
  });

  it("has no axe violations", async () => {
    const { container } = renderGroup({ initial: ["a"] });
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("ariaLabel + no children", () => {
    it("uses aria-label as the accessible name when children is omitted", () => {
      const Wrapper = () => (
        <CheckboxGroup ariaLabel="Group" value={[]} onChange={() => undefined}>
          <Checkbox value="a" ariaLabel="Select all options" />
        </CheckboxGroup>
      );
      render(<Wrapper />);
      const box = screen.getByRole("checkbox", { name: "Select all options" });
      expect(box).toBeInTheDocument();
      // No visible label span
      expect(
        document.querySelector(".ds-checkbox__label"),
      ).not.toBeInTheDocument();
    });
  });

  describe("indeterminate", () => {
    it("sets the native indeterminate property when prop is true", () => {
      const Wrapper = () => (
        <CheckboxGroup
          ariaLabel="Group"
          value={["a"]}
          onChange={() => undefined}
        >
          <Checkbox value="a" indeterminate>
            A
          </Checkbox>
        </CheckboxGroup>
      );
      render(<Wrapper />);
      const [box] = getCheckboxes();
      // Native checkboxes expose indeterminate via the DOM property, not as
      // an `aria-checked="mixed"` attribute. Screen readers read the native
      // state directly.
      expect(box.indeterminate).toBe(true);
    });

    it("clears the native indeterminate property when prop becomes false", () => {
      const Wrapper = ({ mixed }: { mixed: boolean }) => (
        <CheckboxGroup ariaLabel="Group" value={[]} onChange={() => undefined}>
          <Checkbox value="a" indeterminate={mixed}>
            A
          </Checkbox>
        </CheckboxGroup>
      );
      const { rerender } = render(<Wrapper mixed />);
      expect(getCheckboxes()[0].indeterminate).toBe(true);
      rerender(<Wrapper mixed={false} />);
      expect(getCheckboxes()[0].indeterminate).toBe(false);
    });
  });

  describe("meta-control (checked + onChange overrides)", () => {
    const renderWithMeta = (overrides?: {
      metaChecked?: boolean;
      metaIndeterminate?: boolean;
      onMetaChange?: (next: boolean) => void;
      groupValue?: string[];
      onGroupChange?: (next: string[]) => void;
    }) => {
      const Wrapper = () => (
        <CheckboxGroup
          ariaLabel="Group"
          value={overrides?.groupValue ?? []}
          onChange={overrides?.onGroupChange ?? (() => undefined)}
        >
          <Checkbox
            value="__meta__"
            checked={overrides?.metaChecked ?? false}
            indeterminate={overrides?.metaIndeterminate}
            onChange={overrides?.onMetaChange}
          >
            Select all
          </Checkbox>
          <Checkbox value="a">A</Checkbox>
          <Checkbox value="b">B</Checkbox>
        </CheckboxGroup>
      );
      return render(<Wrapper />);
    };

    it("derives checked from the override, not from group value", () => {
      renderWithMeta({ metaChecked: true, groupValue: [] });
      const [meta] = getCheckboxes();
      expect(meta.checked).toBe(true);
    });

    it("calls the override onChange instead of toggling group value", () => {
      const onMetaChange = vi.fn();
      const onGroupChange = vi.fn();
      renderWithMeta({
        metaChecked: false,
        onMetaChange,
        onGroupChange,
      });
      fireEvent.click(getCheckboxes()[0]);
      expect(onMetaChange).toHaveBeenCalledWith(true);
      expect(onGroupChange).not.toHaveBeenCalled();
    });

    it("participates in roving tabindex alongside regular checkboxes", () => {
      renderWithMeta({ metaChecked: false });
      const [meta, a, b] = getCheckboxes();
      expect(meta.tabIndex).toBe(0);
      expect(a.tabIndex).toBe(-1);
      expect(b.tabIndex).toBe(-1);

      meta.focus();
      fireEvent.keyDown(meta, { key: "ArrowDown" });
      expect(document.activeElement).toBe(a);

      fireEvent.keyDown(a, { key: "ArrowUp" });
      expect(document.activeElement).toBe(meta);
    });

    it("regular checkboxes still toggle group value normally", () => {
      const onGroupChange = vi.fn();
      renderWithMeta({ onGroupChange });
      fireEvent.click(getCheckboxes()[1]);
      expect(onGroupChange).toHaveBeenCalledWith(["a"]);
    });
  });
});
