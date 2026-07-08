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

import { group } from "d3-array";

import { rawAllResidentCommon } from "~datatypes";

import { processedResidentSchema } from "../../models";
import { getEnabledStateCodes } from "../../utils/getEnabledStateCodes";
import { rawResidentStateDataFixtures } from "./residentStateData";

const rawResidentCommonByState = group(
  rawAllResidentCommon,
  (r) => r.stateCode,
);

export const residentFixtures = Object.fromEntries(
  getEnabledStateCodes().map((code) => [
    code,
    (rawResidentCommonByState.get(code) ?? []).map((r, i) =>
      processedResidentSchema.parse({
        ...r,
        stateSpecificData: rawResidentStateDataFixtures.get(code)?.[i],
      }),
    ),
  ]),
);
