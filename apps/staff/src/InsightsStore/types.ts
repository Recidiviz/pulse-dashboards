// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { PromiseType } from "utility-types";

/**
 * Represents the internal state of a generator function annotated with `mobx.flow`.
 * Supports methods that only yield a single function call (or multiple that
 * all return the same type), since there is currently no way to represent
 * multiple yielded types in order at the type level.
 */
export type FlowMethod<
  FunctionToYield extends (...args: any[]) => Promise<unknown>,
  FlowReturn,
> = Generator<
  ReturnType<FunctionToYield>,
  FlowReturn,
  PromiseType<ReturnType<FunctionToYield>>
>;

export type StringMap2D<Value> = Map<string, Map<string, Value>>;
