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

import type {
  EligibilityParams,
  ProviderCore,
  ProviderLocationCore,
} from "~@idaho-th/shared";

export type { EligibilityParams };

export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type HousingProvider = ProviderCore & { isPreferred?: boolean };
export type HousingProviderLocation = ProviderLocationCore;

export type EligibleProviderMatch = {
  provider: HousingProvider;
  location: HousingProviderLocation;
};

export type Criterion = (
  params: EligibilityParams,
  loc: HousingProviderLocation,
) => boolean;

export type BooleanParamKey = KeysOfType<EligibilityParams, boolean | null>;

export type BooleanLocKey = KeysOfType<HousingProviderLocation, boolean>;
