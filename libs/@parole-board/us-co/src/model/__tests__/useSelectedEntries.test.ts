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

import { useSelectedEntries } from "../useSelectedEntries";

const FCF = "2026-09-14:HEARING:FCF";
const DENCOM = "2026-09-14:HEARING:DENCOM WTM BDY";
const CCF = "2026-09-15:HEARING:CCF";
const SEPTEMBER_IDS = [FCF, DENCOM, CCF];
const OCTOBER_IDS = ["2026-10-05:HEARING:FCF"];

function renderSelection(monthKey = "2026-09", presentIds = SEPTEMBER_IDS) {
  return renderHook(
    ({ monthKey: key, presentIds: ids }) => useSelectedEntries(key, ids),
    { initialProps: { monthKey, presentIds } },
  );
}

describe("useSelectedEntries", () => {
  it("starts with nothing selected", () => {
    const { result } = renderSelection();

    expect(result.current.selectedIds).toEqual([]);
  });

  it("adds an id on the first toggle and removes it on the second", () => {
    const { result } = renderSelection();

    act(() => result.current.toggle(FCF));
    expect(result.current.selectedIds).toEqual([FCF]);

    act(() => result.current.toggle(FCF));
    expect(result.current.selectedIds).toEqual([]);
  });

  it("selects entries on the same day and across days, in click order", () => {
    const { result } = renderSelection();

    act(() => result.current.toggle(CCF));
    act(() => result.current.toggle(FCF));
    act(() => result.current.toggle(DENCOM));
    expect(result.current.selectedIds).toEqual([CCF, FCF, DENCOM]);

    act(() => result.current.toggle(FCF));
    expect(result.current.selectedIds).toEqual([CCF, DENCOM]);
  });

  it("ignores an id that isn't among the month's entries", () => {
    const { result } = renderSelection();

    act(() => result.current.toggle("2026-10-05:HEARING:FCF"));

    expect(result.current.selectedIds).toEqual([]);
  });

  it("clears the selection", () => {
    const { result } = renderSelection();
    act(() => result.current.toggle(FCF));
    act(() => result.current.toggle(CCF));

    act(() => result.current.clear());

    expect(result.current.selectedIds).toEqual([]);
  });

  it("clears the selection when the month changes, and doesn't bring it back", () => {
    const { result, rerender } = renderSelection();
    act(() => result.current.toggle(FCF));
    act(() => result.current.toggle(CCF));

    rerender({ monthKey: "2026-10", presentIds: OCTOBER_IDS });
    expect(result.current.selectedIds).toEqual([]);

    rerender({ monthKey: "2026-09", presentIds: SEPTEMBER_IDS });
    expect(result.current.selectedIds).toEqual([]);
  });

  it("drops a selected id that a refetch removes, for good", () => {
    const { result, rerender } = renderSelection();
    act(() => result.current.toggle(FCF));
    act(() => result.current.toggle(CCF));

    rerender({ monthKey: "2026-09", presentIds: [FCF, DENCOM] });
    expect(result.current.selectedIds).toEqual([FCF]);

    rerender({ monthKey: "2026-09", presentIds: SEPTEMBER_IDS });
    expect(result.current.selectedIds).toEqual([FCF]);
  });

  it("keeps the same selection array when a refetch drops nothing", () => {
    const { result, rerender } = renderSelection();
    act(() => result.current.toggle(FCF));
    const before = result.current.selectedIds;

    rerender({ monthKey: "2026-09", presentIds: [...SEPTEMBER_IDS] });

    expect(result.current.selectedIds).toBe(before);
  });

  it("makes one entry the whole selection with selectOnly", () => {
    const { result } = renderSelection();
    act(() => result.current.toggle(FCF));
    act(() => result.current.toggle(CCF));

    act(() => result.current.selectOnly(DENCOM));

    expect(result.current.selectedIds).toEqual([DENCOM]);
  });

  it("keeps a just-added entry that selectOnly chose before the refetch brought it", () => {
    const added = "2026-09-16:HEARING:FCF";
    const { result, rerender } = renderSelection();

    act(() => result.current.selectOnly(added));
    rerender({ monthKey: "2026-09", presentIds: [...SEPTEMBER_IDS, added] });

    expect(result.current.selectedIds).toEqual([added]);
  });

  it("drops an id selectOnly chose once a refetch doesn't have it", () => {
    const { result, rerender } = renderSelection();

    act(() => result.current.selectOnly("2026-09-16:HEARING:GONE"));
    rerender({ monthKey: "2026-09", presentIds: [...SEPTEMBER_IDS] });

    expect(result.current.selectedIds).toEqual([]);
  });

  it("keeps toggle, selectOnly and clear stable across renders", () => {
    const { result, rerender } = renderSelection();
    const { toggle, selectOnly, clear } = result.current;

    act(() => result.current.toggle(FCF));
    rerender({ monthKey: "2026-10", presentIds: OCTOBER_IDS });

    expect(result.current.toggle).toBe(toggle);
    expect(result.current.selectOnly).toBe(selectOnly);
    expect(result.current.clear).toBe(clear);
  });
});
