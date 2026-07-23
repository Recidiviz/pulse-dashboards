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

export function extractError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Flattened, log-friendly attributes for an error. Unlike {@link extractError}
 * (message only), this preserves the discriminating fields of
 * react-native-auth0's `CredentialsManagerError` — most importantly the
 * normalized `type` (e.g. "NO_CREDENTIALS", "NO_REFRESH_TOKEN",
 * "RENEW_FAILED", "CRYPTO_EXCEPTION") and the platform `code`.
 *
 * Why this matters: on Android, the free-text `message` of a credential error
 * gets redacted to `[Filtered]` by Sentry's PII/token scrubbing, so logging
 * only the message tells us nothing about *why* the SDK threw. The `type`/
 * `code` enums are short, non-sensitive strings that pass through scrubbing
 * intact — and, returned as flat top-level attributes here, become directly
 * queryable in Sentry (e.g. `errorType:NO_CREDENTIALS`).
 *
 * `cause` captures the underlying native throwable (e.g. the Android
 * `KeyStoreException` behind a `CRYPTO_EXCEPTION`), which names the real
 * Keystore failure.
 */
export function extractErrorDetails(error: unknown): Record<string, string> {
  const details: Record<string, string> = {
    errorMessage: extractError(error),
  };

  if (typeof error === "object" && error !== null) {
    const source = error as Record<string, unknown>;
    const fields: Array<[keyof typeof source, string]> = [
      ["name", "errorName"],
      ["code", "errorCode"],
      ["type", "errorType"],
      ["status", "errorStatus"],
    ];
    for (const [key, attribute] of fields) {
      const value = source[key];
      // Skip empty-ish values, including the AuthError default `status: 0`,
      // which carries no signal and would just add noise to every log.
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== 0
      ) {
        details[attribute] = String(value);
      }
    }
    const cause = source["cause"];
    if (cause !== undefined && cause !== null) {
      details["errorCause"] = extractError(cause);
    }
  }

  return details;
}
