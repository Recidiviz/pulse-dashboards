// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { createContext, useContext } from "react";

export interface CheckboxGroupContextValue {
  /** Currently selected values. */
  value: string[];
  /** Toggle a single value in/out of the selection. */
  toggleValue: (value: string) => void;
  disabled?: boolean;
}

export const CheckboxGroupContext =
  createContext<CheckboxGroupContextValue | null>(null);

export const useCheckboxGroupContext = (): CheckboxGroupContextValue => {
  const ctx = useContext(CheckboxGroupContext);
  if (!ctx) {
    throw new Error("Checkbox must be rendered inside a <CheckboxGroup>");
  }
  return ctx;
};
