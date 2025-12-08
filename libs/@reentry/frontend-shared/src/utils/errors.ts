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

const DEFAULT_ERROR_MESSAGE =
  "Something went wrong. Please try again or reach out to your case worker.";

export function getUserFacingErrorMessage(
  err: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  const detail =
    err && typeof err === "object" && "detail" in err ? err.detail : null;
  if (
    detail &&
    typeof detail === "object" &&
    "user_facing" in detail &&
    "message" in detail &&
    detail.user_facing
  ) {
    return String(detail.message);
  }
  return fallback;
}
