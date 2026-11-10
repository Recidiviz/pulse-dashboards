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

import { describe, expect, it } from "vitest";

import { type GaeVersion, versionsToDelete } from "./gae-cleanup.mts";

const version = (
  id: string,
  createTime: string,
  traffic_split = 0,
): GaeVersion => ({ id, traffic_split, version: { createTime } });

describe("versionsToDelete", () => {
  it("keeps the live version and the newest two idle versions", () => {
    const versions = [
      version("v1-10-0", "2026-08-01T00:00:00Z"),
      version("v1-13-0", "2026-11-01T00:00:00Z", 1),
      version("v1-12-0", "2026-10-01T00:00:00Z"),
      version("v1-11-0", "2026-09-01T00:00:00Z"),
      version("v1-9-0", "2026-07-01T00:00:00Z"),
    ];

    expect(versionsToDelete(versions)).toEqual(["v1-10-0", "v1-9-0"]);
  });

  it("never deletes a version that serves part of the traffic", () => {
    const versions = [
      version("new", "2026-11-01T00:00:00Z", 0.5),
      version("old", "2026-01-01T00:00:00Z", 0.5),
    ];

    expect(versionsToDelete(versions, 0)).toEqual([]);
  });

  it("deletes nothing when there are no more idle versions than it keeps", () => {
    const versions = [
      version("live", "2026-11-01T00:00:00Z", 1),
      version("previous", "2026-10-01T00:00:00Z"),
    ];

    expect(versionsToDelete(versions)).toEqual([]);
  });
});
