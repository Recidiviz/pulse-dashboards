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

import { components } from "~@reentry/openapi-types";

export type ClientAddress = components["schemas"]["ClientAddressResponse"];

export const formatAddress = (
  address: ClientAddress | null | undefined,
): string | null => {
  if (!address) return null;
  const parts: string[] = [];
  if (address.street_address?.trim()) parts.push(address.street_address.trim());
  if (address.city?.trim()) parts.push(address.city.trim());
  if (address.state?.trim()) parts.push(address.state.trim());
  return parts.length > 0 ? parts.join(", ") : null;
};
