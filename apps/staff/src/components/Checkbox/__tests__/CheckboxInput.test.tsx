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
import { createRef } from "react";

import { palette } from "~design-system";

import { CheckboxInput } from "../CheckboxInput";

describe("CheckboxInput", () => {
  describe("accessibility", () => {
    test("exposes a visible checkbox role using aria-label as the accessible name", () => {
      render(<CheckboxInput aria-label="Accept terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
      expect(checkbox).toBeVisible();
    });

    test("is unchecked by default", () => {
      render(<CheckboxInput aria-label="terms" />);
      expect(screen.getByRole("checkbox", { name: "terms" })).not.toBeChecked();
    });

    test("reflects the checked prop", () => {
      render(<CheckboxInput aria-label="terms" checked readOnly />);
      expect(screen.getByRole("checkbox", { name: "terms" })).toBeChecked();
    });

    test("exposes disabled state to assistive tech", () => {
      render(<CheckboxInput aria-label="terms" disabled />);
      expect(screen.getByRole("checkbox", { name: "terms" })).toBeDisabled();
    });

    test("user click toggles the checked state", () => {
      render(<CheckboxInput aria-label="terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe("behavior", () => {
    test("fires onChange with the native event on toggle", () => {
      const onChange = vi.fn();
      render(<CheckboxInput aria-label="terms" onChange={onChange} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "terms" }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target.checked).toBe(true);
    });

    test("forwards a ref to the input", () => {
      const ref = createRef<HTMLInputElement>();
      render(<CheckboxInput aria-label="terms" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe("checkbox");
    });

    test("spreads pass-through props onto the input", () => {
      render(
        <CheckboxInput
          aria-label="terms"
          name="agree"
          value="yes"
          data-testid="agree-cb"
        />,
      );
      const input = screen.getByTestId("agree-cb") as HTMLInputElement;
      expect(input.name).toBe("agree");
      expect(input.value).toBe("yes");
    });
  });

  describe("visibility and state styling", () => {
    test("renders a visible empty box by default — no fill, no check background", () => {
      render(<CheckboxInput aria-label="terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toBeVisible();
      expect(checkbox).toHaveStyleRule(
        "border",
        `1px solid ${palette.slate30}`,
      );
      expect(checkbox).toHaveStyleRule("background-color", "transparent");
    });

    test("paints pine4 fill and a check background when checked", () => {
      render(<CheckboxInput aria-label="terms" checked readOnly />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule("background-color", palette.pine4, {
        modifier: ":checked",
      });
      expect(checkbox).toHaveStyleRule("border-color", palette.pine4, {
        modifier: ":checked",
      });
      // The check glyph is a baked-in data URI background image; just confirm
      // that *some* background-image rule is applied in the :checked state.
      expect(checkbox).toHaveStyleRule(
        "background-image",
        expect.stringContaining("data:image/svg+xml"),
        { modifier: ":checked" },
      );
    });

    test("darkens the border on hover when enabled and unchecked", () => {
      render(<CheckboxInput aria-label="terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule("border-color", palette.slate70, {
        modifier: ":hover:not(:disabled):not(:checked)",
      });
    });

    test("darkens the fill on hover when enabled and checked", () => {
      render(<CheckboxInput aria-label="terms" checked readOnly />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule("background-color", palette.pine3, {
        modifier: ":hover:not(:disabled):checked",
      });
    });

    test("scales down on active press when enabled", () => {
      render(<CheckboxInput aria-label="terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule("transform", "scale(0.94)", {
        modifier: ":active:not(:disabled)",
      });
    });

    test("shows a focus outline when focus-visible", () => {
      render(<CheckboxInput aria-label="terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule(
        "outline",
        `2px solid ${palette.signal.links}`,
        { modifier: ":focus-visible" },
      );
    });

    test("dims and flips the cursor when disabled", () => {
      render(<CheckboxInput aria-label="terms" disabled />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule("opacity", "0.5", {
        modifier: ":disabled",
      });
      expect(checkbox).toHaveStyleRule("cursor", "not-allowed", {
        modifier: ":disabled",
      });
    });

    test("size prop drives the checkbox edge length", () => {
      render(<CheckboxInput aria-label="terms" size={24} />);
      const checkbox = screen.getByRole("checkbox", { name: "terms" });
      expect(checkbox).toHaveStyleRule("width", "1.5rem");
      expect(checkbox).toHaveStyleRule("height", "1.5rem");
    });
  });
});
