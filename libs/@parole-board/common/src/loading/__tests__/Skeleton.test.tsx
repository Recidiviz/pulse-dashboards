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

import { semantics } from "../../theme";
import { AdminPageSkeleton } from "../AdminPageSkeleton";
import { Skeleton, SkeletonGroup, SkeletonText } from "../Skeleton";

describe("Skeleton", () => {
  test("is hidden from assistive tech inside a named loading status", () => {
    render(
      <SkeletonGroup label="Loading the calendar">
        <Skeleton width={144} height={38} />
        <SkeletonText width={120} level="Sans14" />
      </SkeletonGroup>,
    );

    const status = screen.getByRole("status", { name: "Loading the calendar" });
    expect(status).toHaveTextContent("Loading the calendar");
    for (const bar of screen.getAllByTestId("skeleton")) {
      expect(bar.closest("[aria-hidden]")).not.toBeNull();
    }
  });

  test("stops pulsing when the user prefers reduced motion", () => {
    render(<Skeleton height={20} />);

    expect(screen.getByTestId("skeleton")).toHaveStyleRule(
      "animation",
      "none",
      { media: "(prefers-reduced-motion: reduce)" },
    );
  });

  test("fills with the hover surface and the control radius", () => {
    render(<Skeleton height={20} />);

    const bar = screen.getByTestId("skeleton");
    expect(bar).toHaveStyleRule("background", semantics.surface.hover);
    expect(bar).toHaveStyleRule("border-radius", semantics.radius.control);
  });

  test("a pill skeleton rounds like the DS Button's default shape", () => {
    render(<Skeleton height={40} pill />);

    expect(screen.getByTestId("skeleton")).toHaveStyleRule(
      "border-radius",
      semantics.radius.pill,
    );
  });
});

describe("AdminPageSkeleton", () => {
  test("announces one loading status for the page", () => {
    render(<AdminPageSkeleton />);

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(
      screen.getByRole("status", { name: "Loading the calendar" }),
    ).toBeInTheDocument();
  });
});
