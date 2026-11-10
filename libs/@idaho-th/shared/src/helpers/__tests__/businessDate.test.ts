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
  businessToday,
  earliestAllowedReleaseDay,
  IDAHO_TH_TIME_ZONE,
  isBeyondReleaseDatePastGracePeriod,
  isPastBusinessDay,
  toCalendarDay,
} from "../businessDate";

/** 10:30pm Mountain on 2026-09-10, which is already 2026-09-11 in UTC. */
const LATE_EVENING_MOUNTAIN = new Date("2026-09-11T04:30:00Z");

describe("IDAHO_TH_TIME_ZONE", () => {
  it("is the business zone the release-date rule is measured in", () => {
    expect(IDAHO_TH_TIME_ZONE).toBe("America/Denver");
  });
});

describe("businessToday", () => {
  it("resolves a late-evening Mountain instant to the Mountain date, not the UTC one", () => {
    expect(businessToday(LATE_EVENING_MOUNTAIN)).toBe("2026-09-10");
  });

  it("resolves an early-morning Mountain instant to that same day", () => {
    expect(businessToday(new Date("2026-09-10T06:30:00Z"))).toBe("2026-09-10");
  });

  it("resolves correctly across the spring daylight-saving transition", () => {
    // 2026-03-08 is the US spring-forward day: 2am MST becomes 3am MDT.
    expect(businessToday(new Date("2026-03-08T08:30:00Z"))).toBe("2026-03-08");
    expect(businessToday(new Date("2026-03-08T10:30:00Z"))).toBe("2026-03-08");
    expect(businessToday(new Date("2026-03-09T05:30:00Z"))).toBe("2026-03-08");
  });

  it("resolves correctly across the autumn daylight-saving transition", () => {
    // 2026-11-01 is the US fall-back day: 2am MDT becomes 1am MST.
    expect(businessToday(new Date("2026-11-01T07:30:00Z"))).toBe("2026-11-01");
    expect(businessToday(new Date("2026-11-02T06:30:00Z"))).toBe("2026-11-01");
  });

  it("reads the current clock when no instant is supplied", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(LATE_EVENING_MOUNTAIN);

    expect(businessToday()).toBe("2026-09-10");

    vi.useRealTimers();
  });
});

describe("toCalendarDay", () => {
  it("normalizes MM/dd/yyyy", () => {
    expect(toCalendarDay("09/10/2026")).toBe("2026-09-10");
  });

  it("zero-pads a single-digit month and day", () => {
    expect(toCalendarDay("9/1/2026")).toBe("2026-09-01");
  });

  it("keeps an ISO day as-is and drops any time part", () => {
    expect(toCalendarDay("2026-09-10")).toBe("2026-09-10");
    expect(toCalendarDay("2026-09-10T04:30:00.000Z")).toBe("2026-09-10");
  });

  it("tolerates surrounding whitespace", () => {
    expect(toCalendarDay("  09/10/2026  ")).toBe("2026-09-10");
  });

  it("returns null for an empty or unrecognized value", () => {
    expect(toCalendarDay(null)).toBeNull();
    expect(toCalendarDay(undefined)).toBeNull();
    expect(toCalendarDay("")).toBeNull();
    expect(toCalendarDay("09/10/26")).toBeNull();
    expect(toCalendarDay("not a date")).toBeNull();
  });
});

describe("isPastBusinessDay", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(LATE_EVENING_MOUNTAIN);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not count today as past, even late in the Mountain evening", () => {
    expect(isPastBusinessDay("2026-09-10")).toBe(false);
  });

  it("does not count the UTC-rolled-over day as today", () => {
    // The naive `new Date()` implementation this design replaces would have
    // called 2026-09-10 past here, rejecting a date the calendar just offered.
    expect(isPastBusinessDay("2026-09-11")).toBe(false);
  });

  it("counts yesterday as past", () => {
    expect(isPastBusinessDay("2026-09-09")).toBe(true);
  });

  it("counts a future day as not past", () => {
    expect(isPastBusinessDay("2027-01-01")).toBe(false);
  });

  it("measures against a supplied instant when one is given", () => {
    expect(
      isPastBusinessDay("2026-09-10", new Date("2026-09-12T18:00:00Z")),
    ).toBe(true);
    expect(
      isPastBusinessDay("2026-09-10", new Date("2026-09-01T18:00:00Z")),
    ).toBe(false);
  });
});

describe("earliestAllowedReleaseDay", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(LATE_EVENING_MOUNTAIN);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is 7 days before the Mountain business day", () => {
    expect(earliestAllowedReleaseDay()).toBe("2026-09-03");
  });

  it("measures against a supplied instant when one is given", () => {
    expect(earliestAllowedReleaseDay(new Date("2026-12-01T18:00:00Z"))).toBe(
      "2026-11-24",
    );
  });
});

describe("isBeyondReleaseDatePastGracePeriod", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(LATE_EVENING_MOUNTAIN);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not count today as beyond the grace period", () => {
    expect(isBeyondReleaseDatePastGracePeriod("2026-09-10")).toBe(false);
  });

  it("does not count exactly 7 days ago as beyond the grace period", () => {
    expect(isBeyondReleaseDatePastGracePeriod("2026-09-03")).toBe(false);
  });

  it("counts 8 days ago as beyond the grace period", () => {
    expect(isBeyondReleaseDatePastGracePeriod("2026-09-02")).toBe(true);
  });

  it("counts a future day as not beyond the grace period", () => {
    expect(isBeyondReleaseDatePastGracePeriod("2027-01-01")).toBe(false);
  });
});
