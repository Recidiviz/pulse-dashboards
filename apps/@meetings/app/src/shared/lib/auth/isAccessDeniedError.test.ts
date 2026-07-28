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

import { isAccessDeniedError } from "./isAccessDeniedError";

describe("isAccessDeniedError", () => {
  it("matches when both `name` and `code` are access_denied", () => {
    const error = Object.assign(new Error("No access granted to state data."), {
      name: "access_denied",
      code: "access_denied",
    });
    expect(isAccessDeniedError(error)).toBe(true);
  });

  it("matches when only `code` is access_denied", () => {
    expect(isAccessDeniedError({ code: "access_denied" })).toBe(true);
  });

  it("matches when only `name` is access_denied", () => {
    expect(isAccessDeniedError({ name: "access_denied" })).toBe(true);
  });

  it("does not match other Auth0 errors", () => {
    const error = Object.assign(new Error("Login required"), {
      name: "login_required",
      code: "login_required",
    });
    expect(isAccessDeniedError(error)).toBe(false);
  });

  it("does not match a plain Error", () => {
    expect(isAccessDeniedError(new Error("boom"))).toBe(false);
  });

  it("handles null and non-object input", () => {
    expect(isAccessDeniedError(null)).toBe(false);
    expect(isAccessDeniedError(undefined)).toBe(false);
    expect(isAccessDeniedError("access_denied")).toBe(false);
  });
});
