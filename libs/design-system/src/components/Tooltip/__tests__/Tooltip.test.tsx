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
import { rem } from "polished";

import { palette } from "../../../styles";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  it("renders its children with the default tooltip background color", () => {
    render(<Tooltip>Hello tooltip</Tooltip>);
    const node = screen.getByText("Hello tooltip");
    expect(node).toBeInTheDocument();
    expect(node).toHaveStyleRule("background-color", palette.signal.tooltip);
  });

  it("respects a custom maxWidth (in pixels, rendered as rem)", () => {
    render(<Tooltip maxWidth={240}>Constrained</Tooltip>);
    const node = screen.getByText("Constrained");
    expect(node).toHaveStyleRule("max-width", rem(240));
  });

  it("defaults max-width to 'none' when maxWidth is not provided", () => {
    render(<Tooltip>Unbounded</Tooltip>);
    const node = screen.getByText("Unbounded");
    expect(node).toHaveStyleRule("max-width", "none");
  });

  it("respects a custom backgroundColor", () => {
    render(<Tooltip backgroundColor="rgb(0, 0, 0)">Black bg</Tooltip>);
    const node = screen.getByText("Black bg");
    expect(node).toHaveStyleRule("background-color", "rgb(0, 0, 0)");
  });

  it("forwards standard div props (className, data-*)", () => {
    render(
      <Tooltip className="my-tip" data-testid="tip">
        Props
      </Tooltip>,
    );
    const node = screen.getByTestId("tip");
    expect(node).toHaveClass("my-tip");
  });
});
