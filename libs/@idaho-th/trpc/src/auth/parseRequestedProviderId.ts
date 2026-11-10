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
 * Transport layer of the active-organization check: turns the raw header into a
 * *requested* organization id and nothing more.
 *
 * No database work and no trust decision happen here — the value is untrusted
 * until the provider middleware resolves it against the caller's assignments
 * (see the `providerProcedure` middleware in `init.ts`).
 *
 * A header sent more than once arrives as an array. That is ambiguous rather
 * than assignable, so it is treated as absent; resolution then falls back to
 * the caller's own preference or single assignment, both of which are verified.
 */
export function parseRequestedProviderId(
  rawHeader: string | string[] | undefined,
): string | undefined {
  if (typeof rawHeader !== "string") return undefined;

  const trimmed = rawHeader.trim();
  return trimmed === "" ? undefined : trimmed;
}
