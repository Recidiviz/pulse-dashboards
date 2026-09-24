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
import { describe, expect, test, vi } from "vitest";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  test("renders nothing when there is only one page", () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when there are no pages", () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={0} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("shows the current page and total pages, 1-indexed", () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });

  test("disables the first and previous buttons on the first page", () => {
    render(
      <Pagination currentPage={0} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("First page")).toBeDisabled();
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeEnabled();
    expect(screen.getByLabelText("Last page")).toBeEnabled();
  });

  test("disables the next and last buttons on the last page", () => {
    render(
      <Pagination currentPage={2} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("First page")).toBeEnabled();
    expect(screen.getByLabelText("Previous page")).toBeEnabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
    expect(screen.getByLabelText("Last page")).toBeDisabled();
  });

  test("enables all buttons on a middle page", () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("First page")).toBeEnabled();
    expect(screen.getByLabelText("Previous page")).toBeEnabled();
    expect(screen.getByLabelText("Next page")).toBeEnabled();
    expect(screen.getByLabelText("Last page")).toBeEnabled();
  });

  test("calls onPageChange with 0 when the first-page button is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );
    await user.click(screen.getByLabelText("First page"));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  test("calls onPageChange with the previous page index when clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );
    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("calls onPageChange with the next page index when clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );
    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("calls onPageChange with the last page index when clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );
    await user.click(screen.getByLabelText("Last page"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  test("does not call onPageChange when clicking a disabled button", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={0} totalPages={3} onPageChange={onPageChange} />,
    );
    await user.click(screen.getByLabelText("First page"));
    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
