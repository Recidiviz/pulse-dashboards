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
import { axe } from "jest-axe";

import { AlertType } from "~@idaho-th/shared";

import { SidebarReleaseDateRow } from "../SidebarReleaseDateRow";

vi.mock("../../../../assets/calendar.svg?react", () => ({
  default: () => <svg data-testid="calendar-icon" />,
}));

vi.mock("../../../../assets/x.svg?react", () => ({
  default: () => <svg data-testid="x-icon" />,
}));

test("formats the expected release date for display", () => {
  const screen = render(
    <SidebarReleaseDateRow expectedReleaseDate={new Date(2026, 3, 20)} />,
  );

  expect(screen.getByText("April 20, 2026")).toBeInTheDocument();
  expect(screen.getByText("Release date")).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Update release date"),
  ).not.toBeInTheDocument();
});

test("shows an em dash placeholder when the date is missing", () => {
  const screen = render(<SidebarReleaseDateRow expectedReleaseDate={null} />);
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("exposes the calendar edit control only for CMs", () => {
  const onEditClick = vi.fn();

  const screen = render(
    <SidebarReleaseDateRow
      expectedReleaseDate={new Date(2026, 3, 20)}
      onEditClick={onEditClick}
    />,
  );

  fireEvent.click(screen.getByLabelText("Update release date"));
  expect(onEditClick).toHaveBeenCalledTimes(1);
});

const releaseDateAlert = {
  id: "alert-1",
  type: AlertType.RELEASE_DATE_CHANGED,
  metadata: { deltaDays: 7 },
};

test("replaces the row with the dismissible banner once the release date changed", () => {
  const onDismissAlert = vi.fn();

  const screen = render(
    <SidebarReleaseDateRow
      expectedReleaseDate={new Date("2026-04-20T00:00:00.000Z")}
      alert={releaseDateAlert}
      onDismissAlert={onDismissAlert}
    />,
  );

  expect(screen.getByText("April 20, 2026")).toBeInTheDocument();
  expect(
    screen.getByText("Release Date moved 7 days later"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Release date")).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("Dismiss release date change"));
  expect(onDismissAlert).toHaveBeenCalledExactlyOnceWith(releaseDateAlert.id);
});

test("keeps the plain row when the release date has not changed", () => {
  const screen = render(
    <SidebarReleaseDateRow
      expectedReleaseDate={new Date("2026-04-20T00:00:00.000Z")}
      onDismissAlert={vi.fn()}
    />,
  );

  expect(screen.getByText("Release date")).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Dismiss release date change"),
  ).not.toBeInTheDocument();
});

test("has no accessibility violations with or without the banner", async () => {
  const banner = render(
    <SidebarReleaseDateRow
      expectedReleaseDate={new Date("2026-04-20T00:00:00.000Z")}
      alert={releaseDateAlert}
      onDismissAlert={vi.fn()}
    />,
  );
  expect(await axe(banner.container)).toHaveNoViolations();

  const plain = render(
    <SidebarReleaseDateRow expectedReleaseDate={new Date(2026, 3, 20)} />,
  );
  expect(await axe(plain.container)).toHaveNoViolations();
});
