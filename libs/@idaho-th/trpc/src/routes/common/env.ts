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

export function getRequiredEnv<K extends string>(
  key: K,
  opts?: { label?: string },
): string {
  const value = process.env[key];
  if (!value) {
    const label = opts?.label ?? "env";
    throw new Error(`Missing required ${label} key: ${key}`);
  }
  return value;
}

export function getOptionalEnv<K extends string>(
  key: K,
  opts?: { defaultValue?: string; label?: string },
): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === null || value === "") {
    return opts?.defaultValue;
  }
  return value;
}

/**
 * Reads an optional env var as a positive integer, returning `fallback` when it
 * is unset, non-numeric, or not strictly positive.
 */
export function getOptionalPositiveIntEnv<K extends string>(
  key: K,
  fallback: number,
): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveRequiredEnv<const Keys extends readonly string[]>(
  requiredKeys: Keys,
  opts?: { label?: string },
): Record<Keys[number], string> {
  const label = opts?.label ?? "env";
  const missing = requiredKeys.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`${label} config missing env vars: ${missing.join(", ")}`);
  }

  return Object.fromEntries(
    requiredKeys.map((k) => [k, process.env[k]]),
  ) as Record<Keys[number], string>;
}
