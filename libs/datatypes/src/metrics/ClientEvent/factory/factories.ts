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

import { nullable } from "~fixture-generator";

import {
  TREATMENT_REFERRAL_DESCRIPTIONS,
  VIOLATION_CODES,
  VIOLATION_RESPONSE_DESCRIPTIONS,
} from "./constants";

export const randViolationCodeForUsMi = () =>
  faker.helpers.arrayElement(VIOLATION_CODES);
export const randViolationResponse = () =>
  faker.helpers.arrayElement(VIOLATION_RESPONSE_DESCRIPTIONS);
export const randTreatmentReferral = () =>
  faker.helpers.arrayElement(TREATMENT_REFERRAL_DESCRIPTIONS);

export const randClientEventCodeAndDescription = (
  metricId: string,
  stateCode = "US_XX",
) => {
  let code,
    description = undefined;
  switch (stateCode) {
    case "US_MI":
      code = randViolationCodeForUsMi();
      if (metricId === "violation_responses")
        description = randViolationResponse();
      else if (metricId === "treatment_referrals")
        description = randTreatmentReferral();
      else description = faker.lorem.sentence();
      break;
    default:
      code = nullable(() => faker.string.alpha({ length: 5, casing: "upper" }));
      description = nullable(() => faker.lorem.sentence());
      break;
  }
  return {
    code,
    description,
  };
};
