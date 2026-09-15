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

import { MetricContent, PATHWAYS_SECTIONS } from "~shared-pathways";

import {
  ADMISSIONS_COLOR,
  chartColorForSection,
  chartTitleForEventType,
  EVENT_TYPES,
  isEventType,
  isSectionAvailableForEventType,
  RELEASES_COLOR,
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

describe("chartColorForSection", () => {
  it("colors an admissions-only section with the admissions color", () => {
    expect(
      chartColorForSection(PATHWAYS_SECTIONS["countByAdmissionType"]),
    ).toBe(ADMISSIONS_COLOR);
  });

  it.each([
    PATHWAYS_SECTIONS["countByReleaseType"],
    PATHWAYS_SECTIONS["countByCommunitySupervision"],
  ])(
    "colors the releases-only section %s with the releases color",
    (section) => {
      expect(chartColorForSection(section)).toBe(RELEASES_COLOR);
    },
  );

  it("gives no single color to a section that counts both event types", () => {
    expect(
      chartColorForSection(PATHWAYS_SECTIONS["countByCustodyStatus"]),
    ).toBeUndefined();
  });

  it("gives no color to a section with no event type rule", () => {
    expect(
      chartColorForSection(PATHWAYS_SECTIONS["countOverTime"]),
    ).toBeUndefined();
  });

  it("uses the same two colors the over-time chart draws its lines in", () => {
    expect(ADMISSIONS_COLOR).not.toBe(RELEASES_COLOR);
  });
});

describe("chartTitleForEventType", () => {
  const bothEventTypes: MetricContent = {
    title: "Admissions and releases by custody status",
    titleForAdmissions: "Admissions by custody status",
    titleForReleases: "Releases by custody status",
  };

  const oneEventType: MetricContent = { title: "Releases by type" };

  it("names only the event type in view", () => {
    expect(chartTitleForEventType(bothEventTypes, EVENT_TYPES.ADMISSIONS)).toBe(
      "Admissions by custody status",
    );
    expect(chartTitleForEventType(bothEventTypes, EVENT_TYPES.RELEASES)).toBe(
      "Releases by custody status",
    );
  });

  it("names both event types for the combined view", () => {
    expect(chartTitleForEventType(bothEventTypes, EVENT_TYPES.ALL)).toBe(
      "Admissions and releases by custody status",
    );
  });

  it("keeps the canonical title where the copy has no override", () => {
    expect(
      Object.values(EVENT_TYPES).map((eventType) =>
        chartTitleForEventType(oneEventType, eventType),
      ),
    ).toEqual(["Releases by type", "Releases by type", "Releases by type"]);
  });
});
