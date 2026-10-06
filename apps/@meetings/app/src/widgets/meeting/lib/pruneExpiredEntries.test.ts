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

import { pruneExpiredEntries } from "./pruneExpiredEntries";

describe("pruneExpiredEntries", () => {
  const NOW = 1_000_000;
  const TTL = 1000;

  it("keeps entries younger than the TTL and drops the rest", () => {
    expect(
      pruneExpiredEntries(
        { fresh: NOW - 10, edge: NOW - TTL + 1, expired: NOW - TTL },
        TTL,
        NOW,
      ),
    ).toEqual({ fresh: NOW - 10, edge: NOW - TTL + 1 });
  });

  it("returns an empty object when everything has expired", () => {
    expect(pruneExpiredEntries({ a: 0, b: 1 }, TTL, NOW)).toEqual({});
  });
});
