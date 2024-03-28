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

import type { ParsedRecord } from "../../utils/types";

/**
 * Criteria are overlapping objects; keyof Ineligible is presumed to be a subset of
 * keyof Eligible, but the value of overlapping keys may differ, in which case
 * they will be unioned.
 */
export type MergedCriteria<Eligible, Ineligible> = {
  [EK in keyof Eligible]:
    | Eligible[EK]
    | (EK extends keyof Ineligible ? Ineligible[EK] : never);
};

/**
 * Standard format for bundling together multiple fixtures of the same type,
 * e.g. to simulate and label different testable conditions.
 * FixtureType can be any ParsedRecord by default, which is convenient for using
 * this type in other generics but should be overridden when creating actual mapping objects.
 */
export type FixtureMapping<FixtureType extends ParsedRecord = ParsedRecord> =
  Record<string, FixtureType>;
