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

// A structural copy of the public read's output (PublicMonth in the Calendar
// router), so this presentational library never imports router types. If the
// server's type drops or renames a field, the app that passes its output in
// fails to typecheck.

/** One day of a published month, as the public sees it. */
export interface PublicCalendarDay {
  /** "YYYY-MM-DD" */
  date: string;
  /** The holiday on this date, or null. */
  holidayName: string | null;
  /** Public entries only, already in display order. */
  entries: { label: string; kind: string; cancelled: boolean }[];
}

/** One published month, as usCoPublicCalendar.public.months.get returns it. */
export interface PublicCalendarMonth {
  /** "YYYY-MM" */
  month: string;
  /** Such as "November 2026". */
  title: string;
  /** Every date of the month, in order. */
  days: PublicCalendarDay[];
  /** The nearest published months, "YYYY-MM", or null at either end. */
  previous: string | null;
  next: string | null;
  /**
   * The current month's title, such as "October 2026", when the landing page
   * skipped past it to a later published month. Null otherwise.
   */
  notPublishedYet: string | null;
}

export interface PublicCalendarViewProps {
  /** The month to show, or null when no month has been published. */
  month: PublicCalendarMonth | null;
  /** "unavailable" when the requested month isn't published or doesn't exist. */
  status?: "ready" | "unavailable";
  /**
   * True when the month was showing and has since gone back to draft. The
   * last month stays on screen, greyed and inert, under a banner saying it's
   * no longer live.
   */
  noLongerLive?: boolean;
  /**
   * The router path of a month's page, such as "/2026-11", for the previous
   * and next links.
   */
  monthHref: (month: string) => string;
  /** The landing page's address, linked from the unavailable state. */
  landingHref: string;
}
