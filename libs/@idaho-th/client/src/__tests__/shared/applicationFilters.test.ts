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

import {
  APPLICATION_FILTER_LAST_UPDATED,
  APPLICATION_FILTER_RELEASE_DATE,
  APPLICATION_RECENT_ACTIVITY_DAYS,
  APPLICATION_STALE_ACTIVITY_DAYS,
  LAST_UPDATED_FILTER_LABEL_TO_VALUE,
  LAST_UPDATED_FILTER_LABELS,
  RELEASE_DATE_DAY_LIMITS,
  RELEASE_DATE_FILTER_OPTIONS,
} from "~@idaho-th/shared";

describe("applicationFilters", () => {
  it("exposes PRD release-date filter options including All time", () => {
    expect(RELEASE_DATE_FILTER_OPTIONS).toEqual([
      APPLICATION_FILTER_RELEASE_DATE.ALL_TIME,
      APPLICATION_FILTER_RELEASE_DATE.NEXT_7_DAYS,
      APPLICATION_FILTER_RELEASE_DATE.NEXT_30_DAYS,
      APPLICATION_FILTER_RELEASE_DATE.NEXT_90_DAYS,
    ]);
  });

  it("maps Next 7/30/90 day filters to day limits and omits All time", () => {
    expect(RELEASE_DATE_DAY_LIMITS).toEqual({
      [APPLICATION_FILTER_RELEASE_DATE.NEXT_7_DAYS]: 7,
      [APPLICATION_FILTER_RELEASE_DATE.NEXT_30_DAYS]: 30,
      [APPLICATION_FILTER_RELEASE_DATE.NEXT_90_DAYS]: 90,
    });
    expect(
      RELEASE_DATE_DAY_LIMITS[APPLICATION_FILTER_RELEASE_DATE.ALL_TIME],
    ).toBeUndefined();
  });

  it("keeps Last Updated labels bidirectional with API values", () => {
    expect(LAST_UPDATED_FILTER_LABELS).toEqual({
      [APPLICATION_FILTER_LAST_UPDATED.ALL]: "All",
      [APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D]: "No Updates (30d)",
      [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D]:
        "In the past 7 days",
    });
    expect(LAST_UPDATED_FILTER_LABEL_TO_VALUE["No Updates (30d)"]).toBe(
      APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D,
    );
    expect(LAST_UPDATED_FILTER_LABEL_TO_VALUE["In the past 7 days"]).toBe(
      APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
    );
  });

  it("uses 7-day recent and 30-day stale activity windows from the PRD", () => {
    expect(APPLICATION_RECENT_ACTIVITY_DAYS).toBe(7);
    expect(APPLICATION_STALE_ACTIVITY_DAYS).toBe(30);
  });
});
