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

import { getCredentialsFailedCause } from "./getCredentialsFailedCause";

// Mirrors the CredentialsManagerError that WebCredentialsManager throws.
function wrap(json: unknown): Error {
  return Object.assign(new Error("wrapped"), {
    name: "GetCredentialsFailed",
    code: "GetCredentialsFailed",
    type: "UNKNOWN_ERROR",
    json,
  });
}

describe("getCredentialsFailedCause", () => {
  it("returns the name of a wrapped IndexedDB DOMException", () => {
    const idbError = Object.assign(
      new Error(
        "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
      ),
      { name: "InvalidStateError" },
    );
    expect(getCredentialsFailedCause(wrap(idbError))).toBe("InvalidStateError");
  });

  it("returns the name of a wrapped network TypeError", () => {
    expect(
      getCredentialsFailedCause(wrap(new TypeError("Failed to fetch"))),
    ).toBe("TypeError");
  });

  it("ignores errors that are not GetCredentialsFailed", () => {
    const error = Object.assign(new Error("Login required"), {
      name: "login_required",
      json: new TypeError("Failed to fetch"),
    });
    expect(getCredentialsFailedCause(error)).toBeUndefined();
  });

  it("returns undefined when the wrapped error is missing or nameless", () => {
    expect(getCredentialsFailedCause(wrap(undefined))).toBeUndefined();
    expect(getCredentialsFailedCause(wrap("Failed to fetch"))).toBeUndefined();
    expect(getCredentialsFailedCause(wrap({ name: "" }))).toBeUndefined();
  });

  it("handles null and non-Error input", () => {
    expect(getCredentialsFailedCause(null)).toBeUndefined();
    expect(getCredentialsFailedCause(undefined)).toBeUndefined();
    expect(
      getCredentialsFailedCause({ name: "GetCredentialsFailed" }),
    ).toBeUndefined();
  });
});
