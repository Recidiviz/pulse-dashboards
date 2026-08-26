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

// Shared types for the Typesense scoped-key endpoints.

import type { RoleSubtype, SystemId } from "~datatypes";

// The identity + Firestore context every scoped-key mint handler needs to build
// its filter_by. Populated by resolveUserScopeContext. Consumers pull whatever
// fields their own scope resolver cares about (caseload uses
// district/isSupervisor/certain FVs; person also uses the supervised ids).
export type UserScopeContext = {
  // Empty string when the user is Recidiviz (no external staff id); handlers
  // that need it must check isRecidivizUser first.
  userId: string;
  userEmail: string;
  isRecidivizUser: boolean;
  district: string | undefined;
  roleSubtype: RoleSubtype | null;
  hasCaseload: boolean;
  overrideDistrictIds: string[] | undefined;
  isSupervisor: boolean;
  // staffExternalId of every staff member this user supervises.
  supervisedStaffExternalIds: string[];
  // Raw FV bag from the JWT — consumers pick what they need. Kept as a bag
  // (not pre-filtered) so new scope-affecting FVs don't require touching
  // userScopeContext.
  featureVariants: Record<string, unknown>;
};

// The caller's Auth0-shaped identity, reduced to the fields the mint handlers
// read.
export type RequestIdentity = {
  userId?: string;
  userEmail: string;
  appMetadata: Record<string, unknown>;
};

export type ScopeAndFilters = {
  // The resolved scope per system. Surfaced only in the offline `_debug`
  // payload, so its shape is not part of the production contract.
  scope: unknown;
  // One filter_by per collection this key covers, each built only from the
  // fields that collection declares. See ~@typesense/client/scope.
  filtersByCollection: Record<string, string>;
  debugSystem: SystemId | "ADMIN";
};

// What mintScopedKeyHandler needs from a minter. Declared separately so the
// handler does not have to name the subclass's Scope type parameter.
export type ScopeAndFiltersResolver = {
  resolve(system: SystemId): ScopeAndFilters;
};
