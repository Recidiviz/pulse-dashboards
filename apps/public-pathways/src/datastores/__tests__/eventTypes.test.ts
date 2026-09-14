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

import { PATHWAYS_SECTIONS } from "~shared-pathways";

import {
  EVENT_TYPES,
  isEventType,
  isSectionAvailableForEventType,
} from "../eventTypes";

describe("isEventType", () => {
  it("accepts every known event type", () => {
    expect(Object.values(EVENT_TYPES).every(isEventType)).toBe(true);
  });

  it("rejects a value that is not an event type", () => {
    expect(isEventType("NOT_AN_EVENT_TYPE")).toBe(false);
  });
});

describe("isSectionAvailableForEventType", () => {
  it.each([
    [EVENT_TYPES.ADMISSIONS, true],
    [EVENT_TYPES.ALL, true],
    [EVENT_TYPES.RELEASES, false],
  ])("admission type with %s is available: %s", (eventType, expected) => {
    expect(
      isSectionAvailableForEventType(
        PATHWAYS_SECTIONS["countByAdmissionType"],
        eventType,
      ),
    ).toBe(expected);
  });

  it.each([
    [EVENT_TYPES.ADMISSIONS, false],
    [EVENT_TYPES.ALL, true],
    [EVENT_TYPES.RELEASES, true],
  ])("release type with %s is available: %s", (eventType, expected) => {
    expect(
      isSectionAvailableForEventType(
        PATHWAYS_SECTIONS["countByReleaseType"],
        eventType,
      ),
    ).toBe(expected);
  });

  it("hides community supervision unless releases are counted", () => {
    expect(
      isSectionAvailableForEventType(
        PATHWAYS_SECTIONS["countByCommunitySupervision"],
        EVENT_TYPES.ADMISSIONS,
      ),
    ).toBe(false);
  });

  it("keeps a section with no event type rule always available", () => {
    expect(
      isSectionAvailableForEventType(
        PATHWAYS_SECTIONS["countOverTime"],
        EVENT_TYPES.ADMISSIONS,
      ),
    ).toBe(true);
  });
});
