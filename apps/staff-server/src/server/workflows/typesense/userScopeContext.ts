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

// Shared identity + Firestore context that every Typesense scoped-key mint
// handler needs to compile its filter_by. Caseload and person mint endpoints
// both consume this — differing only in how they translate the context into
// a filter_by over their respective collections.

import * as Sentry from "@sentry/node";
import type { Request } from "express";
import {
  type DocumentData,
  type Firestore,
  getFirestore,
} from "firebase-admin/firestore";

import type { RoleSubtype } from "~datatypes";

import { fetchOfflineUser } from "../../core";
import { fetchImpersonatedUserRestrictions } from "../../routes/api";
import { getAppMetadata } from "../../utils/getAppMetadata";
import { isOfflineMode } from "../../utils/isOfflineMode";

// The identity + context each scoped-key mint handler needs to build its
// filter_by. Populated by resolveUserScopeContext. Consumers pull whatever
// fields their own scope resolver cares about (caseload uses
// district/isSupervisor/certain FVs; person will use a different subset).
export interface UserScopeContext {
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
  // this file.
  featureVariants: Record<string, unknown>;
}

interface RequestIdentity {
  userId?: string;
  userEmail: string;
  appMetadata: Record<string, unknown>;
}

// Returns the caller's Auth0-shaped identity: `req.user` (validated JWT
// payload) in production; a synthetic offline user in offline mode. Extracts
// the fields the mint handlers actually read so the type-cast noise stays
// contained here.
function resolveRequestIdentity(req: Request): RequestIdentity {
  const user = isOfflineMode()
    ? fetchOfflineUser({} as Parameters<typeof fetchOfflineUser>[0])
    : (req as Request & { user?: Record<string, unknown> }).user;
  const appMetadata = getAppMetadata({ user });
  const userEmail = (user?.["email"] as string) || "";
  return {
    userId: appMetadata["externalId"] as string | undefined,
    userEmail,
    appMetadata,
  };
}

function isRecidivizUser(appMetadata: Record<string, unknown>): boolean {
  const stateCode = appMetadata["stateCode"] as string;
  return stateCode.toLowerCase() === "recidiviz";
}

// Firestore doc IDs in supervisionStaff / incarcerationStaff / userUpdates are
// composites of the lowercased stateCode + externalId (e.g. "us_tn_agonzalez123").
function staffDocId(stateCode: string, externalId: string): string {
  return `${stateCode.toLowerCase()}_${externalId}`;
}

// Looks up a user's staff record for user-attribute lookup (district, email,
// roleSubtype). The collection is determined by which one the user appears
// in, not by any requested system — these attributes are user-level and
// don't vary per system. Tries supervisionStaff first since that's the more
// common case.
async function fetchStaffRecord(
  db: Firestore,
  stateCode: string,
  externalId: string,
): Promise<DocumentData | null> {
  const docId = staffDocId(stateCode, externalId);
  const supr = await db.collection("supervisionStaff").doc(docId).get();
  if (supr.exists) return supr.data() ?? null;
  const inc = await db.collection("incarcerationStaff").doc(docId).get();
  if (inc.exists) return inc.data() ?? null;
  return null;
}

// Returns the staffExternalId of every staff member this user supervises —
// used by scope resolvers to layer the supervisor-expansion branch on top of
// the user's base scope.
// `supervisorExternalIds` is a supervision-side concept: only
// `supervisionStaffRecordSchema` declares it (incarcerationStaffRecord does
// not). The primary query below reflects that invariant.
async function fetchSupervisedStaffExternalIds(
  db: Firestore,
  externalId: string,
): Promise<string[]> {
  const [suprSnap, incSnap] = await Promise.all([
    db
      .collection("supervisionStaff")
      .where("supervisorExternalIds", "array-contains", externalId)
      .get(),
    db
      .collection("incarcerationStaff")
      .where("supervisorExternalId", "==", externalId)
      .get(),
  ]);
  if (!incSnap.empty) {
    Sentry.captureMessage(
      "incarcerationStaff doc has supervisorExternalId set — cross-system supervisor invariant violated. See fetchSupervisedStaffExternalIds in userScopeContext.ts.",
      {
        level: "warning",
        extra: { externalId, docId: incSnap.docs[0]?.id },
      },
    );
  }
  const staffExternalIds = new Set<string>();
  for (const doc of suprSnap.docs) {
    const staffExternalId = doc.data()["staffExternalId"] as string | undefined;
    if (staffExternalId) staffExternalIds.add(staffExternalId);
  }
  return [...staffExternalIds];
}

async function fetchUserUpdates(
  db: Firestore,
  stateCode: string,
  externalId: string,
): Promise<DocumentData> {
  const snap = await db
    .collection("userUpdates")
    .doc(staffDocId(stateCode, externalId))
    .get();
  return snap.exists ? snap.data() ?? {} : {};
}

// Derives the non-Recidiviz scope context for a given (externalId, stateCode)
// from Firestore: staff record (district, roleSubtype, email, hasCaseload),
// supervisor status, and userUpdates (overrideDistrictIds). Shared by the
// normal path (caller resolves themselves) and the impersonation path (a
// Recidiviz user resolves the impersonated user) — both compute the same
// staff-side scope, differing only in whose externalId + FVs feed in.
async function buildFirestoreScopeContext(
  userId: string,
  stateCode: string,
  featureVariants: Record<string, unknown>,
  fallbackEmail: string,
): Promise<UserScopeContext> {
  const db = getFirestore();
  const [staff, supervisedStaffExternalIds, userUpdates] = await Promise.all([
    fetchStaffRecord(db, stateCode, userId),
    fetchSupervisedStaffExternalIds(db, userId),
    fetchUserUpdates(db, stateCode, userId),
  ]);

  return {
    userId,
    userEmail: (staff?.["email"] as string | undefined) ?? fallbackEmail,
    isRecidivizUser: false,
    district: (staff?.["district"] as string | undefined) ?? undefined,
    roleSubtype:
      (staff?.["roleSubtype"] as RoleSubtype | null | undefined) ?? null,
    hasCaseload: staff !== null,
    overrideDistrictIds: userUpdates["overrideDistrictIds"] as
      | string[]
      | undefined,
    isSupervisor: supervisedStaffExternalIds.length > 0,
    supervisedStaffExternalIds,
    featureVariants,
  };
}

async function resolveImpersonatedScopeContext(
  impersonatedEmail: string,
  currentTenantId: string,
): Promise<UserScopeContext | null> {
  const metadata = (await fetchImpersonatedUserRestrictions(
    impersonatedEmail,
  )) as { externalId?: string; featureVariants?: Record<string, unknown> };

  const externalId = metadata?.externalId;
  if (!externalId) return null;

  return buildFirestoreScopeContext(
    externalId,
    currentTenantId,
    metadata.featureVariants ?? {},
    impersonatedEmail,
  );
}

/**
 * Resolves the caller's identity + all shared context needed to compile a
 * scoped-key filter_by. Returns null when the request has neither a
 * Recidiviz identity nor a user externalId — the calling handler should 422.
 *
 * For Recidiviz users, returns a bare context with no Firestore lookups:
 * caseload/person scope resolvers short-circuit to unrestricted before
 * reading any of the derived fields.
 */
export async function resolveUserScopeContext(
  req: Request,
  currentTenantId: string,
): Promise<UserScopeContext | null> {
  const identity = resolveRequestIdentity(req);
  const isRecidiviz = isRecidivizUser(identity.appMetadata);

  const impersonatedEmail = (
    req.body as { impersonatedEmail?: string } | undefined
  )?.impersonatedEmail;
  if (isRecidiviz && impersonatedEmail && !isOfflineMode()) {
    return resolveImpersonatedScopeContext(impersonatedEmail, currentTenantId);
  }

  if (!isRecidiviz && !identity.userId) return null;

  const featureVariants =
    (identity.appMetadata["featureVariants"] as
      | Record<string, unknown>
      | undefined) ?? {};

  if (isRecidiviz) {
    return {
      userId: identity.userId ?? "",
      userEmail: identity.userEmail,
      isRecidivizUser: true,
      district: undefined,
      roleSubtype: null,
      hasCaseload: false,
      overrideDistrictIds: undefined,
      isSupervisor: false,
      supervisedStaffExternalIds: [],
      featureVariants,
    };
  }

  return buildFirestoreScopeContext(
    identity.userId as string,
    currentTenantId,
    featureVariants,
    identity.userEmail,
  );
}
