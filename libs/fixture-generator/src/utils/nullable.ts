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

/**
 * This takes a function and a null probability and returns a function that \
 * returns either the input function or null.
 * @param builder the builder function returning `T`
 * @param nullProbability the probability that the function returns null\
 * defaults to null. See https://fakerjs.dev/guide/usage.html#weighted-array-element for\
 * how the probability is applied.
 * @returns 
 */
export const nullable = <T>(builder: () => T, nullProbability = 1): T | null =>
  faker.helpers.weightedArrayElement([
    { weight: nullProbability, value: null },
    { weight: 10 - nullProbability, value: builder() },
  ]);
