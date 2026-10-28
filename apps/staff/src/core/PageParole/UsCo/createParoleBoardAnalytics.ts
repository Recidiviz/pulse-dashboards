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

import type { ParoleBoardAnalytics } from "~@parole-board/common";

import type AnalyticsStore from "../../../RootStore/AnalyticsStore";

/**
 * Sends the Parole Board admin calendar's events through the staff
 * AnalyticsStore, which adds sessionId and decides whether to write to
 * Segment.
 *
 * Each method copies only the fields its metadata type declares. A caller can
 * pass an object with extra fields, and TypeScript allows it, so copying keeps
 * anything outside the declared months, counts and codes from reaching
 * Segment.
 */
export function createParoleBoardAnalytics(
  analyticsStore: Pick<AnalyticsStore, "track">,
): ParoleBoardAnalytics {
  return {
    trackPbPublicCalendarAdminViewed: ({ year, month, status }) =>
      analyticsStore.track("frontend.pb_public_calendar_admin_viewed", {
        year,
        month,
        status,
      }),
    trackPbPublicCalendarMonthAdded: ({ months, count }) =>
      analyticsStore.track("frontend.pb_public_calendar_month_added", {
        months: [...months],
        count,
      }),
    trackPbPublicCalendarHearingAdded: ({ year, month, kind }) =>
      analyticsStore.track("frontend.pb_public_calendar_hearing_added", {
        year,
        month,
        kind,
      }),
    trackPbPublicCalendarHearingDeleted: ({ year, month, kind }) =>
      analyticsStore.track("frontend.pb_public_calendar_hearing_deleted", {
        year,
        month,
        kind,
      }),
    trackPbPublicCalendarHearingMoved: ({
      year,
      month,
      kind,
      method,
      dayDelta,
    }) =>
      analyticsStore.track("frontend.pb_public_calendar_hearing_moved", {
        year,
        month,
        kind,
        method,
        dayDelta,
      }),
    trackPbPublicCalendarMonthPublished: ({
      year,
      month,
      hearingDays,
      hearingCount,
      holidayWarningCount,
      isRepublish,
      daysBeforeMonthStart,
    }) =>
      analyticsStore.track("frontend.pb_public_calendar_month_published", {
        year,
        month,
        hearingDays,
        hearingCount,
        holidayWarningCount,
        isRepublish,
        daysBeforeMonthStart,
      }),
    trackPbPublicCalendarMonthUnpublished: ({ year, month }) =>
      analyticsStore.track("frontend.pb_public_calendar_month_unpublished", {
        year,
        month,
      }),
    trackPbPublicCalendarPatternEdited: ({ kindCode, resourceCode }) =>
      analyticsStore.track("frontend.pb_public_calendar_pattern_edited", {
        kindCode,
        resourceCode,
      }),
  };
}
