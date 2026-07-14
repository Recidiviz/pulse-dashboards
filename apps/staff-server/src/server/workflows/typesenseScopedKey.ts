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

import * as Sentry from "@sentry/node";
import type { Request, Response } from "express";
import {
  type DocumentData,
  type Firestore,
  getFirestore,
} from "firebase-admin/firestore";
import type { Client as TypesenseClient } from "typesense";

import {
  createLocalTypesenseClient,
  resolveCrossSystemStaffScopes,
  resolveStaffScope,
  type SingleWorkflowsSystem,
  type StaffScope,
  toCrossSystemTypesenseFilter,
  toTypesenseFilter,
} from "~@typesense/client";
import type { RoleSubtype, SystemId } from "~datatypes";

import { fetchOfflineUser } from "../core";
import { getAppMetadata } from "../utils/getAppMetadata";
import { isOfflineMode } from "../utils/isOfflineMode";

const SCOPED_KEY_TTL_SECONDS = 3600;

const VALID_SYSTEMS = [
  "SUPERVISION",
  "INCARCERATION",
  "ALL",
] as const satisfies readonly SystemId[];

function isValidSystem(value: unknown): value is SystemId {
  return (
    typeof value === "string" &&
    (VALID_SYSTEMS as readonly string[]).includes(value)
  );
}

let typesenseClient: TypesenseClient | null = null;
function getTypesenseClient(): TypesenseClient {
  if (!typesenseClient) {
    typesenseClient = createLocalTypesenseClient();
  }
  return typesenseClient;
}

let searchOnlyParentKey: string | null = null;

/**
 * Prepares the search-only parent key used by the mint endpoint.
 *
 * `generateScopedSearchKey` only enforces scope when the parent is a SEARCH-only
 * key (an admin-derived scope is silently ignored by Typesense), so this
 * function makes sure such a key is available:
 *
 *   - dev / staging / production: `TYPESENSE_API_KEY` is already the
 *     search-only key, pre-provisioned in
 *     libs/@typesense/client/env.<env>.enc.yaml and surfaced here via the
 *     SOPS plugin's `additional-sops-env-files`.
 *   - offline: no `TYPESENSE_API_KEY` env is set; the client uses the
 *     admin bootstrap key ("xyz") to talk to local Typesense, and we mint a
 *     fresh search-only sub-key from it. Orphan keys pile up in the offline
 *     cluster across restarts — fine for offline dev.
 *
 * Fired-and-forgotten from index.js AFTER `server.listen(...)`. Failure here
 * doesn't block the rest of the server — the mint endpoint returns a 500 with
 * a clear message until this resolves. This is a deliberate pre-prod stance
 * while Typesense-backed search is behind a flag; before it ships, flip
 * index.js to await this and exit on failure so a misconfigured env is caught
 * at boot rather than at first search.
 */
export async function initTypesenseScopedKeys(): Promise<void> {
  if (isOfflineMode()) {
    const admin = getTypesenseClient();
    const created = await admin.keys().create({
      actions: ["documents:search"],
      collections: ["*"],
      description: "scoped-key-parent (auto-created for offline dev)",
    });
    if (!created.value) {
      throw new Error(
        "Typesense did not return a value on key create — cannot derive scoped keys",
      );
    }
    searchOnlyParentKey = created.value;
    return;
  }

  const key = process.env["TYPESENSE_API_KEY"];
  if (!key) {
    throw new Error(
      "TYPESENSE_API_KEY is not set — cannot mint scoped Typesense keys",
    );
  }
  searchOnlyParentKey = key;
}

// Firestore doc IDs in supervisionStaff / incarcerationStaff / userUpdates are
// composites of the lowercased stateCode + externalId (e.g. "us_tn_agonzalez123").
function staffDocId(stateCode: string, externalId: string): string {
  return `${stateCode.toLowerCase()}_${externalId}`;
}

// Looks up a user's staff record for user-attribute lookup (district, email,
// roleSubtype). The collection is determined by which one the user appears in,
// not by the requested system — these attributes are user-level and don't vary
// per system. Tries supervisionStaff first since that's the more common case.
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

// Determines whether the user supervises >= 1 other staff member — used by the
// scope resolver to layer the "expandToSupervisedStaff" branch on top of the
// user's base scope. `supervisorExternalId` is a supervision-side concept:
// only `supervisionStaffRecordSchema` declares it (incarcerationStaffRecord
// does not). The primary query below reflects that invariant.
//
// The parallel `incarcerationStaff` query is a runtime canary: if the BQ ETL
// ever starts writing `supervisorExternalId` to incarceration staff docs (or a
// tenant introduces a genuinely cross-system supervisor), we'll see it in
// Sentry rather than silently returning a wrong scope. Doesn't affect the
// return value — the supervision-side answer stays authoritative.
async function fetchIsSupervisor(
  db: Firestore,
  externalId: string,
): Promise<boolean> {
  const [suprSnap, incSnap] = await Promise.all([
    db
      .collection("supervisionStaff")
      .where("supervisorExternalId", "==", externalId)
      .limit(1)
      .get(),
    db
      .collection("incarcerationStaff")
      .where("supervisorExternalId", "==", externalId)
      .limit(1)
      .get(),
  ]);
  if (!incSnap.empty) {
    Sentry.captureMessage(
      "incarcerationStaff doc has supervisorExternalId set — cross-system supervisor invariant violated. See fetchIsSupervisor in typesenseScopedKey.ts.",
      {
        level: "warning",
        extra: { externalId, docId: incSnap.docs[0]?.id },
      },
    );
  }
  return !suprSnap.empty;
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

interface RequestUser {
  userId?: string;
  userEmail: string;
  appMetadata: Record<string, unknown>;
}

// Returns the caller's Auth0-shaped identity: `req.user` (validated JWT payload)
// in production; a synthetic offline user in offline mode. Extracts the fields
// the mint endpoint actually reads so the type-cast noise stays contained here.
function resolveRequestUser(req: Request): RequestUser {
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

interface ScopeAndFilter {
  scope: StaffScope | { supervision: StaffScope; incarceration: StaffScope };
  filterBy: string;
  debugSystem: SystemId | "ADMIN";
}

// Resolves the caseload-visibility scope and compiles it to a Typesense
// `filter_by` clause.
async function resolveScopeAndFilter(
  currentTenantId: string,
  system: SystemId,
  user: RequestUser,
): Promise<ScopeAndFilter> {
  if (isRecidivizUser(user.appMetadata)) {
    const scope: StaffScope = { base: { kind: "unrestricted" } };
    return {
      scope,
      filterBy: toTypesenseFilter(scope, { stateCode: currentTenantId }),
      debugSystem: "ADMIN",
    };
  }

  // userId is guaranteed non-null by the endpoint's 422 guard.
  const userId = user.userId as string;
  const db = getFirestore();
  const [staff, isSupervisor, userUpdates] = await Promise.all([
    fetchStaffRecord(db, currentTenantId, userId),
    fetchIsSupervisor(db, userId),
    fetchUserUpdates(db, currentTenantId, userId),
  ]);

  const fvs = user.appMetadata["featureVariants"] as
    | Record<string, unknown>
    | undefined;
  const activeFeatureVariants = {
    supervisionUnrestrictedSearch: Boolean(
      fvs?.["supervisionUnrestrictedSearch"],
    ),
    workflowsSupervisorSearch: Boolean(fvs?.["workflowsSupervisorSearch"]),
  };

  // If the user has no staff record (e.g., a supervisor who isn't an officer
  // themselves), they still get a scope — derived from whatever we have (email
  // + isSupervisor reverse-pointer + FVs). The state-baseline resolver handles
  // the no-district case by falling back to byEmail or `none`; supervisor
  // expansion then layers in the supervisorExternalId match.
  const resolverInput = {
    stateCode: currentTenantId,
    user: {
      id: userId,
      email: staff?.["email"] ?? user.userEmail,
      district: staff?.["district"] ?? undefined,
      overrideDistrictIds: userUpdates["overrideDistrictIds"] as
        | string[]
        | undefined,
      roleSubtype:
        (staff?.["roleSubtype"] as RoleSubtype | null | undefined) ?? null,
      hasCaseload: staff !== null,
    },
    activeFeatureVariants,
    isSupervisor,
  };

  if (system === "ALL") {
    // Leadership / cross-system users: resolve per-system scopes (rules can
    // differ per system — e.g. US_MI is district-scoped for SUPERVISION but
    // unrestricted for INCARCERATION) and compile into one filter_by with
    // `system` as the discriminator.
    const scope = resolveCrossSystemStaffScopes(resolverInput);
    return {
      scope,
      filterBy: toCrossSystemTypesenseFilter(scope, currentTenantId),
      debugSystem: system,
    };
  }

  const singleSystem: SingleWorkflowsSystem = system;
  const scope = resolveStaffScope({ ...resolverInput, system: singleSystem });
  return {
    scope,
    filterBy: toTypesenseFilter(scope, { stateCode: currentTenantId }),
    debugSystem: system,
  };
}

/**
 * POST /workflows/typesense-scoped-key
 *
 * Mints a scoped Typesense API key for the authenticated user, filtered to the
 * user's caseload-visibility scope per the shared resolver in ~@typesense/client/scope.
 *
 * Body: { currentTenantId: string, system: "SUPERVISION" | "INCARCERATION" | "ALL" }
 * Returns: { scopedKey: string, expiresAt: ISO8601, typesenseHost: string }
 */
export async function mintTypesenseScopedKey(req: Request, res: Response) {
  const { currentTenantId, system: requestedSystem } = req.body ?? {};
  if (!currentTenantId) {
    return res.status(400).json({ error: "currentTenantId is required" });
  }
  if (!isValidSystem(requestedSystem)) {
    return res.status(400).json({
      error: `system must be one of ${VALID_SYSTEMS.join(", ")}`,
    });
  }

  const user = resolveRequestUser(req);
  if (!isRecidivizUser(user.appMetadata) && !user.userId) {
    return res.status(422).json({ error: "User has no externalId" });
  }

  if (!searchOnlyParentKey) {
    // Server didn't call initTypesenseScopedKeys() before serving — a bootstrap
    // wiring bug, not a runtime condition. Surface as 500 with a clear message.
    return res.status(500).json({
      error: "Typesense scoped-key parent not initialized on server startup",
    });
  }

  const { scope, filterBy, debugSystem } = await resolveScopeAndFilter(
    currentTenantId,
    requestedSystem,
    user,
  );

  const expiresAt = Math.floor(Date.now() / 1000) + SCOPED_KEY_TTL_SECONDS;
  const scopedKey = getTypesenseClient()
    .keys()
    .generateScopedSearchKey(searchOnlyParentKey, {
      filter_by: filterBy,
      expires_at: expiresAt,
    });

  return res.json({
    scopedKey,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    typesenseHost: process.env["TYPESENSE_HOST"] || "http://localhost:8108",
    ...(isOfflineMode() && {
      _debug: { filterBy, scope, system: debugSystem },
    }),
  });
}
