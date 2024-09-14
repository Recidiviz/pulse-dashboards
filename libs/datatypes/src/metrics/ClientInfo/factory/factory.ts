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
  randJiiBirthdate,
  randJiiGender,
  randJiiRace,
  randPseudonymizedId,
} from "../../../people/utils/factories";
import { RawClientInfo } from "../schema";

const { person } = faker;

export const rawClientInfoFactory = (): Factory<RawClientInfo> =>
  makeFactory(() => {
    const clientId = randPseudonymizedId();
    const fullName = fullNameFactory(person.sexType()).build();
    return {
      clientName: fullName,
      clientId,
      pseudonymizedClientId: clientId,
      raceOrEthnicity: nullable(() => randJiiRace()),
      gender: randJiiGender(),
      birthdate: nullable(() => randJiiBirthdate().toISOString()),
    } as RawClientInfo;
  });
