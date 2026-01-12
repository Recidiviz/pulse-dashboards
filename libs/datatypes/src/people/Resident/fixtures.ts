// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { rawUsAzResidents, usAzResidents } from "./US_AZ/fixtures";
import { rawUsCoResidents, usCoResidents } from "./US_CO/fixtures";
import { rawUsIdResidents, usIdResidents } from "./US_ID/fixtures";
import { rawUsMaResidents, usMaResidents } from "./US_MA/fixtures";
import { rawUsMeResidents, usMeResidents } from "./US_ME/fixtures";
import { rawUsNcResidents, usNcResidents } from "./US_NC/fixtures";
import { rawUsNeResidents, usNeResidents } from "./US_NE/fixtures";
import { rawUsTnResidents, usTnResidents } from "./US_TN/fixtures";

// re-exporting state fixtures for convenience
export {
  rawUsCoResidents,
  rawUsMaResidents,
  rawUsMeResidents,
  usCoResidents,
  usMaResidents,
  usMeResidents,
};

export const allResidents = [
  ...usAzResidents,
  ...usCoResidents,
  ...usIdResidents,
  ...usMaResidents,
  ...usMeResidents,
  ...usNcResidents,
  ...usNeResidents,
  ...usTnResidents,
];

export const rawAllResidents = [
  ...rawUsAzResidents,
  ...rawUsCoResidents,
  ...rawUsIdResidents,
  ...rawUsMaResidents,
  ...rawUsMeResidents,
  ...rawUsNcResidents,
  ...rawUsNeResidents,
  ...rawUsTnResidents,
];
