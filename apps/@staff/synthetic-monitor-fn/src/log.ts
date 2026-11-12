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

// Step-by-step breadcrumbs, emitted to stdout (→ Cloud Logging) only when the
// VERBOSE env var is truthy. Useful for pinpointing where a run fails/crashes
// in the deployed function without leaving noisy logs on by default.

export function isVerbose(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env["VERBOSE"]?.toLowerCase();
  return value === "true" || value === "1";
}

// TRACE is a heavier level than VERBOSE: it records a full HAR (network trace) of
// each run and uploads it to the screenshots bucket on failure, for diagnosing
// slow/hung requests that don't surface as outright failures. Enable per-env when
// hunting a network/timing flake; leave off in steady state.
export function isTrace(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env["TRACE"]?.toLowerCase();
  return value === "true" || value === "1";
}

export function log(message: string): void {
  if (isVerbose()) {
    console.info(`[monitor] ${message}`);
  }
}
