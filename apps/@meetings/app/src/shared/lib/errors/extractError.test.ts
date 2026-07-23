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

import { extractError, extractErrorDetails } from "./extractError";

describe("extractError", () => {
  it("returns the message of an Error", () => {
    expect(extractError(new Error("boom"))).toBe("boom");
  });

  it("stringifies non-Error input", () => {
    expect(extractError("boom")).toBe("boom");
    expect(extractError(42)).toBe("42");
  });
});

describe("extractErrorDetails", () => {
  it("flattens the discriminating fields of a CredentialsManagerError", () => {
    // Mirrors the react-native-auth0 native error shape.
    const error = Object.assign(new Error("An error occurred"), {
      name: "invalid_grant",
      code: "RENEW_FAILED",
      type: "RENEW_FAILED",
      status: 0,
    });

    expect(extractErrorDetails(error)).toEqual({
      errorMessage: "An error occurred",
      errorName: "invalid_grant",
      errorCode: "RENEW_FAILED",
      errorType: "RENEW_FAILED",
      // status of 0 is dropped as empty-ish; only meaningful values are kept.
    });
  });

  it("preserves the native cause behind a crypto failure", () => {
    const error = Object.assign(new Error("Crypto exception"), {
      type: "CRYPTO_EXCEPTION",
      cause: new Error("android.security.KeyStoreException: Key not found"),
    });

    expect(extractErrorDetails(error)).toMatchObject({
      errorType: "CRYPTO_EXCEPTION",
      errorCause: "android.security.KeyStoreException: Key not found",
    });
  });

  it("handles a plain Error (only the generic name is present)", () => {
    expect(extractErrorDetails(new Error("boom"))).toEqual({
      errorMessage: "boom",
      errorName: "Error",
    });
  });

  it("handles null and non-object input", () => {
    expect(extractErrorDetails(null)).toEqual({ errorMessage: "null" });
    expect(extractErrorDetails("boom")).toEqual({ errorMessage: "boom" });
  });
});
