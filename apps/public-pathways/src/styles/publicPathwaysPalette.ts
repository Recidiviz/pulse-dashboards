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

import { rgba } from "polished";

import { palette } from "~design-system";

const nyBlue = "rgba(21, 73, 115, 1)";

export const publicPathwaysPalette = {
  ...palette,
  signal: {
    ...palette.signal,
    links: "rgba(0, 77, 209, 1)",
    alert: "rgba(255, 227, 150, 1)",
    error: "rgba(179, 46, 49, 1)",
  },
  data: {
    ...palette.data,
    indigo1: nyBlue,
    indigo10: rgba(nyBlue, 0.1),
  },
  focusColor: nyBlue,
};
