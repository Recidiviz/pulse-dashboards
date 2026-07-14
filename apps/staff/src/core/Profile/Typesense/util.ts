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

import { TypesenseFetchError } from "../../../RootStore/TypesenseStore";

export function envLabel(host: string): string {
  if (host.includes("localhost")) return "Offline Mode";
  if (host.includes("staging")) return "Staging";
  return "Production";
}

export function formatError(error: Error): string {
  return error instanceof TypesenseFetchError
    ? `${error.endpoint} failed (${error.status}): ${error.message}`
    : error.message;
}

export function formatDurationMs(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
