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

import { faker } from "@faker-js/faker";
import { range } from "d3-array";

import { FIXTURE_SEED_DEFAULT } from "~fixture-generator";

import { fullNameFactory } from "../../utils/factories";
import {
  RawResidentRecord,
  ResidentRecord,
  residentRecordSchema,
} from "../schema";
import { rawUsMaResidentMetadataFixtures } from "./metadata/fixtures";
import { RawUsMaResidentMetadata } from "./metadata/schema";

faker.seed(FIXTURE_SEED_DEFAULT);

export const rawUsMaResidents: Array<
  RawResidentRecord & { metadata: RawUsMaResidentMetadata }
> = range(4).map((i) => {
  const resId = `RES${String(i + 1).padStart(3, "0")}`;
  return {
    stateCode: "US_MA",
    personExternalId: resId,
    displayId: resId,
    gender: "MALE",
    personName: fullNameFactory("male").build(),
    pseudonymizedId: `anon${resId.toLowerCase()}`,
    facilityId: "DEMO FACILITY",
    metadata: rawUsMaResidentMetadataFixtures[i],
    recordId: `us_ma_${resId}`,
    allEligibleOpportunities: [],
  };
});

export const usMaResidents: Array<ResidentRecord> = rawUsMaResidents.map((r) =>
  residentRecordSchema.parse(r),
);
