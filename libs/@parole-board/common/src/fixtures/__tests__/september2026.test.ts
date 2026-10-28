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

import { september2026 } from "../september2026";

describe("september2026", () => {
  const hearings = september2026.entries.filter((e) => e.kind === "HEARING");

  test("has 37 hearings on 13 days", () => {
    expect(hearings).toHaveLength(37);
    expect(new Set(hearings.map((e) => e.date)).size).toBe(13);
  });

  test("has Full Board on every Friday and a Business Meeting on the 25th", () => {
    const meetings = september2026.entries
      .filter((e) => e.kind !== "HEARING")
      .map((e) => `${e.date} ${e.label}`);
    expect(meetings).toEqual([
      "2026-09-04 Full Board",
      "2026-09-11 Full Board",
      "2026-09-18 Full Board",
      "2026-09-25 Full Board",
      "2026-09-25 Business Meeting",
    ]);
  });

  test("has unique ids", () => {
    const ids = september2026.entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("cancels only the Full Board meeting on the 11th in the cancelled variant", () => {
    const cancelled = september2026.entriesWithCancelledMeeting.filter(
      (e) => e.cancelled,
    );
    expect(cancelled).toEqual([
      expect.objectContaining({ date: "2026-09-11", kind: "FULL_BOARD" }),
    ]);
  });
});
