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

import { AddedTaskKebab } from "../AddedTaskKebab";

function findKebabButton(): HTMLElement {
  const button = document
    .querySelector(".AddedTaskKebabButton")
    ?.closest("button");
  if (!button) throw new Error("kebab button not found");
  return button as HTMLElement;
}

describe("AddedTaskKebab", () => {
  test("renders Edit task and Delete task items", () => {
    render(<AddedTaskKebab onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);
    fireEvent.click(findKebabButton());
    expect(screen.getByText("Edit task")).toBeInTheDocument();
    expect(screen.getByText("Delete task")).toBeInTheDocument();
  });

  test("clicking Edit task calls onEditClick and not onDeleteClick", () => {
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();
    render(
      <AddedTaskKebab
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />,
    );
    fireEvent.click(findKebabButton());
    fireEvent.click(screen.getByText("Edit task"));
    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(onDeleteClick).not.toHaveBeenCalled();
  });

  test("clicking Delete task calls onDeleteClick and not onEditClick", () => {
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();
    render(
      <AddedTaskKebab
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />,
    );
    fireEvent.click(findKebabButton());
    fireEvent.click(screen.getByText("Delete task"));
    expect(onDeleteClick).toHaveBeenCalledTimes(1);
    expect(onEditClick).not.toHaveBeenCalled();
  });

  test("hides Edit task item when onEditClick is omitted", () => {
    render(<AddedTaskKebab onDeleteClick={vi.fn()} />);
    fireEvent.click(findKebabButton());
    expect(screen.queryByText("Edit task")).not.toBeInTheDocument();
    expect(screen.getByText("Delete task")).toBeInTheDocument();
  });
});
