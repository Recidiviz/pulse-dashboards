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

import { findFocusedRoute } from "@react-navigation/native";

import { stateCodeParam } from "~@meetings/app/entities/state-code";

import { linking } from "./linking";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(() => {
  stateCodeParam.current = "";
});

function parsePath(path: string) {
  const state = linking.getStateFromPath?.(path, linking.config);
  if (!state) throw new Error(`Failed to parse path: ${path}`);
  return state;
}

describe("linking stateCode round trip", () => {
  // Pins the delete of the focused route's stamped `path`: React Navigation's
  // getPathForRoute prefers route.path over getPathFromState, which would
  // strip the re-injected stateCode param. A @react-navigation/native upgrade
  // that changes where `path` is stamped should fail here, not silently.
  it("parses a path without stamping route.path, and re-injects stateCode", () => {
    const state = parsePath("/clients?stateCode=us_ne");

    const focused = findFocusedRoute(state);
    expect(focused).toBeDefined();
    expect(focused).not.toHaveProperty("path");
    expect(stateCodeParam.current).toBe("US_NE");

    const path = linking.getPathFromState?.(state, linking.config);
    expect(path).toBe("/clients?stateCode=US_NE");
  });

  it("round-trips a nested path with the re-injected stateCode", () => {
    const state = parsePath("/clients/123/meetings/456?stateCode=US_ID");

    const path = linking.getPathFromState?.(state, linking.config);
    expect(path).toBe("/clients/123/meetings/456?stateCode=US_ID");
  });

  it("omits the stateCode param when none has been seen", () => {
    const state = parsePath("/clients");

    const path = linking.getPathFromState?.(state, linking.config);
    expect(path).toBe("/clients");
  });
});

describe("admin paths", () => {
  it("maps admin/agency-config to the AgencyConfig screen", () => {
    const state = parsePath("/admin/agency-config");

    expect(findFocusedRoute(state)?.name).toBe("AgencyConfig");
    expect(linking.getPathFromState?.(state, linking.config)).toBe(
      "/admin/agency-config",
    );
  });

  it("maps admin/flagged-meetings to the list screen", () => {
    const state = parsePath("/admin/flagged-meetings");

    expect(findFocusedRoute(state)?.name).toBe("AdminFlaggedMeetings");
    expect(linking.getPathFromState?.(state, linking.config)).toBe(
      "/admin/flagged-meetings",
    );
  });

  it("puts only the state code and meeting id in the flagged meeting URL", () => {
    const state = parsePath("/admin/flagged-meetings/US_NE/meeting-123");

    const route = findFocusedRoute(state);
    expect(route?.name).toBe("AdminFlaggedMeeting");
    expect(route?.params).toEqual({
      stateCode: "US_NE",
      meetingId: "meeting-123",
    });
    expect(linking.getPathFromState?.(state, linking.config)).toBe(
      "/admin/flagged-meetings/US_NE/meeting-123",
    );
  });
});
