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

export function getAvatarInitials(name: string, maxLetters = 2): string {
  const normalized = name
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\p{L}\p{N}\s,.'-]/gu, "");

  if (!normalized) return "";

  const commaParts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const reordered =
    commaParts.length >= 2 ? `${commaParts[1]} ${commaParts[0]}` : normalized;

  const parts = reordered
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, maxLetters).toUpperCase();
  }

  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.slice(0, maxLetters).toUpperCase() || "?";
}
