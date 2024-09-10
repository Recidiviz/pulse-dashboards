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

import { keyBy } from "lodash";
import { z } from "zod";

import { StateCode, StateConfig } from "./types";

/**
 * This is the source of truth for valid, enabled state codes in the application
 */
export const stateCodes = z.enum(["US_ME"]);

/**
 * Given all state codes in tuple form, expects a corresponding tuple of config objects
 */
type StateConfigArray<StateCodeList> = StateCodeList extends [
  infer First extends StateCode,
  ...infer Rest,
]
  ? [StateConfig<First>, ...StateConfigArray<Rest>]
  : [];

/**
 * Exhaustive list of {@link StateConfig} objects for all supported states
 */
export const stateConfigs: StateConfigArray<typeof stateCodes.options> = [
  { stateCode: "US_ME", displayName: "Maine", urlSlug: "maine" },
];

/**
 * Exhaustive mapping of {@link StateConfig} objects for all supported states
 */
export const stateConfigsByStateCode: {
  [Code in StateCode]: StateConfig<Code>;
} =
  // lodash types broaden keys to string but this should be correct
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyBy(stateConfigs, "stateCode") as any;

/**
 * Exhaustive mapping of {@link StateConfig} objects for all supported states
 */
export const stateConfigsByUrlSlug: Record<
  string,
  StateConfig<StateCode> | undefined
> = keyBy(stateConfigs, "urlSlug");
