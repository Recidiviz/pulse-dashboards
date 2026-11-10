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

import { act, fireEvent, render } from "@testing-library/react";

import { SearchBar } from "../SearchBar";

vi.mock("../../../assets/search-icon.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

test("debounces onSearch callbacks", () => {
  const onSearch = vi.fn();

  const screen = render(<SearchBar onSearch={onSearch} debounceMs={300} />);

  fireEvent.change(screen.getByLabelText("Search…"), {
    target: { value: "Hope" },
  });
  expect(onSearch).not.toHaveBeenCalledWith("Hope");

  act(() => {
    vi.advanceTimersByTime(300);
  });

  expect(onSearch).toHaveBeenLastCalledWith("Hope");
});

test("clears input and fires an empty search after clear", () => {
  const onSearch = vi.fn();

  const screen = render(<SearchBar onSearch={onSearch} debounceMs={100} />);

  fireEvent.change(screen.getByLabelText("Search…"), {
    target: { value: "a" },
  });
  act(() => {
    vi.advanceTimersByTime(100);
  });

  fireEvent.click(screen.getByLabelText("Clear search"));
  act(() => {
    vi.advanceTimersByTime(100);
  });

  expect(onSearch).toHaveBeenLastCalledWith("");
});

test("shows dropdown items only while focused with input", () => {
  const onSelectItem = vi.fn();

  const screen = render(
    <SearchBar
      onSearch={vi.fn()}
      debounceMs={0}
      items={[{ id: "1", name: "Hope Housing" }]}
      onSelectItem={onSelectItem}
    />,
  );

  expect(screen.queryByText("Hope Housing")).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Search…"), {
    target: { value: "H" },
  });
  expect(screen.getByText("Hope Housing")).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByText("Hope Housing"));
  expect(onSelectItem).toHaveBeenCalledWith({
    id: "1",
    name: "Hope Housing",
  });
});
