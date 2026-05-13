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

import type { components } from "~@reentry/openapi-types";

import { sortResourcesDigitalFirst } from "../../app/utils/resourceSort";

type Resource = components["schemas"]["Resource"];

function stub(
  name: string,
  resource_type: Resource["resource_type"],
): Resource {
  return {
    id: name,
    resource_id: null,
    name,
    category: "Housing",
    resource_type,
  } as Resource;
}

describe("sortResourcesDigitalFirst", () => {
  it("places DIGITAL resources before COMMUNITY", () => {
    const result = sortResourcesDigitalFirst([
      stub("A", "COMMUNITY"),
      stub("B", "DIGITAL"),
    ]);
    expect(result[0].resource_type).toBe("DIGITAL");
    expect(result[1].resource_type).toBe("COMMUNITY");
  });

  it("preserves relative order among same-type resources", () => {
    const result = sortResourcesDigitalFirst([
      stub("A", "COMMUNITY"),
      stub("B", "COMMUNITY"),
    ]);
    expect(result[0].name).toBe("A");
    expect(result[1].name).toBe("B");
  });

  it("handles an all-DIGITAL list unchanged", () => {
    const result = sortResourcesDigitalFirst([
      stub("A", "DIGITAL"),
      stub("B", "DIGITAL"),
    ]);
    expect(result.every((r) => r.resource_type === "DIGITAL")).toBe(true);
  });

  it("does not mutate the original array", () => {
    const resources = [stub("A", "COMMUNITY"), stub("B", "DIGITAL")];
    sortResourcesDigitalFirst(resources);
    expect(resources[0].name).toBe("A");
  });

  it("returns an empty array unchanged", () => {
    expect(sortResourcesDigitalFirst([])).toEqual([]);
  });
});
