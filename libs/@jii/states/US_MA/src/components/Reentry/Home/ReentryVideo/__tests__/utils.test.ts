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

import { getPositionSeconds, hasWatchedWholeVideo } from "../utils";

const DURATION = 191.5;

const playedRanges = (...ranges: [number, number][]): TimeRanges => ({
  length: ranges.length,
  start: (index: number) => ranges[index][0],
  end: (index: number) => ranges[index][1],
});

describe("getPositionSeconds", () => {
  test("rounds to whole seconds", () => {
    expect(getPositionSeconds({ currentTime: 42.6 })).toBe(43);
  });
});

describe("hasWatchedWholeVideo", () => {
  test("is false before anything plays", () => {
    expect(
      hasWatchedWholeVideo({ played: playedRanges(), duration: DURATION }),
    ).toBe(false);
  });

  test("is false when playback stopped partway", () => {
    expect(
      hasWatchedWholeVideo({
        played: playedRanges([0, 120]),
        duration: DURATION,
      }),
    ).toBe(false);
  });

  test("is true after a full viewing, within the tolerance", () => {
    expect(
      hasWatchedWholeVideo({
        played: playedRanges([0, DURATION - 0.1]),
        duration: DURATION,
      }),
    ).toBe(true);
  });

  test("is true when the full viewing was split by pauses", () => {
    expect(
      hasWatchedWholeVideo({
        played: playedRanges([0, 60], [60, DURATION]),
        duration: DURATION,
      }),
    ).toBe(true);
  });

  test("is false after scrubbing straight to the end", () => {
    expect(
      hasWatchedWholeVideo({
        played: playedRanges([0, 1], [DURATION - 0.01, DURATION]),
        duration: DURATION,
      }),
    ).toBe(false);
  });

  test("is false when a middle section was skipped", () => {
    expect(
      hasWatchedWholeVideo({
        played: playedRanges([0, 30], [60, DURATION]),
        duration: DURATION,
      }),
    ).toBe(false);
  });
});
