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

import { describe, expect, it, vi } from "vitest";

import {
  APPLICATION_FILTER_LAST_UPDATED,
  APPLICATION_FILTER_RELEASE_DATE,
  APPLICATION_STAGE,
} from "~@idaho-th/shared";

import { buildFiltersArg } from "../filters";

describe("buildFiltersArg", () => {
  it("does not produce an applicationWhere entry for lastUpdated", () => {
    const { applicationWhere } = buildFiltersArg({
      lastUpdated: [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D],
    });

    expect(applicationWhere).not.toHaveProperty("lastActivityAt");
  });

  it("ignores ALL lastUpdated filter value", () => {
    const { applicationWhere } = buildFiltersArg({
      lastUpdated: [APPLICATION_FILTER_LAST_UPDATED.ALL],
    });

    expect(applicationWhere).toEqual({});
  });

  it("puts stage and status filters on the workflow record", () => {
    expect(
      buildFiltersArg({
        stage: [APPLICATION_STAGE.APPLICATION, APPLICATION_STAGE.APPROVALS],
        status: ["ACTION_NEEDED", "WAITING"],
      }),
    ).toEqual({
      recordWhere: {
        stage: {
          in: [APPLICATION_STAGE.APPLICATION, APPLICATION_STAGE.APPROVALS],
        },
        status: { in: ["ACTION_NEEDED", "WAITING"] },
      },
      applicationWhere: {},
    });
  });

  it("does not constrain expectedReleaseDate for All time", () => {
    expect(
      buildFiltersArg({
        releaseDate: [APPLICATION_FILTER_RELEASE_DATE.ALL_TIME],
      }),
    ).toEqual({ recordWhere: {}, applicationWhere: {} });
  });

  it("builds a release-date window from the largest selected day limit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T15:30:00.000Z"));

    const { applicationWhere } = buildFiltersArg({
      releaseDate: [
        APPLICATION_FILTER_RELEASE_DATE.NEXT_7_DAYS,
        APPLICATION_FILTER_RELEASE_DATE.NEXT_30_DAYS,
      ],
    });

    expect(applicationWhere["expectedReleaseDate"]).toEqual({
      gte: new Date("2026-07-06T00:00:00.000"),
      lt: new Date("2026-08-06T00:00:00.000"),
    });

    vi.useRealTimers();
  });
});
