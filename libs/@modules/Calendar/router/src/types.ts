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

import type {
  HolidayPolicy,
  IsoDate,
  PatternRule,
  Weekday,
  WeekNumbering,
} from "~@modules/Calendar/rules";

/**
 * The output types of the calendar engine, which each state's API returns.
 * Kind is the calendar's entry-type code: a state's router narrows it to its
 * fixed list, such as Colorado's HEARING, FULL_BOARD and BUSINESS_MEETING,
 * while resources stay codes and labels from the database. Calendar
 * dates are "YYYY-MM-DD" strings, and timestamps are Dates, which superjson
 * carries.
 */

/**
 * A PUBLISHED month is on the public calendar and locked: every entry write to
 * it is PRECONDITION_FAILED until an editor moves it back to DRAFT with
 * months.unpublish.
 */
export type MonthStatus = "DRAFT" | "PUBLISHED";

/**
 * When a month was last published, and by whom: the createdAt and actorEmail
 * of its newest PUBLISHED status event.
 */
export interface LatestPublication {
  publishedAt: Date;
  publishedByEmail: string;
}

export interface YearMonthOption {
  year: number;
  /** 1 (January) to 12. */
  month: number;
}

export interface MonthSummary {
  id: string;
  year: number;
  /** 1 (January) to 12. */
  month: number;
  /**
   * A DRAFT month with a latestPublication is back in draft: it was published,
   * then an editor clicked Edit month, so it's off the public calendar until
   * its next publish.
   */
  status: MonthStatus;
  /**
   * Starts at 1 when months.create writes the month, and every entry write
   * and status change adds 1. months.publish takes it as expectedRevision, so
   * an editor publishes only the revision they reviewed.
   */
  revision: number;
  /** CalendarMonth.updatedAt. */
  lastEditedAt: Date;
  /** CalendarMonth.updatedByEmail. */
  lastEditedByEmail: string;
  /** Null when the month has never been published. */
  latestPublication: LatestPublication | null;
}

/**
 * One page of months.list, DRAFT and PUBLISHED months alike, matching the
 * month dropdown in the design, which has no status filter. Past months are
 * never listed: the dropdown starts at the current month.
 */
export interface MonthListPage {
  /** In ascending order, so pages join end to end. */
  items: MonthSummary[];
  /**
   * Pass as cursor with direction "forward" to load the months after this page,
   * or null when there are none.
   */
  nextCursor: YearMonthOption | null;
  /**
   * Pass as cursor with direction "backward" to load the months before this
   * page, or null when there are none.
   */
  prevCursor: YearMonthOption | null;
}

export interface EntryDto<Kind extends string = string> {
  id: string;
  date: IsoDate;
  kind: {
    code: Kind;
    label: string;
    cancellable: boolean;
    deletable: boolean;
    countsTowardTotal: boolean;
  };
  /** The resource's label, or the kind's label when the entry has no resource. */
  label: string;
  resource: {
    id: string;
    code: string;
    label: string;
    typeCode: string;
  } | null;
  /** "HEARING:FCF" for an entry with a resource, the kind code otherwise. */
  slotKey: string;
  startTime: string | null;
  endTime: string | null;
  source: "PATTERN" | "MANUAL";
  cancelled: boolean;
  cancelledAt: Date | null;
  cancelledByEmail: string | null;
  /** The holiday on this date, if any. Holidays never block an entry. */
  holidayName: string | null;
  version: number;
  updatedAt: Date;
  updatedByEmail: string;
}

export interface MonthCounts {
  /** Distinct dates with at least one entry whose kind counts toward the total. */
  entryDays: number;
  /** Entries whose kind counts toward the total. */
  entryCount: number;
}

export type MonthDetail<Kind extends string = string> = MonthSummary & {
  /** In date order, then kind sortOrder, then resource sortOrder. */
  entries: EntryDto<Kind>[];
  /** The holidays that fall in this month. */
  holidays: { date: IsoDate; name: string }[];
  /** Counted from the month's entries as they are now. */
  counts: MonthCounts;
};

/** An entry kind: its row's id, label and order, and its entry type's behaviour. */
export interface KindDto<Kind extends string = string> {
  id: string;
  code: Kind;
  label: string;
  requiresResource: boolean;
  cancellable: boolean;
  deletable: boolean;
  isPublic: boolean;
  countsTowardTotal: boolean;
  sortOrder: number;
}

export interface ResourceTypeDto {
  code: string;
  label: string;
  sortOrder: number;
}

export interface ResourceDto {
  id: string;
  code: string;
  /**
   * The full name the editor sees on hover over the label, or null when the
   * calendar has none. Editor-only: the public read leaves it out.
   */
  name: string | null;
  label: string;
  typeCode: string;
  sortOrder: number;
}

/**
 * The calendar's settings, from its state's code, and its reference
 * data. It never includes editorRoute.
 */
export interface CalendarConfig<Kind extends string = string> {
  calendar: {
    code: string;
    name: string;
    timezone: string;
    weekStartsOn: Weekday;
    /**
     * The weekdays entries may fall on, Sunday first. entries.add and
     * entries.move refuse any other day, and months.create skips them.
     */
    allowedWeekdays: readonly Weekday[];
    weekNumbering: WeekNumbering;
    holidayRegion: string | null;
    holidayPolicy: HolidayPolicy;
  };
  /** Every entry type with its behaviour, in sortOrder. */
  kinds: KindDto<Kind>[];
  /** In sortOrder. */
  resourceTypes: ResourceTypeDto[];
  /** Active resources only, in sortOrder. */
  resources: ResourceDto[];
}

/**
 * One pattern slot: each kind that requires a resource paired with each
 * active resource, then each kind with no resource.
 */
export interface CurrentPatternRow<Kind extends string = string> {
  /** "HEARING:FCF" or "FULL_BOARD". */
  slotKey: string;
  kind: { code: Kind; label: string };
  resource: {
    id: string;
    code: string;
    label: string;
    typeCode: string;
    sortOrder: number;
  } | null;
  /** The slot's highest pattern version, or null when the slot has none. */
  pattern: {
    id: string;
    version: number;
    rules: PatternRule[];
    startTime: string | null;
    endTime: string | null;
    createdAt: Date;
    createdByEmail: string;
  } | null;
}

/**
 * A note about a month that months.create generated. The draft generator's
 * own notice type must stay assignable to this one.
 */
export interface CreateMonthNotice {
  code: "KIND_WITHOUT_PATTERN" | "ENTRIES_OUTSIDE_MONTH" | "ENTRIES_NOT_MOVED";
  /** The kind the notice is about, for KIND_WITHOUT_PATTERN. */
  kindCode?: string;
  message: string;
  count?: number;
}

export interface CreateMonthsResult {
  /** In ascending month order. */
  created: {
    id: string;
    year: number;
    month: number;
    entryCount: number;
    notices: CreateMonthNotice[];
  }[];
}

export interface PublishPreview<Kind extends string = string> {
  monthId: string;
  year: number;
  month: number;
  /** months.publishPreview answers for DRAFT months only. */
  status: "DRAFT";
  /** The client sends this back to months.publish as expectedRevision. */
  revision: number;
  counts: MonthCounts;
  holidayWarnings: {
    entryId: string;
    date: IsoDate;
    label: string;
    /** The kind code. */
    kind: Kind;
    holidayName: string;
  }[];
  /** Null when the month has never been published. */
  latestPublication: LatestPublication | null;
}

/**
 * Every write except months.create returns the month as months.get would read
 * it after the write, in the same transaction, so the client can store it
 * without fetching the month again.
 */
export interface MonthWriteResult<Kind extends string = string> {
  month: MonthDetail<Kind>;
}

export interface PublishResult<Kind extends string = string>
  extends MonthWriteResult<Kind> {
  monthId: string;
  status: "PUBLISHED";
  /** The month's revision after the publish. */
  revision: number;
}

export interface UnpublishResult<Kind extends string = string>
  extends MonthWriteResult<Kind> {
  monthId: string;
  status: "DRAFT";
  /** The month's revision after the unpublish. */
  revision: number;
}

/** The output of entries.add, cancel and uncancel. */
export interface EntryMutationResult<Kind extends string = string>
  extends MonthWriteResult<Kind> {
  entry: EntryDto<Kind>;
  monthRevision: number;
}

/** The output of entries.move: every entry it was given, in input order. */
export interface MoveEntriesResult<Kind extends string = string>
  extends MonthWriteResult<Kind> {
  entries: EntryDto<Kind>[];
  monthRevision: number;
}

export interface DeleteEntryResult<Kind extends string = string>
  extends MonthWriteResult<Kind> {
  deletedEntryId: string;
  monthRevision: number;
}

/** One day of a published month, as the public sees it. */
export interface PublicDay<Kind extends string = string> {
  date: IsoDate;
  /** The holiday on this date, or null. */
  holidayName: string | null;
  /** Public entries only, in kind and then resource sortOrder. */
  entries: { label: string; kind: Kind; cancelled: boolean }[];
}

/**
 * The public read of one PUBLISHED month: its public entries
 * as they are now, and the nearest PUBLISHED months on either side, or null
 * at the ends. Months are "YYYY-MM".
 */
export interface PublicMonth<Kind extends string = string> {
  month: string;
  /** e.g. "November 2026". */
  title: string;
  /** Every date of the month, in order. */
  days: PublicDay<Kind>[];
  previous: string | null;
  next: string | null;
  /**
   * Names the current month, such as "October 2026", when a request without
   * a month skipped past it to a later published month, for the page's
   * "October 2026 isn't published yet." line. Null otherwise, including
   * whenever the request named a month.
   */
  notPublishedYet: string | null;
}
