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

import { RawResidentCommon, ResidentCommon } from "./residentCommonSchema";
import { rawUsArResidentCommon, usArResidentCommon } from "./US_AR/fixtures";
import { rawUsAzResidentCommon, usAzResidentCommon } from "./US_AZ/fixtures";
import { rawUsCoResidentCommon, usCoResidentCommon } from "./US_CO/fixtures";
import { rawUsIdResidentCommon, usIdResidentCommon } from "./US_ID/fixtures";
import { rawUsMaResidentCommon, usMaResidentCommon } from "./US_MA/fixtures";
import { rawUsMeResidentCommon, usMeResidentCommon } from "./US_ME/fixtures";
import { rawUsNcResidentCommon, usNcResidentCommon } from "./US_NC/fixtures";
import { rawUsNdResidentCommon, usNdResidentCommon } from "./US_ND/fixtures";
import { rawUsNeResidentCommon, usNeResidentCommon } from "./US_NE/fixtures";
import { rawUsTnResidentCommon, usTnResidentCommon } from "./US_TN/fixtures";

export const allResidentCommon: ResidentCommon[] = [
  ...usArResidentCommon,
  ...usAzResidentCommon,
  ...usCoResidentCommon,
  ...usIdResidentCommon,
  ...usMaResidentCommon,
  ...usMeResidentCommon,
  ...usNcResidentCommon,
  ...usNdResidentCommon,
  ...usNeResidentCommon,
  ...usTnResidentCommon,
];

export const rawAllResidentCommon: RawResidentCommon[] = [
  ...rawUsArResidentCommon,
  ...rawUsAzResidentCommon,
  ...rawUsCoResidentCommon,
  ...rawUsIdResidentCommon,
  ...rawUsMaResidentCommon,
  ...rawUsMeResidentCommon,
  ...rawUsNcResidentCommon,
  ...rawUsNdResidentCommon,
  ...rawUsNeResidentCommon,
  ...rawUsTnResidentCommon,
];
