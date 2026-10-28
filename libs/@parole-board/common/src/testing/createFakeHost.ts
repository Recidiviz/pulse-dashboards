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

import type { ParoleBoardAnalytics, ParoleBoardHost } from "../host";

/**
 * Analytics methods that do nothing, so tests and examples can spy on them
 * with vi.spyOn(host.analyticsStore, "trackPbPublicCalendarHearingMoved").
 */
function createFakeAnalytics(): ParoleBoardAnalytics {
  return {
    trackPbPublicCalendarAdminViewed: () => undefined,
    trackPbPublicCalendarMonthAdded: () => undefined,
    trackPbPublicCalendarHearingAdded: () => undefined,
    trackPbPublicCalendarHearingDeleted: () => undefined,
    trackPbPublicCalendarHearingMoved: () => undefined,
    trackPbPublicCalendarMonthPublished: () => undefined,
    trackPbPublicCalendarMonthUnpublished: () => undefined,
    trackPbPublicCalendarPatternEdited: () => undefined,
  };
}

/**
 * Builds a ParoleBoardHost for a US_CO tenant with the Parole Board calendar
 * configured. Overrides replace whole top-level fields. Imports nothing from
 * Vitest, so examples can use it too.
 */
export function createFakeHost(
  overrides: Partial<ParoleBoardHost> = {},
): ParoleBoardHost {
  return {
    currentTenantId: "US_CO",
    userStore: {
      getToken: () => Promise.resolve("fake-token"),
      stateCode: "US_CO",
    },
    tenantStore: {
      currentTenantConfig: {
        calendarConfig: {
          calendarCode: "PAROLE_BOARD_PUBLIC",
          navTitle: "Public Calendar",
        },
      },
    },
    analyticsStore: createFakeAnalytics(),
    ...overrides,
  };
}
