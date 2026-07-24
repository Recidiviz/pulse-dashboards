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

const CHANNEL_PATTERN = /^pr-\d+$/;
// Matches "<scheme>://pr-preview" with optional trailing slash and query string.
const LINK_PATTERN = /^[a-z][a-z0-9.+-]*:\/\/pr-preview\/?(?:\?(.*))?$/i;

// Parses a `<scheme>://pr-preview?channel=pr-<number>` deep link and returns
// the channel, or null if the URL isn't a valid PR preview link.
export function parsePrPreviewLink(url: string): string | null {
  const match = url.match(LINK_PATTERN);
  if (!match) return null;
  const channel = new URLSearchParams(match[1] ?? "").get("channel");
  return channel && CHANNEL_PATTERN.test(channel) ? channel : null;
}
