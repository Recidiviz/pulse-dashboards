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

import { faker } from "@faker-js/faker";
import { Factory, makeFactory } from "factory.ts";

import { nullable } from "~fixture-generator";

import {
  fullNameFactory,
  randDistrict,
  randId,
  randPseudonymizedId,
  randStaffEmail,
} from "../../../../../utils/factories";
import { RawSupervisionOfficerSupervisor } from "../schema";

const { person, datatype } = faker;

export const rawSupervisionOfficerSupervisorFactory = (
  stateCode = "US_XX",
): Factory<RawSupervisionOfficerSupervisor> =>
  makeFactory(() => {
    const fullName = fullNameFactory(person.sexType()).build();
    return {
      externalId: randId(),
      pseudonymizedId: randPseudonymizedId(),
      supervisionDistrict: nullable(() => randDistrict()),
      email: nullable(() =>
        randStaffEmail(stateCode, {
          firstName: fullName.givenNames,
          lastName: fullName.surname,
        }),
      ),
      fullName,
      hasOutliers: datatype.boolean(0.75),
    } as RawSupervisionOfficerSupervisor;
  });
