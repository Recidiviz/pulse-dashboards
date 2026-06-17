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
import userEvent from "@testing-library/user-event";

import { TaskSectionFilter } from "../TaskSectionFilter";

function getToggle(label: string): HTMLElement {
  return screen.getByRole("button", { name: `Filter: ${label}` });
}

describe("TaskSectionFilter", () => {
  test("the menu item is disabled until the toggle is clicked, then enabled", async () => {
    const user = userEvent.setup();
    render(
      <TaskSectionFilter
        label="Show Hidden"
        checked={false}
        onChange={vi.fn()}
      />,
    );

    // The Dropdown keeps the menu mounted but hidden via CSS; its item is
    // `disabled` (and so non-interactive) while the dropdown is closed.
    expect(
      screen.getByRole("menuitem", { name: /Show Hidden/ }),
    ).toBeDisabled();

    await user.click(getToggle("Show Hidden"));

    expect(screen.getByRole("menuitem", { name: /Show Hidden/ })).toBeEnabled();
  });

  test("clicking the item calls onChange with !checked (false -> true)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TaskSectionFilter
        label="Show Hidden"
        checked={false}
        onChange={onChange}
      />,
    );

    await user.click(getToggle("Show Hidden"));
    await user.click(screen.getByRole("menuitem", { name: /Show Hidden/ }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test("clicking the item calls onChange with !checked (true -> false)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TaskSectionFilter label="Show Completed" checked onChange={onChange} />,
    );

    await user.click(getToggle("Show Completed"));
    await user.click(screen.getByRole("menuitem", { name: /Show Completed/ }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  test("the menu stays open after toggling (preventCloseOnClickEvent)", async () => {
    const user = userEvent.setup();
    render(
      <TaskSectionFilter
        label="Show Hidden"
        checked={false}
        onChange={vi.fn()}
      />,
    );

    await user.click(getToggle("Show Hidden"));
    const item = screen.getByRole("menuitem", { name: /Show Hidden/ });
    await user.click(item);

    expect(
      screen.getByRole("menuitem", { name: /Show Hidden/ }),
    ).toBeInTheDocument();
  });

  test("renders the check indicator only when checked", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TaskSectionFilter
        label="Show Hidden"
        checked={false}
        onChange={vi.fn()}
      />,
    );

    await user.click(getToggle("Show Hidden"));
    const itemWhenUnchecked = screen.getByRole("menuitem", {
      name: /Show Hidden/,
    });
    expect(itemWhenUnchecked.querySelector("svg")).not.toBeInTheDocument();

    rerender(
      <TaskSectionFilter label="Show Hidden" checked onChange={vi.fn()} />,
    );

    const itemWhenChecked = screen.getByRole("menuitem", {
      name: /Show Hidden/,
    });
    expect(itemWhenChecked.querySelector("svg")).toBeInTheDocument();
  });

  test("forwards testId onto the menu item (as a className hook)", async () => {
    render(
      <TaskSectionFilter
        label="Show Hidden"
        checked={false}
        onChange={vi.fn()}
        testId="show-hidden-filter"
      />,
    );

    const item = screen.getByRole("menuitem", { name: /Show Hidden/ });
    expect(item).toHaveClass("show-hidden-filter");
  });
});
