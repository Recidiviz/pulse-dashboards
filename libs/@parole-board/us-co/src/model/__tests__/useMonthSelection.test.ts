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

import type { MonthDetail } from "~@parole-board/common";
import { september2026MonthDetail } from "~@parole-board/common/fixtures";

import { useMonthSelection } from "../useMonthSelection";

const SEPTEMBER = { year: 2026, month: 9 };
const FCF = "2026-09-14:HEARING:FCF";
const CCF = "2026-09-15:HEARING:CCF";

function renderSelection(
  initial: { month: MonthDetail | null; editable: boolean } = {
    month: september2026MonthDetail,
    editable: true,
  },
) {
  return renderHook(
    ({ month, editable }) => useMonthSelection(SEPTEMBER, month, editable),
    { initialProps: initial },
  );
}

describe("useMonthSelection", () => {
  test("gives the selected entries in the order they were selected", () => {
    const { result } = renderSelection();

    act(() => result.current.toggle(CCF));
    act(() => result.current.toggle(FCF));

    expect(result.current.selectedIds).toEqual([CCF, FCF]);
    expect(result.current.selected.map(({ label }) => label)).toEqual([
      "CCF",
      "FCF",
    ]);
  });

  test("clear empties the selection", () => {
    const { result } = renderSelection();
    act(() => result.current.toggle(FCF));

    act(() => result.current.clear());

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selected).toEqual([]);
  });

  test("selectOnly makes one entry the whole selection", () => {
    const { result } = renderSelection();
    act(() => result.current.toggle(FCF));
    act(() => result.current.toggle(CCF));

    act(() => result.current.selectOnly(FCF));

    expect(result.current.selectedIds).toEqual([FCF]);
    expect(result.current.selected.map(({ label }) => label)).toEqual(["FCF"]);
  });

  test("selects nothing in a month that isn't editable", () => {
    const { result } = renderSelection({
      month: september2026MonthDetail,
      editable: false,
    });

    act(() => result.current.toggle(FCF));

    expect(result.current.selectedIds).toEqual([]);
  });

  test("clears the selection when the month becomes read-only or goes away", () => {
    const { result, rerender } = renderSelection();
    act(() => result.current.toggle(FCF));

    rerender({ month: september2026MonthDetail, editable: false });
    expect(result.current.selectedIds).toEqual([]);

    rerender({ month: september2026MonthDetail, editable: true });
    act(() => result.current.toggle(FCF));
    rerender({ month: null, editable: false });
    expect(result.current.selected).toEqual([]);
  });
});
