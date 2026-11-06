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

const LOCALHOST_ORIGIN = /^https?:\/\/localhost(:\d+)?$/;

// Turns one CORS_ORIGINS entry into what @fastify/cors matches against: the
// origin itself, or an anchored RegExp when it holds a "*" hostname label.
function originMatcher(entry: string): string | RegExp {
  if (!entry.includes("*")) return entry;
  const escaped = entry.replace(/[.+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, "[A-Za-z0-9-]+")}$`);
}

/**
 * Returns the browser origins jii-server answers cross-origin requests from.
 *
 * CORS_ORIGINS lists them comma separated. An entry is an exact origin, or a
 * pattern with one "*" standing for a hostname label, for example:
 *
 *   https://opportunities.app,https://recidiviz-dashboard-stag-e1108--*.web.app
 *
 * The Opportunities frontend calls the API from its own origin and needs no
 * entry; the list is for the staff dashboard, its preview channels, and the
 * Meetings app. Staging and production must set the variable. Elsewhere, an
 * unset variable allows any localhost origin so a local frontend can talk to a
 * local server.
 */
export function corsOriginsFromEnv(): (string | RegExp)[] {
  const entries = (process.env["CORS_ORIGINS"] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length > 0) {
    return entries.map(originMatcher);
  }

  const deployEnv = process.env["DEPLOY_ENV"];
  if (deployEnv === "staging" || deployEnv === "production") {
    throw new Error(`CORS_ORIGINS must be set when DEPLOY_ENV is ${deployEnv}`);
  }
  return [LOCALHOST_ORIGIN];
}
