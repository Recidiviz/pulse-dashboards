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

vi.mock("../../assets/search-icon.svg?react", () => ({
  default: () => <svg />,
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

test("trims whitespace and debounces client-name search updates", () => {
  const onSearchChange = vi.fn();

  const screen = render(<SearchBar onSearchChange={onSearchChange} />);

  fireEvent.change(screen.getByPlaceholderText("Search clients by name"), {
    target: { value: "  Jane  " },
  });

  act(() => {
    vi.advanceTimersByTime(299);
  });
  expect(onSearchChange).not.toHaveBeenCalled();

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(onSearchChange).toHaveBeenLastCalledWith("Jane");
});
