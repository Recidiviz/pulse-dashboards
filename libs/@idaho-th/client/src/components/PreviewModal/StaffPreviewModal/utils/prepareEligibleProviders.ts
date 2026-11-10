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

import { generateLabels } from "~@idaho-th/client/utils/labelGenerator";
import {
  type EligibilityParams,
  normalizeEligibilityParams,
} from "~@idaho-th/shared";

import {
  EligibleHousingProviderRow,
  HousingProvider,
} from "../../../../interfaces/common";

export { normalizeEligibilityParams as normalizeParams };

export function toHousingProvider(
  row: EligibleHousingProviderRow,
): HousingProvider {
  return {
    id: row.provider.id,
    name: row.provider.name,
    contact: row.provider.contact,
    providerLocation: row.providerLocation,
    isSelected: row.isSelected,
  };
}

export function prepareEligibleProviders(
  eligibleRows: EligibleHousingProviderRow[],
  eligibilityParams: EligibilityParams,
): HousingProvider[] {
  const normalizedParams = normalizeEligibilityParams(eligibilityParams);
  return eligibleRows
    .map((row) => {
      const provider = toHousingProvider(row);
      const labels = generateLabels(
        provider.providerLocation,
        normalizedParams,
      );
      const isPreferred = eligibilityParams.preferredProviders.includes(
        provider.id,
      );
      return { ...provider, labels, isPreferred };
    })
    .sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred));
}
