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

import { DISTRICT_OPTIONS, IDS_ON_FILE_OPTIONS } from "~@idaho-th/shared";

import { buildVertexExtractionSchemas } from "../vertex.schema";

describe("buildVertexExtractionSchemas", () => {
  it("models signature as a boolean and closed-list multi-selects as enum arrays", () => {
    const { responseSchema } = buildVertexExtractionSchemas(["Hope Housing"]);

    expect(
      responseSchema.properties?.["signature"]?.properties?.[
        "signatureProvided"
      ]?.type,
    ).toBe("boolean");

    const preferredDistrict =
      responseSchema.properties?.["housingPreferences"]?.properties?.[
        "preferredDistrict"
      ];
    expect(preferredDistrict?.type).toBe("array");
    expect(preferredDistrict?.items?.enum).toEqual([...DISTRICT_OPTIONS]);

    const preferredProviders =
      responseSchema.properties?.["housingPreferences"]?.properties?.[
        "preferredProviders"
      ];
    expect(preferredProviders?.type).toBe("array");
    expect(preferredProviders?.items?.enum).toContain("Hope Housing");

    const idsOnFile =
      responseSchema.properties?.["identification"]?.properties?.["idsOnFile"];
    expect(idsOnFile?.type).toBe("array");
    expect(idsOnFile?.items?.enum).toEqual([...IDS_ON_FILE_OPTIONS]);
  });
});
