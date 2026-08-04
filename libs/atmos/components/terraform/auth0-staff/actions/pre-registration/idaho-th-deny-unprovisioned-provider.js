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

/**
 * Pre-registration Action for Idaho Transitional Housing — PROVIDER.
 *
 * Fail closed for passwordless (`email`) sign-ups on the Idaho TH app so
 * bypassing the frontend checkSignInEmail cannot create orphan Auth0 users.
 * Providers are provisioned in HousingProvider and fully authorized in
 * post-login (link-provider).
 *
 * Scoping: no-ops for any application that is not the Idaho TH app (see
 * IDAHO_TH_CLIENT_ID on the shared action module). No-ops for non-passwordless
 * connections (staff registration is handled elsewhere).
 *
 * Backend contract (prototype/idaho-transitional-housing-v2):
 * - POST /internal/check-provider-provisioned
 * - SIGNED_WEBHOOK_ROUTES.checkProviderProvisioned in
 *   libs/@idaho-th/trpc/src/auth/webhookSignature.ts
 */

const Sentry = require("@sentry/node");

const {
  callIdahoThSignedWebhook,
  getUserEmail,
  isIdahoThClient,
  normalizeEmail,
} = require("actions:recidiviz-action-helpers");

const IDAHO_TH_PASSWORDLESS_CONNECTION = "email";
// Must match SIGNED_WEBHOOK_ROUTES.checkProviderProvisioned on
// prototype/idaho-transitional-housing-v2
// (libs/@idaho-th/trpc/src/auth/webhookSignature.ts).
const CHECK_PROVIDER_PROVISIONED_PATH = "internal/check-provider-provisioned";
const PROVIDER_NOT_SETUP_MESSAGE =
  "Your account has not been set up. Please contact your administrator.";
const PROVIDER_AUTH_ERROR_MESSAGE =
  "There was a problem authorizing your account. Please contact the Recidiviz team.";

async function denyUnlessIdahoThProviderProvisioned(event, api) {
  const email = normalizeEmail(getUserEmail(event));
  if (!email) {
    api.access.deny(PROVIDER_NOT_SETUP_MESSAGE);
    return;
  }

  let res;
  try {
    res = await callIdahoThSignedWebhook(CHECK_PROVIDER_PROVISIONED_PATH, {
      email,
    });
  } catch (err) {
    console.error("Idaho TH check-provider-provisioned failed:", err);
    Sentry.captureException(err, {
      tags: {
        clientName: event.client && event.client.name,
        clientId: event.client && event.client.client_id,
      },
    });
    api.access.deny(PROVIDER_AUTH_ERROR_MESSAGE);
    return;
  }

  if (res.status === 404) {
    api.access.deny(PROVIDER_NOT_SETUP_MESSAGE);
    return;
  }

  if (!res.ok) {
    api.access.deny(PROVIDER_AUTH_ERROR_MESSAGE);
    return;
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = undefined;
  }

  if (!payload || payload.success !== true) {
    api.access.deny(PROVIDER_AUTH_ERROR_MESSAGE);
  }
}

/**
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  // Never touch other applications that share this tenant.
  if (!isIdahoThClient(event)) {
    return;
  }

  const connectionName = (event.connection?.name || "").trim();
  if (connectionName !== IDAHO_TH_PASSWORDLESS_CONNECTION) {
    // Staff / other connections are not gated here.
    return;
  }

  Sentry.init({
    dsn: event.secrets.SENTRY_DSN,
    environment: event.secrets.SENTRY_ENV,
  });

  await denyUnlessIdahoThProviderProvisioned(event, api);
};
