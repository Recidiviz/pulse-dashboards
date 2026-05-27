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

// Shared types for user-visibility scope resolution. Mirrors the rules
// enforced in apps/staff/src/WorkflowsStore/utils.ts and applied at the
// Firestore query layer in apps/staff/src/FirestoreStore/subscriptions/StaffSubscription.ts.
//
// The resolver is consumed by:
//   (1) the staff-shared-server scoped-key mint endpoint (compiled to Typesense filter_by)
//   (2) the staff frontend's existing Firestore query path (eventually, once unified)

import type { RoleSubtype, SystemId } from "~datatypes";

// A single Workflows system (excluding the "ALL" leadership case). The
// per-system resolver only handles SUPERVISION or INCARCERATION; ALL is
// handled by the separate cross-system resolver (resolveCrossSystemStaffScopes).
export type SingleWorkflowsSystem = Exclude<SystemId, "ALL">;

export interface ResolveScopeUser {
  id: string;
  email: string;
  district?: string;
  overrideDistrictIds?: string[];
  roleSubtype?: RoleSubtype | null;
  // True if the user exists in supervisionStaff or incarcerationStaff (i.e.,
  // they have their own caseload of clients/residents). False for users like
  // district managers who supervise officers but aren't officers themselves.
  // Undefined defaults to true (preserves backwards-compatible behavior).
  hasCaseload?: boolean;
}

export interface ResolveScopeFeatureVariants {
  supervisionUnrestrictedSearch?: boolean;
  workflowsSupervisorSearch?: boolean;
}

export interface ResolveScopeInput {
  stateCode: string;
  system: SingleWorkflowsSystem;
  user: ResolveScopeUser;
  activeFeatureVariants: ResolveScopeFeatureVariants;
  // Whether this user supervises >= 1 staff member. The lib does not infer
  // this; the caller computes it from staff records and passes it in.
  isSupervisor: boolean;
}

// Input shape for the cross-system resolver. Same as ResolveScopeInput but
// without `system` — the resolver internally produces scopes for both
// SUPERVISION and INCARCERATION.
export type ResolveCrossSystemScopeInput = Omit<ResolveScopeInput, "system">;

// The base scope captures the state-baseline visibility rule.
// Supervisor expansion (if active) is layered on as a separate flag.
// `none` represents a user with no own scope (e.g. a non-caseload supervisor
// whose only access is via the supervisor expansion). Standalone, it compiles
// to a clause that matches no documents.
export type BaseScope =
  | { kind: "unrestricted" }
  | { kind: "byEmail"; email: string }
  | { kind: "byDistricts"; districts: string[] }
  | { kind: "none" };

export interface StaffScope {
  base: BaseScope;
  // If present, OR the base scope with supervisorExternalId == userId
  // (and the plural supervisorExternalIds variant for Insights compatibility).
  expandToSupervisedStaff?: { userId: string };
}
