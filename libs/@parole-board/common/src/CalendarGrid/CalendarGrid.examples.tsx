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
import { action } from "storybook/actions";
import styled from "styled-components";

import { september2026 } from "~@parole-board/common/fixtures";

import { semantics } from "../theme";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarGridSkeleton } from "./CalendarGridSkeleton";
import type { CalendarWeekday } from "./dates";
import type { CalendarGridProps } from "./types";

// The grid is 1384px wide, as in the Calendar Unit Dashboard design at a 1440px
// viewport, so screenshots compare with the design at the same size.
const Frame = styled.div`
  width: 1416px;
  padding: ${rem(semantics.space.md)};
`;

const NarrowFrame = styled.div`
  width: 360px;
  padding: ${rem(semantics.space.md)};
`;

const base: CalendarGridProps = {
  month: september2026.month,
  entries: september2026.entries,
  holidays: september2026.holidays,
  timeZone: september2026.timeZone,
  firstDay: september2026.firstDay,
  ariaLabel: "September 2026 calendar",
};

const WEEKDAYS: CalendarWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

/**
 * Keeps the selected entry ids in state, as the admin page does: a click
 * toggles one, and a drop moves the dropped entries to the day.
 */
function Selectable({
  initialSelected = [],
  ...props
}: Partial<CalendarGridProps> & { initialSelected?: string[] }) {
  const [selected, setSelected] = useState(initialSelected);
  const [entries, setEntries] = useState(props.entries ?? base.entries);
  return (
    <CalendarGrid
      {...base}
      {...props}
      entries={entries}
      selectedEntryIds={selected}
      onEntryClick={(id) => {
        action("onEntryClick")(id);
        setSelected((cur) =>
          cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        );
      }}
      onEntriesDrop={(ids, date) => {
        action("onEntriesDrop")(ids, date);
        setEntries((cur) =>
          cur.map((e) => (ids.includes(e.id) ? { ...e, date } : e)),
        );
        setSelected([]);
      }}
    />
  );
}

export default {};

export const DraftSeptember2026 = () => (
  <Frame>
    <Selectable />
  </Frame>
);

export const ReadOnly = () => (
  <Frame>
    <CalendarGrid {...base} />
  </Frame>
);

// One hearing selected: its chip has the dark outline.
export const OneSelected = () => (
  <Frame>
    <Selectable initialSelected={["2026-09-14:HEARING:FCF"]} />
  </Frame>
);

// Three hearings on two days, as in the design's multi-select.
export const MultiSelected = () => (
  <Frame>
    <Selectable
      initialSelected={[
        "2026-09-15:HEARING:CCF",
        "2026-09-15:HEARING:SCF",
        "2026-09-17:HEARING:AVCF",
      ]}
    />
  </Frame>
);

// Drag a selected chip to move all three to that day, or an unselected one to
// move only it. Weekends refuse the drop, as the US_CO calendar allows
// Monday to Friday.
export const Editable = () => (
  <Frame>
    <Selectable
      readOnly={false}
      allowedWeekdays={WEEKDAYS}
      initialSelected={[
        "2026-09-15:HEARING:CCF",
        "2026-09-15:HEARING:SCF",
        "2026-09-17:HEARING:AVCF",
      ]}
    />
  </Frame>
);

export const CancelledMeeting = () => (
  <Frame>
    <Selectable entries={september2026.entriesWithCancelledMeeting} />
  </Frame>
);

export const HolidayFlag = () => (
  <Frame>
    <Selectable
      entries={[
        ...september2026.entries,
        {
          id: "2026-09-07:HEARING:FCF",
          date: "2026-09-07",
          label: "FCF",
          kind: "HEARING",
          cancelled: false,
          flag: "Labor Day",
        },
      ]}
    />
  </Frame>
);

export const CrowdedDay = () => (
  <Frame>
    <Selectable initialSelected={["2026-09-24:HEARING:Hilltop"]} />
  </Frame>
);

export const ListView = () => (
  <NarrowFrame>
    <Selectable view="list" />
  </NarrowFrame>
);

export const EmptyMonth = () => (
  <Frame>
    <Selectable entries={[]} holidays={[]} />
  </Frame>
);

// What the month view's SuspenseBoundary shows while a month loads.
export const Loading = () => (
  <Frame>
    <CalendarGridSkeleton firstDay={september2026.firstDay} />
  </Frame>
);

export const LoadingList = () => (
  <NarrowFrame>
    <CalendarGridSkeleton view="list" />
  </NarrowFrame>
);
