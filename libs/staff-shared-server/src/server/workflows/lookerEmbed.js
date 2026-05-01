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

import { randomUUID } from "node:crypto";

import { LookerNodeSDK, NodeSettings } from "@looker/sdk-node";

import { respondWithForbidden } from "../routes/api";
import { getAppMetadata } from "../utils/getAppMetadata";
import { getUserEmail } from "../utils/getUserEmail";
import { isOfflineMode } from "../utils/isOfflineMode";

/**
 * Looker SDK instance, lazily initialized from GSM-sourced environment
 * variables: LOOKER_BASE_URL, LOOKER_CLIENT_ID, LOOKER_CLIENT_SECRET.
 */
let sdk;

function getSDK() {
  if (!sdk) sdk = LookerNodeSDK.init40(new NodeSettings("LOOKER"));
  return sdk;
}

/**
 * Server-side store keyed by a server-generated UUID returned to and echoed
 * back by the client. Each entry holds the session_reference_token (never sent
 * to the client) and the email of the user who created the session, so
 * generateTokens can reject attempts to refresh another user's session.
 */
const sessionReferenceTokenStore = new Map();

/**
 * Checks whether the requesting user is allowed to access the Looker embed.
 * Permitted when the user is a Recidiviz employee or has
 * the director_dashboard route enabled in their app metadata.
 */
function isAllowed(appMetadata) {
  return (
    appMetadata.state_code === "recidiviz" ||
    !!appMetadata.routes?.director_dashboard
  );
}

/**
 * GET /api/:stateCode/looker/acquireSession
 *
 * Creates a new Looker cookieless embed session for the given state. Each call
 * always creates a fresh Looker session (no rejoin), so multiple windows for
 * the same user each get their own isolated session with independent TTLs.
 *
 * Returns a server-generated session_id alongside the authentication,
 * navigation, and API tokens. The client must echo session_id in all subsequent
 * generateTokens calls so the server can locate the right session_reference_token.
 *
 * The browser's User-Agent is forwarded to Looker so the token it issues is
 * bound to the same UA that the embed iframe will present.
 *
 * See: https://docs.cloud.google.com/looker/docs/cookieless-embed#application_server_implementation
 */
export async function acquireSession(req, res) {
  if (isOfflineMode()) {
    res.status(503).json({
      status: 503,
      errors: ["Looker embed not available in offline mode"],
    });
    return;
  }

  const appMetadata = getAppMetadata(req);

  if (!isAllowed(appMetadata)) {
    respondWithForbidden(res);
    return;
  }

  // Before this handler is called, the validateStateCode middleware checks that req.params.stateCode
  // matches the user's token, or that the token's state code is recidiviz. The latter case is why we
  // get the state code from the URL in the first place.
  const { stateCode } = req.params;
  const normalizedStateCode = stateCode.toLowerCase();
  const externalUserId = `external-embed-${normalizedStateCode}`;
  const sessionId = randomUUID();

  const sessionResp = await getSDK().acquire_embed_cookieless_session(
    {
      external_user_id: externalUserId,
      permissions: ["access_data", "see_looks", "see_lookml_dashboards"],
      models: [process.env.LOOKER_EMBED_MODEL_ID],
      session_length: 24 * 60 * 60,
      user_attributes: { state_code: normalizedStateCode },
    },
    { headers: { "User-Agent": req.headers["user-agent"] } },
  );

  if (!sessionResp.ok) {
    throw new Error(
      `Looker acquire session failed: ${JSON.stringify(sessionResp.error)}`,
    );
  }

  const session = sessionResp.value;

  if (session.session_reference_token) {
    sessionReferenceTokenStore.set(sessionId, {
      sessionReferenceToken: session.session_reference_token,
      email: getUserEmail(req),
    });
  }

  res.set("Cache-Control", "no-store, max-age=0");
  res.json({
    session_id: sessionId,
    authentication_token: session.authentication_token,
    authentication_token_ttl: session.authentication_token_ttl,
    navigation_token: session.navigation_token,
    navigation_token_ttl: session.navigation_token_ttl,
    api_token: session.api_token,
    api_token_ttl: session.api_token_ttl,
    session_reference_token_ttl: session.session_reference_token_ttl,
  });
}

/**
 * POST /api/:stateCode/looker/generateTokens
 *
 * Refreshes Looker embed tokens before they expire. The client sends its
 * current tokens and the session_id received from acquireSession; the server
 * uses session_id to look up the stored session_reference_token and exchanges
 * the tokens with Looker for a fresh set.
 *
 * Returns { session_reference_token_ttl: 0 } if we don't have a valid session
 * or if the sdk reports the session has expired, so the embed SDK can handle
 * the graceful session-end path.
 *
 * See: https://docs.cloud.google.com/looker/docs/cookieless-embed#application_server_implementation
 */
export async function generateTokens(req, res) {
  if (isOfflineMode()) {
    res.status(503).json({
      status: 503,
      errors: ["Looker embed not available in offline mode"],
    });
    return;
  }

  const appMetadata = getAppMetadata(req);

  if (!isAllowed(appMetadata)) {
    respondWithForbidden(res);
    return;
  }

  const { session_id, api_token, navigation_token } = req.body;

  const entry = sessionReferenceTokenStore.get(session_id);
  if (!entry || entry.email !== getUserEmail(req)) {
    res.json({ session_reference_token_ttl: 0 });
    return;
  }

  const userAgent = req.headers["user-agent"];
  const tokensResp = await getSDK().generate_tokens_for_cookieless_session(
    {
      api_token,
      navigation_token,
      session_reference_token: entry.sessionReferenceToken,
    },
    userAgent ? { headers: { "User-Agent": userAgent } } : undefined,
  );

  // Any Looker error means the session is gone. Return session_reference_token_ttl: 0
  // so the embed SDK recognises it as a graceful session end and can re-acquire.
  if (!tokensResp.ok) {
    sessionReferenceTokenStore.delete(session_id);
    res.json({ session_reference_token_ttl: 0 });
    return;
  }

  const tokens = tokensResp.value;

  if (tokens.session_reference_token) {
    sessionReferenceTokenStore.set(session_id, {
      sessionReferenceToken: tokens.session_reference_token,
      email: entry.email,
    });
  }

  res.set("Cache-Control", "no-store, max-age=0");
  res.json({
    navigation_token: tokens.navigation_token,
    navigation_token_ttl: tokens.navigation_token_ttl,
    api_token: tokens.api_token,
    api_token_ttl: tokens.api_token_ttl,
    session_reference_token_ttl: tokens.session_reference_token_ttl,
  });
}
