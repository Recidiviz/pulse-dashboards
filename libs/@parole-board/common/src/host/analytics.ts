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

// Every metadata field is a month, a count, a kind or a public location code.
// Never add emails, entry ids, month ids or free text: these go to Segment.

/** The month an admin is viewing. NONE means the month hasn't been created. */
export interface PbCalendarMonthMetadata {
  year: number;
  month: number;
  status: "DRAFT" | "PUBLISHED" | "NONE";
}

/** The months one add-month request created, as "YYYY-MM" strings. */
export interface PbCalendarMonthAddedMetadata {
  months: string[];
  count: number;
}

export interface PbCalendarMonthUnpublishedMetadata {
  year: number;
  month: number;
}

/**
 * The month an entry is in and its kind code. Kinds come from the calendar
 * config, so kind is a plain string rather than a union.
 */
export interface PbCalendarEntryMetadata {
  year: number;
  month: number;
  kind: string;
}

/** dayDelta is the target date minus the original date, in days. */
export interface PbCalendarMovedMetadata extends PbCalendarEntryMetadata {
  method: "drag" | "move_to";
  dayDelta: number;
}

/**
 * Counts for a month at the moment it was published.
 *
 * isRepublish is true when the month had been published before.
 * daysBeforeMonthStart counts days from today, in the calendar's timezone, to
 * the 1st of the month, and is negative once the month has started.
 */
export interface PbCalendarPublishedMetadata {
  year: number;
  month: number;
  hearingDays: number;
  hearingCount: number;
  holidayWarningCount: number;
  isRepublish: boolean;
  daysBeforeMonthStart: number;
}

/** resourceCode is null for patterns of kinds that have no resource. */
export interface PbCalendarPatternEditedMetadata {
  kindCode: string;
  resourceCode: string | null;
}

/**
 * Analytics events the admin calendar reports through its host. Callers fire
 * each mutation's event only after the server confirms it.
 */
export interface ParoleBoardAnalytics {
  trackPbPublicCalendarAdminViewed(metadata: PbCalendarMonthMetadata): void;
  trackPbPublicCalendarMonthAdded(metadata: PbCalendarMonthAddedMetadata): void;
  trackPbPublicCalendarHearingAdded(metadata: PbCalendarEntryMetadata): void;
  trackPbPublicCalendarHearingDeleted(metadata: PbCalendarEntryMetadata): void;
  trackPbPublicCalendarHearingMoved(metadata: PbCalendarMovedMetadata): void;
  trackPbPublicCalendarMonthPublished(
    metadata: PbCalendarPublishedMetadata,
  ): void;
  trackPbPublicCalendarMonthUnpublished(
    metadata: PbCalendarMonthUnpublishedMetadata,
  ): void;
  trackPbPublicCalendarPatternEdited(
    metadata: PbCalendarPatternEditedMetadata,
  ): void;
}
