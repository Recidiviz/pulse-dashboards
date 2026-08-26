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

// Shared helpers for the Typesense scoped-key endpoints.

import type { SingleWorkflowsSystem } from "~@typesense/client";
import type { SystemId } from "~datatypes";

const VALID_SYSTEMS = [
  "SUPERVISION",
  "INCARCERATION",
  "ALL",
] as const satisfies readonly SystemId[];

export function isValidSystem(value: unknown): value is SystemId {
  return (
    typeof value === "string" &&
    (VALID_SYSTEMS as readonly string[]).includes(value)
  );
}

export function invalidSystemMessage(): string {
  return `system must be one of ${VALID_SYSTEMS.join(", ")}`;
}

/**
 * The concrete systems this caller may search, from their route permissions.
 *
 * Deliberately mirrors `WorkflowsStore.userAllowedSystems`, which is how the
 * frontend already decides what a user may see. Note "ALL" is absent from the
 * result: it is not a permission but a page-level aggregate, so it is resolved
 * against this set rather than being granted.
 *
 * Takes resolved metadata rather than the request because offline mode has no
 * `req.user` — see resolveRequestAppMetadata.
 */
export function authorizedSystems(
  appMetadata: Record<string, unknown>,
): SingleWorkflowsSystem[] {
  // `stateCode` is the canonical key — it is what `UserAppMetadata` declares and
  // what the Auth0 post-login actions set for everyone. `state_code` is the
  // legacy duplicate those same actions still write, pending TODO #3170, and is
  // what validateStateCode reads. Accepting both means this check survives that
  // cleanup in either order: missing the key would silently drop the Recidiviz
  // bypass and 403 every internal user.
  const stateCode = appMetadata["stateCode"] ?? appMetadata["state_code"];

  // Recidiviz users hold no route permissions of their own; they may view any
  // tenant, and the scope resolvers already grant them everything within the
  // tenant they are currently looking at.
  if (
    typeof stateCode === "string" &&
    stateCode.toLowerCase() === "recidiviz"
  ) {
    return ["SUPERVISION", "INCARCERATION"];
  }

  const routes = (appMetadata["routes"] ?? {}) as Record<string, unknown>;
  const systems: SingleWorkflowsSystem[] = [];
  // `tasks` implies supervision, matching WorkflowsStore's `canUserAccessTasks`
  // branch.
  if (routes["workflowsSupervision"] || routes["tasks"]) {
    systems.push("SUPERVISION");
  }
  if (routes["workflowsFacilities"]) {
    systems.push("INCARCERATION");
  }
  return systems;
}

/**
 * Narrows a requested system to what the caller is authorized for, or null when
 * they are authorized for none of it.
 *
 * A concrete request has to be granted outright. An "ALL" request is narrowed
 * instead of refused: the workflows home page asks for ALL regardless of how
 * many systems a user has, so refusing it would break that page for every
 * single-system user. Narrowing means the minted key covers only the systems
 * they may actually search.
 */
export function narrowToAuthorized(
  requested: SystemId,
  authorized: SingleWorkflowsSystem[],
): SystemId | null {
  if (requested === "ALL") {
    if (authorized.length === 0) return null;
    return authorized.length === 2 ? "ALL" : authorized[0];
  }
  return authorized.includes(requested) ? requested : null;
}

// Firestore doc IDs in supervisionStaff / incarcerationStaff / userUpdates are
// composites of the lowercased stateCode + externalId (e.g. "us_tn_agonzalez123").
export function staffDocId(stateCode: string, externalId: string): string {
  return `${stateCode.toLowerCase()}_${externalId}`;
}
