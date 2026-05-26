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

import { AddedTasksSkeleton } from "../AddedTasksSkeleton";

describe("AddedTasksSkeleton", () => {
  test("renders a status region with an aria-label", () => {
    render(<AddedTasksSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading added tasks",
    );
  });

  test("renders three skeleton rows", () => {
    const { container } = render(<AddedTasksSkeleton />);
    // Three child rows in the wrapper
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.childElementCount).toBe(3);
  });
});
