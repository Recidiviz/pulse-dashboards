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

import { fireEvent, render } from "@testing-library/react";

import { SidebarReleaseDateChangeBanner } from "../SidebarReleaseDateChangeBanner";

vi.mock("../../../../assets/x.svg?react", () => ({
  default: () => <svg data-testid="x-icon" />,
}));

const releaseDate = new Date("2026-04-20T00:00:00.000Z");

test("shows the new release date and how far it moved later", () => {
  const screen = render(
    <SidebarReleaseDateChangeBanner
      expectedReleaseDate={releaseDate}
      deltaDays={7}
      onDismiss={vi.fn()}
    />,
  );

  expect(screen.getByText("April 20, 2026")).toBeInTheDocument();
  expect(
    screen.getByText("Release Date moved 7 days later"),
  ).toBeInTheDocument();
});

test("uses the singular day form and the earlier direction", () => {
  const screen = render(
    <SidebarReleaseDateChangeBanner
      expectedReleaseDate={releaseDate}
      deltaDays={-1}
      onDismiss={vi.fn()}
    />,
  );

  expect(
    screen.getByText("Release Date moved 1 day earlier"),
  ).toBeInTheDocument();
});

test("invokes the dismiss callback from its close control", () => {
  const onDismiss = vi.fn();

  const screen = render(
    <SidebarReleaseDateChangeBanner
      expectedReleaseDate={releaseDate}
      deltaDays={7}
      onDismiss={onDismiss}
    />,
  );

  fireEvent.click(screen.getByLabelText("Dismiss release date change"));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
