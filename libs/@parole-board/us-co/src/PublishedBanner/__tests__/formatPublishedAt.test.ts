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

import { formatPublishedAt } from "../formatPublishedAt";

const DENVER = "America/Denver";

describe("formatPublishedAt", () => {
  it("formats the date and time in the design's style", () => {
    expect(formatPublishedAt(new Date("2026-10-09T18:27:00Z"), DENVER)).toBe(
      "Oct 9, 2026 at 12:27 PM",
    );
  });

  it("uses the Denver date for an evening publish that is already tomorrow in UTC", () => {
    expect(formatPublishedAt(new Date("2026-10-10T03:05:00Z"), DENVER)).toBe(
      "Oct 9, 2026 at 9:05 PM",
    );
  });

  it("applies daylight saving time (UTC-6) in summer", () => {
    expect(formatPublishedAt(new Date("2026-07-01T15:00:00Z"), DENVER)).toBe(
      "Jul 1, 2026 at 9:00 AM",
    );
  });

  it("applies standard time (UTC-7) in winter", () => {
    expect(formatPublishedAt(new Date("2026-12-01T15:00:00Z"), DENVER)).toBe(
      "Dec 1, 2026 at 8:00 AM",
    );
  });

  it("uses only plain spaces", () => {
    expect(
      formatPublishedAt(new Date("2026-10-09T18:27:00Z"), DENVER),
    ).not.toMatch(/[^\S ]/);
  });
});
