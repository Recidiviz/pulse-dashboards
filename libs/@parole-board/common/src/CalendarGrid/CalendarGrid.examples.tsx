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

const SAVING_IDS = new Set([
  "2026-09-15:HEARING:CCF",
  "2026-09-15:HEARING:SCF",
]);

// CCF and SCF dragged from the 15th to the 21st while the move saves: both
// chips show on the 21st with the moving band, a still dashed line with
// reduced motion, and chips on both days ignore clicks.
export const MovePending = () => (
  <Frame>
    <CalendarGrid
      {...base}
      entries={september2026.entries.map((e) =>
        SAVING_IDS.has(e.id) ? { ...e, date: "2026-09-21" } : e,
      )}
      busyEntryIds={SAVING_IDS}
      busyDates={new Set(["2026-09-15", "2026-09-21"])}
      onEntryClick={action("onEntryClick")}
    />
  </Frame>
);

export const CancelledMeeting = () => (
  <Frame>
    <Selectable entries={september2026.entriesWithCancelledMeeting} />
  </Frame>
);

// The Business Meeting under its kind's short label, "Business Mtg", as the
// calendar data carries it.
const shortLabelEntries = september2026.entriesWithCancelledMeeting.map((e) =>
  e.kind === "BUSINESS_MEETING" ? { ...e, label: "Business Mtg" } : e,
);

/**
 * The chip options the public site uses: "Business Mtg" spelled out as
 * "Business Meeting" through formatLabel, and "Cancelled" as plain text
 * rather than a badge.
 */
export const PublicChips = () => (
  <Frame>
    <CalendarGrid
      {...base}
      entries={shortLabelEntries}
      formatLabel={(entry) =>
        entry.kind === "BUSINESS_MEETING" ? "Business Meeting" : entry.label
      }
      cancelledTag="text"
    />
  </Frame>
);

// FCF and CTCF on Labor Day, as if an editor added them by hand. The chips
// have no Holiday badge, and "Labor Day" sits below them.
export const HolidayWithEntries = () => (
  <Frame>
    <Selectable entries={september2026.entriesWithHolidayHearings} />
  </Frame>
);

// October 2026 with the longest Colorado holiday name. It fits on one line
// at this width and wraps within its cell when the cell is narrower, as in
// the design's generated October draft.
export const LongHolidayName = () => (
  <Frame>
    <CalendarGrid
      {...base}
      month={{ year: 2026, month: 10 }}
      entries={[]}
      holidays={[{ date: "2026-10-05", name: "Frances Xavier Cabrini Day" }]}
      ariaLabel="October 2026 calendar"
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

// The september2026 entries per day, so the skeletons draw the month the
// examples above show.
const septemberEntriesPerDay = new Map<string, number>();
for (const { date } of september2026.entries) {
  septemberEntriesPerDay.set(date, (septemberEntriesPerDay.get(date) ?? 0) + 1);
}
const septemberChipsOn = (isoDate: string) =>
  septemberEntriesPerDay.get(isoDate) ?? 0;

// What the month view's SuspenseBoundary shows while September 2026 loads.
export const Loading = () => (
  <Frame>
    <CalendarGridSkeleton
      month={september2026.month}
      firstDay={september2026.firstDay}
      chipsOn={septemberChipsOn}
    />
  </Frame>
);

export const LoadingList = () => (
  <NarrowFrame>
    <CalendarGridSkeleton
      view="list"
      month={september2026.month}
      chipsOn={septemberChipsOn}
    />
  </NarrowFrame>
);
