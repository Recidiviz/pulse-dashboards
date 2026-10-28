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

// CalendarGrid.module.css, imported below, must load after the skeleton so
// its rules win at equal specificity.
import "@fullcalendar/react/skeleton.css";

import FullCalendar, {
  type AllowFunc,
  type DayCellInfo,
  type DayHeaderInfo,
  type EventClickInfo,
  type EventDisplayInfo,
  type EventDragStartInfo,
  type EventDropInfo,
  type EventInput,
  type ListDayHeaderInnerInfo,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import { useMemo, useState } from "react";

import styles from "./CalendarGrid.module.css";
import { CALENDAR_VARS, HeaderText, HolidayLabel } from "./CalendarGrid.styles";
import {
  type CalendarWeekday,
  isInMonth,
  monthStartIso,
  toIsoDate,
  weekdayOf,
} from "./dates";
import { DayCellTop } from "./DayCellTop";
import { EntryChip, EntryTarget } from "./EntryChip";
import type {
  CalendarGridEntry,
  CalendarGridProps,
  CalendarHoliday,
  CalendarMonthRef,
} from "./types";

const PLUGINS = [dayGridPlugin, interactionPlugin, listPlugin];

const dayHeaderContent = ({ text }: DayHeaderInfo) => (
  <HeaderText>{text}</HeaderText>
);

const listDayHeaderContent = ({ text }: ListDayHeaderInnerInfo) => (
  <HeaderText>{text}</HeaderText>
);

type HandlerProps = Pick<
  CalendarGridProps,
  "onEntryClick" | "onEntriesDrop" | "allowedWeekdays"
> & {
  month: CalendarMonthRef;
  entries: readonly CalendarGridEntry[];
  selectedIds: ReadonlySet<string>;
};

/** Whether a chip may be dropped on isoDate: inside the month, on an allowed weekday. */
export function canDropOn(
  isoDate: string,
  month: CalendarMonthRef,
  allowedWeekdays?: readonly CalendarWeekday[],
): boolean {
  if (!isInMonth(isoDate, month)) return false;
  return !allowedWeekdays || allowedWeekdays.includes(weekdayOf(isoDate));
}

/**
 * The FullCalendar callbacks CalendarGrid passes down, separate from the
 * component so tests can call them: jsdom can't run a real drag.
 */
export function buildHandlers({
  month,
  entries,
  selectedIds,
  allowedWeekdays,
  onEntryClick,
  onEntriesDrop,
}: HandlerProps) {
  const eventAllow: AllowFunc = (span) =>
    canDropOn(span.startStr, month, allowedWeekdays);

  // FullCalendar moves only the chip under the pointer, and the caller's data
  // decides where entries are, so the chip always goes back and the caller
  // moves every entry the drop covers, in one call.
  const eventDrop = (info: Pick<EventDropInfo, "event" | "revert">) => {
    info.revert();
    const draggedId = info.event.id;
    const toDate = info.event.startStr;
    const ids = selectedIds.has(draggedId)
      ? entries
          .filter((entry) => selectedIds.has(entry.id))
          .filter((entry) => entry.id === draggedId || entry.date !== toDate)
          .map((entry) => entry.id)
      : [draggedId];
    onEntriesDrop?.(ids, toDate);
  };

  // A holiday label is an event too (see CalendarGrid), but not an entry.
  const eventClick = (info: Pick<EventClickInfo, "event">) => {
    if (info.event.extendedProps?.["holiday"]) return;
    onEntryClick?.(info.event.id);
  };

  return { eventAllow, eventDrop, eventClick };
}

/**
 * A month of calendar entries on FullCalendar's day grid, or as a list of the
 * days that have entries. It only displays: the caller passes the entries,
 * the selection and settings, and handles clicks and drops. The month view
 * matches the grid on the Public Calendar screen in the Calendar Unit
 * Dashboard design.
 */
export function CalendarGrid({
  month,
  entries,
  holidays,
  view = "month",
  readOnly = true,
  selectedEntryIds,
  allowedWeekdays,
  timeZone,
  firstDay,
  ariaLabel,
  onEntryClick,
  onEntriesDrop,
  renderEntry,
  renderHolidayLabel,
}: CalendarGridProps) {
  // The dragged chip's date and whether it's selected, or null when nothing
  // is dragged.
  const [drag, setDrag] = useState<{
    from: string;
    selected: boolean;
  } | null>(null);

  const selectedIds = useMemo(
    () => new Set(selectedEntryIds ?? []),
    [selectedEntryIds],
  );

  // The design puts a day's holiday label below its chips. FullCalendar starts
  // every cell's chips at the same height across a week, so a label in the
  // cell top would push the whole week's chips down. Instead each holiday is
  // a fixed event ordered after the day's entries. The list view leaves them
  // out, since it lists only days with entries.
  const events = useMemo<EventInput[]>(
    () => [
      ...entries.map((entry, order) => ({
        id: entry.id,
        title: entry.label,
        start: entry.date,
        allDay: true,
        extendedProps: { entry, order },
      })),
      ...(view === "month" ? holidays ?? [] : []).map((holiday) => ({
        id: `holiday:${holiday.date}`,
        title: holiday.name,
        start: holiday.date,
        allDay: true,
        editable: false,
        extendedProps: { holiday, order: entries.length },
      })),
    ],
    [entries, holidays, view],
  );

  const handlers = buildHandlers({
    month,
    entries,
    selectedIds,
    allowedWeekdays,
    onEntryClick,
    onEntriesDrop,
  });

  // While a chip is dragged, every day it can move to gets a dashed outline,
  // as in the design: not the chip's own day, not days outside the month and
  // not weekdays the calendar doesn't allow. The chip's own day stays bare
  // for a selection drag too, since FullCalendar reports no drop there.
  const dayCellClass = ({ date, dow }: DayCellInfo) => {
    const iso = toIsoDate(date, timeZone);
    return [
      styles["day"],
      (dow === 0 || dow === 6 || !isInMonth(iso, month)) && styles["dayMuted"],
      drag &&
        iso !== drag.from &&
        canDropOn(iso, month, allowedWeekdays) &&
        styles["dropTarget"],
    ]
      .filter(Boolean)
      .join(" ");
  };

  const dayCellTopContent = ({ date, dow, dayNumberText }: DayCellInfo) => {
    const iso = toIsoDate(date, timeZone);
    if (!isInMonth(iso, month)) return null;
    return (
      <DayCellTop
        dayNumberText={dayNumberText}
        isWeekend={dow === 0 || dow === 6}
      />
    );
  };

  // isDraggable comes from FullCalendar, so the class follows its editable
  // setting rather than restating readOnly. The dragged chip fades, and so
  // does every selected chip when the dragged one is selected, since the drop
  // moves them all. The chip under the pointer doesn't.
  const eventClass = ({
    event,
    isDraggable,
    isDragging: isSourceDragging,
    isMirror,
  }: EventDisplayInfo) => {
    if (event.extendedProps["holiday"]) return undefined;
    const faded =
      !isMirror &&
      (isSourceDragging || (drag?.selected && selectedIds.has(event.id)));
    return [
      styles["entry"],
      isDraggable && styles["entryEditable"],
      faded && styles["entryFaded"],
    ]
      .filter(Boolean)
      .join(" ");
  };

  const eventContent = ({ event }: EventDisplayInfo) => {
    const holiday = event.extendedProps["holiday"] as
      | CalendarHoliday
      | undefined;
    if (holiday) {
      return (
        <HolidayLabel>
          {renderHolidayLabel ? renderHolidayLabel(holiday) : holiday.name}
        </HolidayLabel>
      );
    }
    const entry = event.extendedProps["entry"] as CalendarGridEntry;
    return (
      <EntryTarget
        entry={entry}
        selected={selectedIds.has(entry.id)}
        onToggle={onEntryClick}
      >
        {renderEntry ? renderEntry(entry) : <EntryChip entry={entry} />}
      </EntryTarget>
    );
  };

  const onDragStart = ({ event }: Pick<EventDragStartInfo, "event">) =>
    setDrag({ from: event.startStr, selected: selectedIds.has(event.id) });

  return (
    <div
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
      style={CALENDAR_VARS}
    >
      <FullCalendar
        // Remount on a new month or view rather than driving the calendar's
        // API through a ref.
        key={`${month.year}-${month.month}-${view}`}
        plugins={PLUGINS}
        initialView={view === "list" ? "listMonth" : "dayGridMonth"}
        initialDate={monthStartIso(month)}
        firstDay={firstDay}
        timeZone={timeZone}
        height="auto"
        // FullCalendar sizes each week row from the grid's width (width /
        // aspectRatio / 6), which at the design's 1384px width makes rows
        // 171px tall instead of the design's 119px minimum. A very wide ratio
        // keeps that guess under the minimum, so rows follow their content.
        aspectRatio={100}
        fixedWeekCount={false}
        showNonCurrentDates={false}
        // Rows grow to show every entry; both are set so a later default
        // can't bring back "+N more".
        dayMaxEvents={false}
        dayMaxEventRows={false}
        events={events}
        // The caller's order (kind, then resource) wins over FullCalendar's
        // default, which sorts by title.
        eventOrder="order"
        eventOrderStrict
        // EntryTarget makes each chip a toggle button with aria-pressed,
        // which FullCalendar's own interactive events don't expose.
        eventInteractive={false}
        editable={!readOnly}
        eventDurationEditable={false}
        eventAllow={handlers.eventAllow}
        eventDrop={handlers.eventDrop}
        eventDragStart={onDragStart}
        eventDragStop={() => setDrag(null)}
        eventClick={handlers.eventClick}
        viewClass={view === "month" && styles["monthView"]}
        dayHeaderClass={styles["header"]}
        dayHeaderInnerClass={styles["headerInner"]}
        dayHeaderContent={dayHeaderContent}
        dayCellClass={dayCellClass}
        dayCellTopClass={styles["dayTop"]}
        dayCellInnerClass={styles["dayInner"]}
        dayCellBottomClass={styles["dayBottom"]}
        dayCellTopContent={dayCellTopContent}
        eventClass={eventClass}
        eventContent={eventContent}
        listDayHeaderClass={styles["listDayHeader"]}
        listDayHeaderContent={listDayHeaderContent}
      />
    </div>
  );
}
