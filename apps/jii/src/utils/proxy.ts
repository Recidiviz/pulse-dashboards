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

import { isEdovoSubdomain } from "./edovo";

/**
 * Returns a string specifying a custom hostname if one is required based
 * on current environment and configuration; if undefined callers should fall back
 * to default hosts for external service calls
 */
export function proxyHost(): string | undefined {
  if (isEdovoSubdomain()) {
    return import.meta.env["VITE_EDOVO_REVERSE_PROXY_HOST"];
  }
  return import.meta.env["VITE_REVERSE_PROXY_HOST"];
}
