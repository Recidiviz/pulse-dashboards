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

export const ACCESS_DENIED = "access_denied";

/**
 * True when an Auth0 post-login Action denied the login (`api.access.deny(...)`),
 * e.g. a Recidiviz user with no state access. Both web and native error shapes
 * expose this on `name`/`code`.
 */
export function isAccessDeniedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { name, code } = error as { name?: unknown; code?: unknown };
  return name === ACCESS_DENIED || code === ACCESS_DENIED;
}
