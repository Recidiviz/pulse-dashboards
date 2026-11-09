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

import { newPhiRowId } from "../newPhiRowId";
import { resolvePastActions } from "../pastActions";

const idAt = (time: Date) => {
  vi.setSystemTime(time);
  return newPhiRowId();
};

describe("newPhiRowId", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is phi_, then the time in milliseconds, then a random suffix", () => {
    expect(idAt(new Date("2026-11-05T15:00:00Z"))).toMatch(
      /^phi_1793890800000_[0-9a-f]{8}$/,
    );
  });

  it("gives rows added in the same millisecond different ids", () => {
    const time = new Date("2026-11-05T15:00:00Z");

    expect(idAt(time)).not.toBe(idAt(time));
  });

  it("keeps undated rows in the order the PHI added them, even when the time gains a digit", () => {
    const ids = [
      idAt(new Date(999)),
      idAt(new Date(1000)),
      idAt(new Date("2026-11-05T15:00:00Z")),
      idAt(new Date("2026-11-05T15:00:00.001Z")),
    ];
    const rows = Object.fromEntries(
      [...ids].reverse().map((id) => [id, { source: "PHI" as const }]),
    );

    expect(resolvePastActions({ rows }).rows.map((row) => row.id)).toEqual(ids);
  });
});
