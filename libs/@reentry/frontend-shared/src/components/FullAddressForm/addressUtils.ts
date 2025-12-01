// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { getStateCode } from "./StateSelector";

export const parseAddressSuggestion = (description: string) => {
  const parts = description.split(", ");
  let parsedCity = "";
  let parsedState = "";
  let streetAddress = "";

  if (parts.length >= 3) {
    // Last part is usually country
    parsedState = getStateCode(parts[parts.length - 2]);
    parsedCity = parts[parts.length - 3];
    streetAddress = parts.slice(0, -3).join(", ");
  } else if (parts.length === 2) {
    parsedState = getStateCode(parts[parts.length - 1]);
    parsedCity = parts[0];
  }

  return {
    streetAddress,
    parsedCity,
    parsedState,
  };
};
