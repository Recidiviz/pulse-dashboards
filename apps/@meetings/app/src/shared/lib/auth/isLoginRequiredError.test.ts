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

import { isLoginRequiredError } from "./isLoginRequiredError";

describe("isLoginRequiredError", () => {
  it("matches the web CredentialsManagerError (name === 'login_required')", () => {
    const error = Object.assign(new Error("Login required"), {
      name: "login_required",
      code: "login_required",
    });
    expect(isLoginRequiredError(error)).toBe(true);
  });

  it("matches when only `code` is login_required", () => {
    expect(isLoginRequiredError({ code: "login_required" })).toBe(true);
  });

  it("matches the raw @auth0/auth0-spa-js error (error === 'login_required')", () => {
    expect(
      isLoginRequiredError({ error: "login_required", error_description: "x" }),
    ).toBe(true);
  });

  it.each(["NO_CREDENTIALS", "NO_REFRESH_TOKEN", "RENEW_FAILED"])(
    "matches the native CredentialsManagerError (type === '%s')",
    (type) => {
      // Native sets a non-login_required name/code; only the normalized type matches.
      const error = Object.assign(new Error("Renew failed"), {
        name: "invalid_grant",
        code: "invalid_grant",
        type,
      });
      expect(isLoginRequiredError(error)).toBe(true);
    },
  );

  it("does not match a transient native network error (type === 'NO_NETWORK')", () => {
    const error = Object.assign(new Error("Network error"), {
      name: "NO_NETWORK",
      code: "NO_NETWORK",
      type: "NO_NETWORK",
    });
    expect(isLoginRequiredError(error)).toBe(false);
  });

  it("does not match other Auth0 errors", () => {
    // Raw, non-normalized shape (no CredentialsManagerError `type`).
    const error = Object.assign(new Error("Renew failed"), {
      name: "invalid_grant",
      code: "invalid_grant",
    });
    expect(isLoginRequiredError(error)).toBe(false);
  });

  it("does not match a plain Error", () => {
    expect(isLoginRequiredError(new Error("boom"))).toBe(false);
  });

  it("handles null and non-object input", () => {
    expect(isLoginRequiredError(null)).toBe(false);
    expect(isLoginRequiredError(undefined)).toBe(false);
    expect(isLoginRequiredError("login_required")).toBe(false);
  });
});
