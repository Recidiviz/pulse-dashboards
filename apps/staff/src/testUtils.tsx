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

import { autorun } from "mobx";
import { SafeParseReturnType, ZodError, ZodFormattedError } from "zod";

/**
 * Convenience method to run an immediate, one-time reactive effect
 */
export function reactImmediately(effect: () => void): void {
  // this will call the effect function immediately,
  // and then immediately call the disposer to tear down the reaction
  autorun(effect)();
}

export * from "@testing-library/react";

export function getParseError<Input, Output>(
  result: SafeParseReturnType<Input, Output>,
): ZodError<Input> {
  if (result.success) {
    throw new Error(
      "expected Zod parse failure, but received successful parse result",
    );
  }

  return result.error;
}

export function getParseErrorFormatted<Input, Output>(
  result: SafeParseReturnType<Input, Output>,
): ZodFormattedError<Input> {
  return getParseError(result).format();
}
