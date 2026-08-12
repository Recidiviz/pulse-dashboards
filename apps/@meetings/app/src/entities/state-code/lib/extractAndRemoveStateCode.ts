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

// Extracts the stateCode query param from a URL path string and returns it
// along with the path with stateCode removed. Pure string ops, no web APIs.

export function extractAndRemoveStateCode(path: string): {
  stateCode: string;
  cleanPath: string;
} {
  const queryParamIndex = path.indexOf("?");
  if (queryParamIndex === -1) return { stateCode: "", cleanPath: path };

  const basePath = path.slice(0, queryParamIndex);
  let stateCode = "";
  const otherPairs = path
    .slice(queryParamIndex + 1)
    .split("&")
    .filter((pair) => {
      if (pair.startsWith("stateCode=")) {
        stateCode = decodeURIComponent(pair.slice("stateCode=".length));
        return false;
      }
      return pair.length > 0;
    });

  const cleanPath =
    otherPairs.length > 0 ? `${basePath}?${otherPairs.join("&")}` : basePath;
  return { stateCode, cleanPath };
}
