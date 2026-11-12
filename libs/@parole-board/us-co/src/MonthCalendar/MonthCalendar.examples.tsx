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

import { rem } from "polished";
import { useState } from "react";
import { injectable, withDi } from "react-magnetic-di";
import styled from "styled-components";

import type { EntryDto, MonthDetail } from "~@parole-board/common";
import { semantics, useCalendarConfig } from "~@parole-board/common";
import {
  queryResult,
  september2026Config,
  september2026MonthDetail,
  september2026MonthDetailWithHolidayHearings,
} from "~@parole-board/common/fixtures";

import { MonthCalendar } from "./MonthCalendar";
import { useIsNarrowViewport } from "./useIsNarrowViewport";

// 1384px of grid, as in the design at a 1440px viewport, on the design's
// grey band.
const Frame = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  padding: ${rem(semantics.space.md)};
  background: ${semantics.surface.muted};
`;

const useConfigDi = injectable(useCalendarConfig, () =>
  queryResult(september2026Config),
);

/** Toggles the selection on click, as the admin page does. */
function SelectableMonth({
  initial,
  width = 1416,
  detail = september2026MonthDetail,
  entries = detail.entries,
}: {
  initial: readonly string[];
  width?: number;
  detail?: MonthDetail;
  entries?: readonly EntryDto[];
}) {
  const [selected, setSelected] = useState(initial);
  const toggle = (id: string) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  return (
    <Frame $width={width}>
      <MonthCalendar
        month={detail}
        entries={entries}
        holidays={detail.holidays}
        selectedEntryIds={selected}
        onEntryClick={toggle}
      />
    </Frame>
  );
}

const InjectedMonth = withDi(SelectableMonth, [useConfigDi]);
const InjectedNarrowMonth = withDi(SelectableMonth, [
  useConfigDi,
  injectable(useIsNarrowViewport, () => true),
]);

export default { parameters: { layout: "fullscreen" } };

// Each story renders its withDi component rather than exporting it, because
// Storybook reads the object withDi returns as a story object.

/** The September 2026 draft with nothing selected. Hover a chip for its full name. */
export const September2026 = () => <InjectedMonth initial={[]} />;

/** FCF on the 14th selected, as in the design. */
export const OneSelected = () => (
  <InjectedMonth initial={["2026-09-14:HEARING:FCF"]} />
);

/** Three hearings on two days selected. */
export const MultiSelected = () => (
  <InjectedMonth
    initial={[
      "2026-09-14:HEARING:FCF",
      "2026-09-15:HEARING:CCF",
      "2026-09-15:HEARING:SCF",
    ]}
  />
);

/**
 * FCF and CTCF added by hand on Labor Day: the chips have no Holiday badge,
 * and the day keeps its "Labor Day" label below them.
 */
export const HolidayWithEntries = () => (
  <InjectedMonth
    initial={[]}
    detail={september2026MonthDetailWithHolidayHearings}
  />
);

/** The list view that viewports under 768px get, with FCF selected. */
export const NarrowViewport = () => (
  <InjectedNarrowMonth initial={["2026-09-14:HEARING:FCF"]} width={390} />
);

/**
 * The Full Board on the 11th cancelled: a red, semibold chip with
 * "Cancelled" in plain red text above its label.
 */
export const CancelledMeeting = () => (
  <InjectedMonth
    initial={[]}
    entries={september2026MonthDetail.entries.map((entry) =>
      entry.id === "2026-09-11:FULL_BOARD:Full Board"
        ? { ...entry, cancelled: true }
        : entry,
    )}
  />
);
