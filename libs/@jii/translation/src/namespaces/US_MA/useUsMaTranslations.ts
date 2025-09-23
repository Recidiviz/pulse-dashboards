// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { TFunctionSignature } from "i18next";
import { useTranslation } from "react-i18next";

export function useUsMaTranslations() {
  return useTranslation("US_MA");
}

/**
 * The shape of the object that can be traversed and returned
 * by the selector function in the US_MA namespace
 */
export type UsMaTranslationsObject = Parameters<
  Parameters<TFunctionSignature<"US_MA">>["0"]
>["0"];

export type UsMaTFunction = ReturnType<typeof useUsMaTranslations>["t"];
