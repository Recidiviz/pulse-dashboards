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

// OFFLINE ONLY. Lets a caller pick which synthetic user an endpoint resolves, so
// an e2e spec can drive the server's identity from the same object it mocks
// `/api/offlineUser` with. Otherwise every offline request resolves one fixed
// Recidiviz identity and no per-user behavior is testable.
//
// Both the Firebase token endpoint and the Typesense mint endpoints read this,
// and they MUST agree: the token's `uid` becomes `request.auth.token.user_id`,
// which Firestore rules compare against the `userUpdates` doc id the frontend
// asks for. A token minted for a different user than the app believes it is gets
// a rules denial rather than an empty result.

import type { Request } from "express";

export type OfflineUserOverrides = {
  stateCode?: string;
  externalId?: string;
  email?: string;
  featureVariants?: Record<string, unknown>;
};

function fromBody(req: Request): unknown {
  return (req.body as { offlineUser?: unknown } | undefined)?.offlineUser;
}

function fromQuery(req: Request): unknown {
  const raw = (req.query as { offlineUser?: unknown } | undefined)?.offlineUser;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Read as an explicit allowlist rather than a spread: this is identity input,
// and nothing outside these four fields may reach the synthetic user.
//
// District, roleSubtype and hasCaseload are absent by design — those still come
// from the Firestore staff fixture keyed by `externalId`, so fixtures stay the
// single source of truth for staff attributes.
//
// Accepts the override on the body (the mint endpoints POST) or the query string
// (the token endpoint is a GET), where it arrives JSON-encoded.
export function readOfflineUserOverrides(req: Request): OfflineUserOverrides {
  const raw = fromBody(req) ?? fromQuery(req);
  if (!raw || typeof raw !== "object") return {};

  const { stateCode, externalId, email, featureVariants } = raw as Record<
    string,
    unknown
  >;

  return {
    ...(typeof stateCode === "string" && { stateCode }),
    ...(typeof externalId === "string" && { externalId }),
    ...(typeof email === "string" && { email }),
    ...(featureVariants !== null &&
      typeof featureVariants === "object" && {
        featureVariants: featureVariants as Record<string, unknown>,
      }),
  };
}
