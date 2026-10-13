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

import { createI18nInstance, UsMaTFunction } from "~@jii/translation";

import { ResourceSummary } from "../types";

/** Loads the real US_MA English copy and returns a t function for it. */
export async function loadUsMaTranslations(): Promise<UsMaTFunction> {
  const i18n = createI18nInstance([]);
  await i18n.changeLanguage("en");
  await i18n.loadNamespaces("US_MA");
  return i18n.getFixedT("en", "US_MA") as unknown as UsMaTFunction;
}

export function makeResource(
  organizationId: number,
  overrides: Partial<ResourceSummary> = {},
): ResourceSummary {
  return {
    organizationId,
    name: `Resource ${organizationId}`,
    categories: [{ category: "Housing", subcategory: "Sober house" }],
    tags: [],
    ...overrides,
  };
}
