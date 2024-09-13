/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { Factory } from "factory.ts";
import { ZodSchema } from "zod";

/**
 * Base configuration for a factory that can be used to generate fixtures.
 */
export type FixtureFactoryConfig<
  F extends Factory<unknown> = Factory<unknown>,
> = {
  // NOTE: Will be used in subsequent PRs
  factory: ((...args: any[]) => F) | F;
  defaultCount: number;
  schema: ZodSchema;
};

/**
 * The expected output type of a factory within the configuration.
 */
export type FixtureFactoryConfigOutput<C extends FixtureFactoryConfig> =
  C["schema"]["_output"];
