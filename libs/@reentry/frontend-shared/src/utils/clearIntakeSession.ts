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
 * Clears all sessionStorage keys associated with an active intake session.
 * Call this before navigating away from the intake (end chat, guardrail hard stop, etc.)
 * to prevent the session from being re-established on the next page load.
 */
export function clearIntakeSession(): void {
  sessionStorage.removeItem("intake_token");
  sessionStorage.removeItem("preIntakeStep");
  sessionStorage.removeItem("client_pseudo_id");
  sessionStorage.removeItem("conversationStarted");
}
