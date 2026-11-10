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

import type { PaginationProps } from "../../../hooks/usePagination";
import { Pagination } from "../Pagination";

vi.mock("../../assets/chevron-left.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/chevron-right.svg?react", () => ({
  default: () => <svg />,
}));

function setup(props: PaginationProps) {
  const user = userEvent.setup();
  render(<Pagination {...props} />);
  return { user };
}

describe("Pagination", () => {
  it("shows 0-0 of 0 when there are no results", () => {
    const onNextPage = vi.fn();
    const onPreviousPage = vi.fn();

    setup({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 0,
      canNextPage: false,
      canPreviousPage: false,
      onNextPage,
      onPreviousPage,
    });

    expect(screen.getByText("Showing 0-0 of 0")).toBeInTheDocument();
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("shows correct range text for pageIndex/pageSize", async () => {
    const onNextPage = vi.fn();
    const onPreviousPage = vi.fn();

    const { user } = setup({
      pageIndex: 1,
      pageSize: 10,
      totalCount: 23,
      canNextPage: true,
      canPreviousPage: true,
      onNextPage,
      onPreviousPage,
    });

    expect(screen.getByText("Showing 11-20 of 23")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(onPreviousPage).toHaveBeenCalledTimes(1);
    expect(onNextPage).toHaveBeenCalledTimes(1);
  });
});
