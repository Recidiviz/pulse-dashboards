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

export type DatabaseTarget =
  | "local-test"
  | "local-dev"
  | "staging-proxy"
  | "deployed";

/**
 * Encapsulates logic about which database to connect to, because there are several options
 * triggered by various environment configs, in local or shared environments (staging and prod)
 */
export function resolveDatabaseTarget(): DatabaseTarget {
  const NODE_ENV = process.env["NODE_ENV"] ?? "";

  switch (NODE_ENV) {
    case "test":
      return "local-test";
    case "development":
      if (process.env["USE_STAGING_DB"] === "true") {
        return "staging-proxy";
      }
      return "local-dev";
    // otherwise assume we're in a deployment
    default:
      return "deployed";
  }
}

/**
 * Convenience method on top of {@link resolveDatabaseTarget} for separating real shared database targets
 * from disposable local/test ones, whose allowed uses may be less restrictive (e.g. destructive fixture seeding)
 */
export function isRealDatabaseEnvironment() {
  const target = resolveDatabaseTarget();
  if (target === "local-test" || target === "local-dev") return false;
  // default to true, since shared environments are assumed to be more restricted
  return true;
}
