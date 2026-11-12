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
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import type {
  MonthDetail,
  MonthStatus,
  YearMonthOption,
} from "~@parole-board/common";
import {
  semantics,
  useCalendarConfig,
  useMonth,
  useParoleBoardHost,
} from "~@parole-board/common";
import {
  MonthSectionSkeleton,
  SuspenseBoundary,
} from "~@parole-board/common/loading";
import { Button, Icon } from "~design-system";

import { ActionBar } from "./ActionBar/ActionBar";
import { AddHearingModal } from "./AddHearingModal/AddHearingModal";
import { VisuallyHidden } from "./AddHearingModal/AddHearingModal.styles";
import {
  AddMonthModal,
  readCreateNotices,
} from "./AddMonthModal/AddMonthModal";
import { CreateNotices } from "./AddMonthModal/CreateNotices";
import { CountsBar } from "./CountsBar/CountsBar";
import { EmptyMonth } from "./EmptyMonth/EmptyMonth";
import { CancelToggle } from "./EntryActions/CancelToggle";
import { EntryActions } from "./EntryActions/EntryActions";
import { useEntryDelete } from "./EntryActions/useEntryDelete";
import { useToggleCancel } from "./EntryActions/useToggleCancel";
import { MONTH_LOAD_ERROR_TITLE, renderCalendarError } from "./loadErrors";
import { canEditMonth, formatMonthYear, toYearMonthParam } from "./model/month";
import { useCurrentYearMonth } from "./model/useCurrentYearMonth";
import type { MonthSelection } from "./model/useMonthSelection";
import { useMonthSelection } from "./model/useMonthSelection";
import { useMonthSkeleton } from "./model/useMonthSkeleton";
import { useMonthWithoutSuspense } from "./model/useMonthWithoutSuspense";
import { useMoveEntryFlow } from "./model/useMoveEntryFlow";
import { useNeighborMonths } from "./model/useNeighborMonths";
import { MonthCalendar } from "./MonthCalendar/MonthCalendar";
import { NARROW_VIEWPORT_QUERY } from "./MonthCalendar/useIsNarrowViewport";
import { MonthActions } from "./MonthHeader/MonthActions";
import { MonthHeader } from "./MonthHeader/MonthHeader";
import { Mirrored } from "./MonthHeader/MonthHeader.styles";
import { MonthLink, MonthNav } from "./MonthHeader/MonthNav";
import { MonthPicker } from "./MonthHeader/MonthPicker";
import { MonthStatusBanner } from "./MonthStatusBanner/MonthStatusBanner";
import { focusMovedChip } from "./MoveEntryModal/focusMovedChip";
import { MoveEntryModal } from "./MoveEntryModal/MoveEntryModal";
import { useMoveToDialog } from "./MoveEntryModal/useMoveToDialog";
import { MoveToButton } from "./MoveToButton/MoveToButton";

const { size, space, surface } = semantics;

// The page and its body grow to the host's height, as AdminPageSkeleton's
// do, so swapping the skeleton for the page keeps the same background.
const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: ${surface.page};
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${rem(space.md)};
  padding: ${rem(space.lg)};
`;

// The design's grey band below the header holds the counts row and the grid,
// padded as MonthSectionSkeleton is.
const MonthSection = styled.div`
  flex: 1;
  padding: ${rem(space.lg)} ${rem(space.lg)} ${rem(space.xl)};
  background: ${surface.muted};
`;

// Notices, such as the ones Add month leaves, sit above the counts row with
// the row's gap below them, and take no space when there are none.
const Notices = styled.div`
  &:not(:empty) {
    margin-bottom: ${rem(space.md)};
  }
`;

// The counts on the left and the action bar at the right end, as in the
// design. The row keeps a control's height whether or not anything is
// selected, and stays on one line above the narrow breakpoint, so selecting
// or clearing an entry never moves the grid.
const CountsRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(space.md)};
  min-height: ${size.control};
  margin-bottom: ${rem(space.md)};

  @media ${NARROW_VIEWPORT_QUERY} {
    flex-wrap: wrap;
  }
`;

/**
 * A stored month's counts, action bar and grid, sharing the selection
 * MonthContent holds. A month editors can't change, a past or PUBLISHED one,
 * is read-only: its chips can't be selected and it has no action bar.
 *
 * In a month editors may change, entries move by drag or with "Move to…" in
 * the action bar, for one selected entry or several. Dragging stops while a
 * move runs, so a second drag can't send an entry's old version. A dragged
 * entry shows on its new day while the move saves, marked as busy, and a
 * status message tells screen readers. The counts change when the server
 * answers.
 *
 * With exactly one entry selected in a month editors may change, the action
 * bar also holds that entry's other actions: "Cancel" or "Undo" for a
 * meeting whose kind is cancellable, and "Delete hearing" for one whose kind
 * is deletable. After a delete the selection clears and the action bar goes
 * away, so focus moves to the month's title.
 */
function MonthBody({
  month,
  editable,
  selection,
  titleRef,
  notices,
}: {
  month: MonthDetail;
  /** Whether editors may change the month (canEditMonth). */
  editable: boolean;
  selection: MonthSelection;
  titleRef: RefObject<HTMLHeadingElement | null>;
  /** Shown above the counts, such as the ones Add month leaves. */
  notices?: ReactNode;
}) {
  const { selected, clear } = selection;
  const { data: config } = useCalendarConfig();
  const sectionRef = useRef<HTMLDivElement>(null);
  const single = editable && selected.length === 1 ? selected[0] : null;
  const deleteProps = useEntryDelete({
    month,
    selected: single,
    clearSelection: clear,
    focusTitle: () => titleRef.current?.focus(),
  });
  const cancelProps = useToggleCancel(single, () => {
    clear();
    titleRef.current?.focus();
  });
  const flow = useMoveEntryFlow({ month, clearSelection: clear });
  const moveTo = useMoveToDialog({
    month,
    selected,
    allowedWeekdays: config.calendar.allowedWeekdays,
    flow,
    onMoved: (date) => focusMovedChip(sectionRef.current, date),
  });

  const onEntriesDrop = (entryIds: string[], date: string) => {
    const byId = new Map(month.entries.map((entry) => [entry.id, entry]));
    flow.move(
      entryIds.flatMap((id) => byId.get(id) ?? []),
      date,
      "drag",
    );
  };

  return (
    <MonthSection ref={sectionRef}>
      <Notices>{notices}</Notices>
      <CountsRow>
        <CountsBar
          entryDays={month.counts.entryDays}
          entryCount={month.counts.entryCount}
        />
        {editable && (
          <ActionBar selected={selected} hint="Drag a session to move it">
            {single &&
              deleteProps &&
              cancelProps &&
              (deleteProps.canDelete || cancelProps.canCancel) && (
                <EntryActions
                  key={single.id}
                  label={single.label}
                  date={single.date}
                  {...deleteProps}
                >
                  <CancelToggle
                    label={single.label}
                    date={single.date}
                    {...cancelProps}
                  />
                </EntryActions>
              )}
            {/* The delete question replaces the entry's buttons, so "Move
                to…" hides while it's open. */}
            {selected.length > 0 && !deleteProps?.confirming && (
              <MoveToButton
                key="move-to"
                {...(selected.length === 1
                  ? { label: selected[0].label, date: selected[0].date }
                  : { count: selected.length })}
                disabled={flow.moving}
                onClick={moveTo.open}
              />
            )}
          </ActionBar>
        )}
      </CountsRow>
      <VisuallyHidden role="status">{flow.pendingStatus}</VisuallyHidden>
      <MonthCalendar
        month={month}
        entries={flow.entries}
        holidays={month.holidays}
        selectedEntryIds={selection.selectedIds}
        busyEntryIds={flow.busyEntryIds}
        busyDates={flow.busyDates}
        onEntryClick={editable ? selection.toggle : undefined}
        readOnly={!editable || flow.moving}
        onEntriesDrop={onEntriesDrop}
      />
      {editable && <MoveEntryModal {...moveTo.modalProps} />}
    </MonthSection>
  );
}

/**
 * Sends the page view once per month shown, after months.get has answered,
 * so a background refetch of the same month never sends another. status is
 * "NONE" for a month that doesn't exist yet.
 */
function useTrackMonthViewed(
  viewed: YearMonthOption,
  status: MonthStatus | "NONE",
) {
  const { analyticsStore } = useParoleBoardHost();
  const lastTracked = useRef<string | null>(null);
  const key = toYearMonthParam(viewed);
  const { year, month } = viewed;

  useEffect(() => {
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    analyticsStore.trackPbPublicCalendarAdminViewed({ year, month, status });
  }, [analyticsStore, key, year, month, status]);
}

/**
 * The part of the screen that waits for the month: the status banner, which
 * shows a published month as live with its counts and a draft that was
 * published before as back in draft, and the month's counts, action bar and
 * grid, or the empty state when the month doesn't exist yet. Either starts
 * with notices, such as the ones Add month leaves after creating months. It
 * holds the month's entry selection, so the parts that act on it share one,
 * the Add hearing dialog included: the dialog opens on the one selected
 * entry's day, and selects the entry it adds.
 */
function MonthContent({
  viewed,
  titleRef,
  addingHearing,
  onAddingHearingEnd,
  notices,
  onAddMonth,
}: {
  viewed: YearMonthOption;
  titleRef: RefObject<HTMLHeadingElement | null>;
  /** Whether the header's "+ Add hearing" has opened the dialog. */
  addingHearing: boolean;
  /** Closes the Add hearing dialog. */
  onAddingHearingEnd: () => void;
  notices?: ReactNode;
  onAddMonth: () => void;
}) {
  const current = useCurrentYearMonth();
  const { data: config } = useCalendarConfig();
  const { data: month } = useMonth(viewed);
  const editable = month ? canEditMonth(month, current) : false;
  const selection = useMonthSelection(viewed, month, editable);
  const { selected, selectOnly } = selection;

  useTrackMonthViewed(viewed, month?.status ?? "NONE");

  // A refetch that locks the month, as after Publish in another tab, removes
  // the dialog, so it mustn't reopen by itself on the next editable month.
  useEffect(() => {
    if (!editable) onAddingHearingEnd();
  }, [editable, onAddingHearingEnd]);

  return (
    <>
      <MonthStatusBanner month={month} timeZone={config.calendar.timezone} />
      {month ? (
        <MonthBody
          month={month}
          editable={editable}
          selection={selection}
          titleRef={titleRef}
          notices={notices}
        />
      ) : (
        <Body>
          {notices}
          <EmptyMonth viewed={viewed} onAddMonth={onAddMonth} />
        </Body>
      )}
      {month && editable && (
        <AddHearingModal
          isOpen={addingHearing}
          month={month}
          selectedDate={selected.length === 1 ? selected[0].date : null}
          onClose={onAddingHearingEnd}
          onAdded={(entry) => {
            selectOnly(entry.id);
            onAddingHearingEnd();
          }}
        />
      )}
    </>
  );
}

/**
 * The Public Calendar screen for one month. The header comes from the URL
 * and the cached month list, so it stays on screen while the month changes:
 * the title, the arrows to the nearest stored months, the month picker,
 * "+ Add month" and the page's actions. Below it, MonthContent waits for the
 * month in its own SuspenseBoundary, so a month that isn't cached shows the
 * section skeleton under the header, and a cached one, such as a neighbour
 * the arrows prefetched, shows at once.
 * "+ Add month" in the header and the empty state open the Add a month
 * dialog. Right after it creates months, the body starts with the notices
 * months.create returned, which the router state carries.
 */
export function ParoleCalendarAdminView({
  viewed,
}: {
  viewed: YearMonthOption;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = useCurrentYearMonth();
  const { previous, next } = useNeighborMonths(viewed, current);
  const { isPending, data: month } = useMonthWithoutSuspense(viewed);
  const skeleton = useMonthSkeleton(viewed);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [addingHearing, setAddingHearing] = useState(false);
  const endAddingHearing = useCallback(() => setAddingHearing(false), []);
  // The browser's Back button can change the month under an open dialog,
  // and the dialog belongs to the month it was opened on.
  const viewedKey = toYearMonthParam(viewed);
  useEffect(endAddingHearing, [viewedKey, endAddingHearing]);
  const [addMonthOpen, setAddMonthOpen] = useState(false);
  const createNotices = readCreateNotices(location.state);
  const openAddMonth = () => setAddMonthOpen(true);

  return (
    <Page>
      <MonthHeader
        title={formatMonthYear(viewed)}
        navigation={
          <>
            <MonthNav>
              <MonthLink month={previous} label="Previous month">
                <Mirrored>
                  <Icon kind="Arrow" size={space.md} />
                </Mirrored>
              </MonthLink>
              <MonthPicker viewed={viewed} current={current} />
              <MonthLink month={next} label="Next month">
                <Icon kind="Arrow" size={space.md} />
              </MonthLink>
            </MonthNav>
            <Button kind="secondary" shape="block" onClick={openAddMonth}>
              + Add month
            </Button>
          </>
        }
        actions={
          <MonthActions
            key={toYearMonthParam(viewed)}
            pending={isPending}
            month={month}
          >
            {/* Hearings go only into a DRAFT month from the current month
                on: a published month is locked until Edit month, and past
                months are read-only. */}
            {month && canEditMonth(month, current) && (
              <Button kind="secondary" onClick={() => setAddingHearing(true)}>
                + Add hearing
              </Button>
            )}
          </MonthActions>
        }
        titleRef={titleRef}
      />
      <SuspenseBoundary
        fallback={<MonthSectionSkeleton {...skeleton} />}
        errorTitle={MONTH_LOAD_ERROR_TITLE}
        renderError={renderCalendarError}
        resetKeys={[toYearMonthParam(viewed)]}
      >
        <MonthContent
          viewed={viewed}
          titleRef={titleRef}
          addingHearing={addingHearing}
          onAddingHearingEnd={endAddingHearing}
          onAddMonth={openAddMonth}
          notices={
            <CreateNotices
              groups={createNotices}
              // Dismissing replaces the history entry with one without the
              // notices, so going back or reloading doesn't bring them back.
              // The query string stays, so the staff app's tenantId does too.
              onDismiss={() =>
                navigate(
                  { pathname: ".", search: location.search },
                  { replace: true, state: null },
                )
              }
            />
          }
        />
      </SuspenseBoundary>
      <AddMonthModal
        isOpen={addMonthOpen}
        onClose={() => setAddMonthOpen(false)}
      />
    </Page>
  );
}
