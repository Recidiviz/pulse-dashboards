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

/**
 * Validates a `backTarget` query-param value, rejecting anything that isn't
 * an internal path — used to prevent malformed/malicious URLs from being
 * used, both for navigating there and for forwarding it to further pages.
 */
export function sanitizeBackTarget(value: string | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
