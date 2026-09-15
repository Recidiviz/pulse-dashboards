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

import { PATHWAYS_SECTIONS } from "~shared-pathways";

/**
 * Sections that draw one card per value of a second dimension, and the
 * dimension they split on. The design breaks admission and release types out
 * by custody status, giving one chart for incarcerated individuals and another
 * for incarcerated parolees.
 *
 * A section absent from this map draws a single chart.
 */
export const CARD_SPLIT_DIMENSION_BY_SECTION: Readonly<Record<string, string>> =
  {
    [PATHWAYS_SECTIONS["countByAdmissionType"]]: "custodyStatus",
    [PATHWAYS_SECTIONS["countByReleaseType"]]: "custodyStatus",
  };
