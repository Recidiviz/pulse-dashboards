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

import { useEffect, useMemo } from "react";

import { CalendarGrid } from "../CalendarGrid/CalendarGrid";
import { toIsoDate } from "../CalendarGrid/dates";
import type {
  CalendarGridEntry,
  CalendarHoliday,
  CalendarMonthRef,
} from "../CalendarGrid/types";
import { StatusMessage } from "../components/StatusMessage";
import { MonthNav } from "./MonthNav";
import { MonthScroller } from "./MonthScroller";
import { PageFrame, useIsPhone } from "./PageFrame";
import {
  BannerStrip,
  EmptyMessage,
  GridSurface,
  MessageArea,
  Note,
} from "./PublicCalendarView.styles";
import { initialScrollDate } from "./scrollTarget";
import type { PublicCalendarMonth, PublicCalendarViewProps } from "./types";

const SITE_TITLE = "Colorado Parole Board Hearing Calendar";

// Colorado's calendar dates are in Denver time. The grid needs a zone to
// turn its cells' dates into "YYYY-MM-DD"; the public days carry no times.
const TIME_ZONE = "America/Denver";

// The grid shows Sunday first, as the public design does.
const FIRST_DAY = 0;

/**
 * The chip text: the public design spells out the Board Business Meeting,
 * whose kind label in the data is the admin's short "Business Mtg".
 */
export function publicChipLabel(entry: CalendarGridEntry): string {
  return entry.kind === "BUSINESS_MEETING" ? "Business Meeting" : entry.label;
}

/**
 * Turns a public month into CalendarGrid's month, entries and holidays. Public
 * entries have no ids, so each gets one from its date and place in the day.
 */
export function toGridData(month: PublicCalendarMonth): {
  monthRef: CalendarMonthRef;
  entries: CalendarGridEntry[];
  holidays: CalendarHoliday[];
} {
  const [year, monthNumber] = month.month.split("-").map(Number);
  return {
    monthRef: { year, month: monthNumber },
    entries: month.days.flatMap((day) =>
      day.entries.map((entry, i) => ({
        id: `${day.date}-${i}`,
        date: day.date,
        ...entry,
      })),
    ),
    holidays: month.days.flatMap((day) =>
      day.holidayName ? [{ date: day.date, name: day.holidayName }] : [],
    ),
  };
}

function usePageTitle(monthTitle: string | undefined) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = monthTitle ? `${monthTitle} — ${SITE_TITLE}` : SITE_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, [monthTitle]);
}

function MonthGrid({
  month,
  inactive,
}: {
  month: PublicCalendarMonth;
  inactive: boolean;
}) {
  const { monthRef, entries, holidays } = useMemo(
    () => toGridData(month),
    [month],
  );
  const scrollToDate = useMemo(
    () => initialScrollDate(month, toIsoDate(new Date(), TIME_ZONE)),
    [month],
  );
  return (
    <MonthScroller
      label={`${month.title} calendar`}
      scrollToDate={scrollToDate}
      inert={inactive}
    >
      <GridSurface $inactive={inactive}>
        <CalendarGrid
          month={monthRef}
          entries={entries}
          holidays={holidays}
          timeZone={TIME_ZONE}
          firstDay={FIRST_DAY}
          formatLabel={publicChipLabel}
          cancelledTag="text"
        />
      </GridSurface>
    </MonthScroller>
  );
}

/**
 * The public Parole Board hearing calendar: one published month on a
 * read-only grid, with links to the published months either side. It only
 * displays; the app shell fetches the month and passes it in, and wraps this
 * in a SuspenseBoundary with PublicCalendarSkeleton and
 * PublicCalendarLoadError. Render it inside a router, since the arrows are
 * router links. Matches the Public View design, without its preview bar. On
 * a screen narrower than the grid, the grid scrolls sideways under the
 * header rather than squeezing its columns. With noLongerLive, the
 * month stays on screen greyed out and inert, so it's out of the tab order
 * and hidden from screen readers. A red strip right under the header says
 * it's no longer live, and the arrows still work.
 */
export function PublicCalendarView({
  month,
  status = "ready",
  noLongerLive = false,
  monthHref,
  landingHref,
}: PublicCalendarViewProps) {
  const phone = useIsPhone();
  const shown = status === "ready" ? month : null;
  usePageTitle(shown?.title);

  if (status === "unavailable") {
    return (
      <PageFrame phone={phone}>
        <MessageArea>
          <StatusMessage
            title="This month isn't available."
            subtitle={<a href={landingHref}>Go to the calendar</a>}
          />
        </MessageArea>
      </PageFrame>
    );
  }

  if (!shown) {
    return (
      <PageFrame phone={phone}>
        <EmptyMessage>No months have been published yet.</EmptyMessage>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      phone={phone}
      nav={
        <MonthNav
          title={shown.title}
          previous={shown.previous}
          next={shown.next}
          monthHref={monthHref}
        />
      }
      banner={
        // A named section, as the admin's strip is, so the banner sits in a
        // landmark like the rest of the page. It's named only while it holds
        // the banner, so screen readers don't list an empty landmark. The
        // live region inside stays on the page while empty, so screen
        // readers announce the banner when it appears.
        <section aria-label={noLongerLive ? "Month status" : undefined}>
          <div role="status">
            {noLongerLive && (
              <BannerStrip
                tone="error"
                layout="strip"
                tag="UPDATING"
                live={false}
              >
                {shown.title}'s calendar is being updated and is no longer live.
                Check back soon.
              </BannerStrip>
            )}
          </div>
        </section>
      }
    >
      {shown.notPublishedYet && (
        <Note>{shown.notPublishedYet} isn't published yet.</Note>
      )}
      <MonthGrid month={shown} inactive={noLongerLive} />
    </PageFrame>
  );
}
