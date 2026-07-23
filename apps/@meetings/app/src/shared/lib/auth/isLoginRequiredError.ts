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

export const LOGIN_REQUIRED = "login_required";

// Normalized `CredentialsManagerError.type` values meaning the session can't be
// silently renewed. NO_NETWORK is excluded as transient, though on iOS an
// offline renewal failure can still surface as RENEW_FAILED.
const REAUTH_REQUIRED_TYPES = new Set([
  "NO_CREDENTIALS",
  "NO_REFRESH_TOKEN",
  "RENEW_FAILED",
]);

// Normalized `CredentialsManagerError.type` values indicating the on-device
// secure store / Keystore failed a cryptographic operation. These do NOT go
// through the network, so they never appear in Auth0's server logs. Notably,
// on a CRYPTO_EXCEPTION the Android SDK internally wipes the stored credential
// blob before throwing, so the *next* getCredentials() call throws
// NO_CREDENTIALS — meaning a keystore failure surfaces as a delayed forced
// logout. We log these distinctly so that root cause is visible rather than
// mislabeled as a plain session expiry.
const KEYSTORE_ERROR_TYPES = new Set([
  "CRYPTO_EXCEPTION",
  "INCOMPATIBLE_DEVICE",
]);

/**
 * True when the error is an on-device secure-store / Keystore cryptographic
 * failure (see {@link KEYSTORE_ERROR_TYPES}). Distinct from
 * {@link isLoginRequiredError}: these are not "silent refresh gave up", they
 * are "the device could not decrypt/sign", and they carry a native `cause`
 * worth logging.
 */
export function isKeystoreCredentialError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { type } = error as { type?: unknown };
  return typeof type === "string" && KEYSTORE_ERROR_TYPES.has(type);
}

/**
 * True when Auth0's silent refresh failed and the user must log in again. Web
 * exposes `login_required` on `name`/`code`/`error`; native (iOS/Android) only
 * exposes the normalized `CredentialsManagerError.type`.
 */
export function isLoginRequiredError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const {
    name,
    code,
    error: errorCode,
    type,
  } = error as {
    name?: unknown;
    code?: unknown;
    error?: unknown;
    type?: unknown;
  };

  return (
    name === LOGIN_REQUIRED ||
    code === LOGIN_REQUIRED ||
    errorCode === LOGIN_REQUIRED ||
    (typeof type === "string" && REAUTH_REQUIRED_TYPES.has(type))
  );
}
