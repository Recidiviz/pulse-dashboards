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

import type { useHousingApplicationForm } from "../hooks/useHousingApplicationForm/useHousingApplicationForm";

type FormContextValue = ReturnType<typeof useHousingApplicationForm>;

export const FormContext = createContext<FormContextValue | null>(null);

export const FormContextProvider = FormContext.Provider;

export function useFormContext(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx)
    throw new Error(
      "useFormContext must be used within HousingApplicationForm",
    );
  return ctx;
}
