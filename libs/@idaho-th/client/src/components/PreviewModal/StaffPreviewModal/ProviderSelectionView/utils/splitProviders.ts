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

import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

export interface SplitProviders {
  selected: HousingProvider[];
  suggestions: HousingProvider[];
}

export function splitProviders(
  prepared: HousingProvider[],
  sentProviderIds: Set<string>,
): SplitProviders {
  const selected: HousingProvider[] = [];
  const suggestions: HousingProvider[] = [];
  for (const provider of prepared) {
    if (sentProviderIds.has(provider.id)) continue;
    if (provider.isSelected === true) {
      selected.push(provider);
    } else {
      suggestions.push(provider);
    }
  }
  return { selected, suggestions };
}
