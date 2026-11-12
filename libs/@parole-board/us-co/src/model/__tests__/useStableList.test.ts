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

import { renderHook } from "@testing-library/react";

import { useStableList } from "../useStableList";

type Item = { id: string };
const sameId = (a: Item, b: Item) => a.id === b.id;

const render = (initial: readonly Item[]) =>
  renderHook(({ items }) => useStableList(items, sameId), {
    initialProps: { items: initial },
  });

describe("useStableList", () => {
  test("keeps the first list while new lists hold equal items", () => {
    const first = [{ id: "a" }, { id: "b" }];
    const { result, rerender } = render(first);

    rerender({ items: [{ id: "a" }, { id: "b" }] });

    expect(result.current).toBe(first);
  });

  test.each([
    ["a changed item", [{ id: "a" }, { id: "c" }]],
    ["a new order", [{ id: "b" }, { id: "a" }]],
    ["a removed item", [{ id: "a" }]],
    ["an added item", [{ id: "a" }, { id: "b" }, { id: "c" }]],
  ])("returns the new list for %s, and keeps it after", (_, next) => {
    const { result, rerender } = render([{ id: "a" }, { id: "b" }]);

    rerender({ items: next });
    expect(result.current).toBe(next);

    rerender({ items: next.map((item) => ({ ...item })) });
    expect(result.current).toBe(next);
  });

  test("compares items by identity without isEqual", () => {
    const a = { id: "a" };
    const first = [a];
    const { result, rerender } = renderHook(
      ({ items }) => useStableList(items),
      { initialProps: { items: first } },
    );

    rerender({ items: [a] });
    expect(result.current).toBe(first);

    const next = [{ id: "a" }];
    rerender({ items: next });
    expect(result.current).toBe(next);
  });
});
