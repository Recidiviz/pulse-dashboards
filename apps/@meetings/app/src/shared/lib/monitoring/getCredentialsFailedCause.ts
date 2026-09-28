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

const GET_CREDENTIALS_FAILED = "GetCredentialsFailed";

/**
 * react-native-auth0's web adapter wraps every getCredentials() failure that
 * lacks an OAuth `error` field as `GetCredentialsFailed`, keeping the original
 * error in `json`. The wrapper's name and stack are identical for every cause,
 * so Sentry merges unrelated failures (e.g. an IndexedDB `InvalidStateError`
 * and a network `TypeError`) into one group. Returns the underlying error's
 * name so they can be fingerprinted apart.
 */
export function getCredentialsFailedCause(error: unknown) {
  if (!(error instanceof Error) || error.name !== GET_CREDENTIALS_FAILED) {
    return undefined;
  }
  const { json } = error as { json?: unknown };
  if (typeof json !== "object" || json === null) {
    return undefined;
  }
  const { name } = json as { name?: unknown };
  return typeof name === "string" && name ? name : undefined;
}
