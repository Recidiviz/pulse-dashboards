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

import type {
  HousingApplicationExtractedData,
  HousingApplicationPageExtractedData,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";

export function mergeHousingPartials(
  parts: ReadonlyArray<HousingApplicationPageExtractedData>,
): HousingApplicationExtractedData {
  const merged: Record<string, unknown> = {};

  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      const existing = merged[key];
      if (
        existing &&
        value &&
        typeof existing === "object" &&
        typeof value === "object" &&
        !Array.isArray(existing) &&
        !Array.isArray(value)
      ) {
        const existingObject = existing as Record<string, unknown>;
        const valueObject = value as Record<string, unknown>;
        const mergedObject = { ...existingObject, ...valueObject };
        if (
          key === "clientIdentity" &&
          valueObject["idocNumber"] === null &&
          existingObject["idocNumber"] != null
        ) {
          mergedObject["idocNumber"] = existingObject["idocNumber"];
        }
        merged[key] = mergedObject;
      } else {
        merged[key] = value;
      }
    }
  }

  return merged as unknown as HousingApplicationExtractedData;
}
