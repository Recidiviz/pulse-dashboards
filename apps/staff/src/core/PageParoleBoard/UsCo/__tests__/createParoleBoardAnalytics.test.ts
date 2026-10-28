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

import { createParoleBoardAnalytics } from "../createParoleBoardAnalytics";

function setup() {
  const track = vi.fn();
  return { track, analytics: createParoleBoardAnalytics({ track }) };
}

describe("createParoleBoardAnalytics", () => {
  it("sends the admin page view with the month and its status", () => {
    const { track, analytics } = setup();

    analytics.trackPbPublicCalendarAdminViewed({
      year: 2026,
      month: 11,
      status: "NONE",
    });

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(
      "frontend.pb_public_calendar_admin_viewed",
      { year: 2026, month: 11, status: "NONE" },
    );
  });

  it("sends the added months and their count", () => {
    const { track, analytics } = setup();

    analytics.trackPbPublicCalendarMonthAdded({
      months: ["2026-11", "2026-12"],
      count: 2,
    });

    expect(track).toHaveBeenCalledWith(
      "frontend.pb_public_calendar_month_added",
      { months: ["2026-11", "2026-12"], count: 2 },
    );
  });

  it("sends added and deleted entries with their month and kind", () => {
    const { track, analytics } = setup();

    analytics.trackPbPublicCalendarHearingAdded({
      year: 2026,
      month: 11,
      kind: "HEARING",
    });
    analytics.trackPbPublicCalendarHearingDeleted({
      year: 2026,
      month: 12,
      kind: "BOARD_MEETING",
    });

    expect(track).toHaveBeenNthCalledWith(
      1,
      "frontend.pb_public_calendar_hearing_added",
      { year: 2026, month: 11, kind: "HEARING" },
    );
    expect(track).toHaveBeenNthCalledWith(
      2,
      "frontend.pb_public_calendar_hearing_deleted",
      { year: 2026, month: 12, kind: "BOARD_MEETING" },
    );
  });

  it.each(["drag", "move_to"] as const)(
    "sends a move made by %s with its day delta",
    (method) => {
      const { track, analytics } = setup();

      analytics.trackPbPublicCalendarHearingMoved({
        year: 2026,
        month: 11,
        kind: "HEARING",
        method,
        dayDelta: -3,
      });

      expect(track).toHaveBeenCalledWith(
        "frontend.pb_public_calendar_hearing_moved",
        { year: 2026, month: 11, kind: "HEARING", method, dayDelta: -3 },
      );
    },
  );

  it("sends a publish with the month's counts", () => {
    const { track, analytics } = setup();
    const metadata = {
      year: 2026,
      month: 12,
      hearingDays: 14,
      hearingCount: 212,
      holidayWarningCount: 1,
      isRepublish: true,
      daysBeforeMonthStart: 23,
    };

    analytics.trackPbPublicCalendarMonthPublished(metadata);

    expect(track).toHaveBeenCalledWith(
      "frontend.pb_public_calendar_month_published",
      metadata,
    );
  });

  it("sends an unpublish with the year and month only", () => {
    const { track, analytics } = setup();

    analytics.trackPbPublicCalendarMonthUnpublished({ year: 2026, month: 12 });

    expect(track).toHaveBeenCalledWith(
      "frontend.pb_public_calendar_month_unpublished",
      { year: 2026, month: 12 },
    );
  });

  it.each([
    { kindCode: "HEARING", resourceCode: "FACILITY_A" },
    { kindCode: "BOARD_MEETING", resourceCode: null },
  ])(
    "sends a pattern edit for kind $kindCode and resource $resourceCode",
    (metadata) => {
      const { track, analytics } = setup();

      analytics.trackPbPublicCalendarPatternEdited(metadata);

      expect(track).toHaveBeenCalledWith(
        "frontend.pb_public_calendar_pattern_edited",
        metadata,
      );
    },
  );

  const extras = {
    email: "editor@example.com",
    entryId: "entry-1",
    note: "Moved for the holiday",
  };
  const calls: [
    keyof ParoleBoardAnalytics,
    (analytics: ParoleBoardAnalytics) => void,
  ][] = [
    [
      "trackPbPublicCalendarAdminViewed",
      (a) =>
        a.trackPbPublicCalendarAdminViewed({
          year: 2026,
          month: 11,
          status: "DRAFT",
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarMonthAdded",
      (a) =>
        a.trackPbPublicCalendarMonthAdded({
          months: ["2026-11"],
          count: 1,
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarHearingAdded",
      (a) =>
        a.trackPbPublicCalendarHearingAdded({
          year: 2026,
          month: 11,
          kind: "HEARING",
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarHearingDeleted",
      (a) =>
        a.trackPbPublicCalendarHearingDeleted({
          year: 2026,
          month: 11,
          kind: "HEARING",
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarHearingMoved",
      (a) =>
        a.trackPbPublicCalendarHearingMoved({
          year: 2026,
          month: 11,
          kind: "HEARING",
          method: "drag",
          dayDelta: 1,
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarMonthPublished",
      (a) =>
        a.trackPbPublicCalendarMonthPublished({
          year: 2026,
          month: 11,
          hearingDays: 12,
          hearingCount: 180,
          holidayWarningCount: 0,
          isRepublish: false,
          daysBeforeMonthStart: 13,
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarMonthUnpublished",
      (a) =>
        a.trackPbPublicCalendarMonthUnpublished({
          year: 2026,
          month: 11,
          ...extras,
        }),
    ],
    [
      "trackPbPublicCalendarPatternEdited",
      (a) =>
        a.trackPbPublicCalendarPatternEdited({
          kindCode: "HEARING",
          resourceCode: "FACILITY_A",
          ...extras,
        }),
    ],
  ];

  it.each(calls)(
    "%s drops fields its metadata type doesn't declare",
    (_, call) => {
      const { track, analytics } = setup();

      call(analytics);

      const sent = track.mock.calls[0][1];
      expect(sent).not.toHaveProperty("email");
      expect(sent).not.toHaveProperty("entryId");
      expect(sent).not.toHaveProperty("note");
    },
  );
});
