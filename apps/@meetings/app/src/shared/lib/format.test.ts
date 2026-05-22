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

import { formatDurationNumeric } from "./format";

describe("formatDurationNumeric", () => {
  it("formats zero as 0:00", () => {
    expect(formatDurationNumeric(0)).toBe("0:00");
  });

  it("formats sub-minute durations as 0:SS", () => {
    expect(formatDurationNumeric(5000)).toBe("0:05");
    expect(formatDurationNumeric(30000)).toBe("0:30");
    expect(formatDurationNumeric(59000)).toBe("0:59");
  });

  it("formats minute-level durations as M:SS", () => {
    expect(formatDurationNumeric(60000)).toBe("1:00");
    expect(formatDurationNumeric(90000)).toBe("1:30");
    expect(formatDurationNumeric(3599000)).toBe("59:59");
  });

  it("formats hour-level durations as H:MM:SS", () => {
    expect(formatDurationNumeric(3600000)).toBe("1:00:00");
    expect(formatDurationNumeric(3661000)).toBe("1:01:01");
    expect(formatDurationNumeric(7322000)).toBe("2:02:02");
  });

  it("pads minutes and seconds with leading zeros", () => {
    expect(formatDurationNumeric(3600000 + 5000)).toBe("1:00:05");
    expect(formatDurationNumeric(3600000 + 60000 * 9 + 9000)).toBe("1:09:09");
  });

  it("truncates sub-second precision", () => {
    expect(formatDurationNumeric(1500)).toBe("0:01");
    expect(formatDurationNumeric(59999)).toBe("0:59");
  });
});
