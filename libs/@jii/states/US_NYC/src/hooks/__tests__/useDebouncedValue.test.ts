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

import { act, renderHook } from "@testing-library/react";

import { useDebouncedValue } from "../useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("returns the initial value immediately", () => {
  const { result } = renderHook(() => useDebouncedValue("a", 300));

  expect(result.current).toBe("a");
});

test("keeps returning the old value until the delay elapses", () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebouncedValue(value, 300),
    { initialProps: { value: "a" } },
  );

  rerender({ value: "ab" });
  act(() => {
    vi.advanceTimersByTime(299);
  });

  expect(result.current).toBe("a");
});

test("updates to the new value once the delay elapses", () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebouncedValue(value, 300),
    { initialProps: { value: "a" } },
  );

  rerender({ value: "ab" });
  act(() => {
    vi.advanceTimersByTime(300);
  });

  expect(result.current).toBe("ab");
});

test("only settles on the last value from a burst of rapid updates", () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebouncedValue(value, 300),
    { initialProps: { value: "a" } },
  );

  rerender({ value: "ab" });
  act(() => {
    vi.advanceTimersByTime(100);
  });
  rerender({ value: "abc" });
  act(() => {
    vi.advanceTimersByTime(300);
  });

  expect(result.current).toBe("abc");
});
