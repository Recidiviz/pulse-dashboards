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
 * States whose meetings are never sent to LangSmith. The LLM calls for these
 * states still run; only the traces are skipped.
 */
const STATES_WITHOUT_TRACING: ReadonlySet<string> = new Set(["US_CO"]);

/**
 * Returns whether LLM calls for stateCode may be traced in LangSmith.
 *
 * Every traced function on a path needs this check, not only the root one: in
 * langsmith 0.3.x a traceable called under a parent with tracing turned off
 * starts a new root trace of its own rather than inheriting the setting.
 */
export function isTracingEnabledForState(stateCode: string): boolean {
  return !STATES_WITHOUT_TRACING.has(stateCode);
}
