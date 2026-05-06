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

import {
  hasCPAPermission,
  isActiveRecidivizUser,
  isImpersonating,
  isRecidivizUser,
} from "~@reentry/frontend/lib/auth/permissions";

describe("hasCPAPermission", () => {
  it("returns true when user has explicit CPA permission", () => {
    const metadata = {
      stateCode: "US_ID",
      userHash: "hash",
      routes: { cpa: true },
    };
    expect(hasCPAPermission(metadata)).toBe(true);
  });

  it("returns false when metadata is not defined", () => {
    expect(hasCPAPermission(undefined)).toBe(false);
  });

  it("returns false when routes is not defined", () => {
    const metadata = { stateCode: "US_ID", userHash: "hash" };
    expect(hasCPAPermission(metadata)).toBe(false);
  });

  it("returns false when cpa route is not defined", () => {
    const metadata = { stateCode: "US_ID", userHash: "hash", routes: {} };
    expect(hasCPAPermission(metadata)).toBe(false);
  });

  it("returns false when cpa route is false", () => {
    const metadata = {
      stateCode: "US_ID",
      userHash: "hash",
      routes: { cpa: false },
    };
    expect(hasCPAPermission(metadata)).toBe(false);
  });
});

describe("isRecidivizUser", () => {
  it("returns true for @recidiviz.org email", () => {
    expect(isRecidivizUser("user@recidiviz.org")).toBe(true);
  });

  it("returns false for external email", () => {
    expect(isRecidivizUser("user@gmail.com")).toBe(false);
  });

  it("returns false for undefined email", () => {
    expect(isRecidivizUser(undefined)).toBe(false);
  });

  it("returns false for null email", () => {
    expect(isRecidivizUser(null)).toBe(false);
  });

  it("returns false for email containing but not ending with the domain", () => {
    expect(isRecidivizUser("user@recidiviz.org.fake.com")).toBe(false);
  });

  it("returns true even when impersonated_email is set in localStorage", () => {
    localStorage.setItem("impersonated_email", "target@example.com");
    expect(isRecidivizUser("user@recidiviz.org")).toBe(true);
    localStorage.removeItem("impersonated_email");
  });
});

describe("isImpersonating", () => {
  afterEach(() => {
    localStorage.removeItem("impersonated_email");
  });

  it("returns false when impersonated_email is not set", () => {
    expect(isImpersonating()).toBe(false);
  });

  it("returns true when impersonated_email is set", () => {
    localStorage.setItem("impersonated_email", "target@example.com");
    expect(isImpersonating()).toBe(true);
  });
});

describe("isActiveRecidivizUser", () => {
  afterEach(() => {
    localStorage.removeItem("impersonated_email");
  });

  it("returns true for a Recidiviz user not impersonating", () => {
    expect(isActiveRecidivizUser("user@recidiviz.org")).toBe(true);
  });

  it("returns false for a Recidiviz user while impersonating", () => {
    localStorage.setItem("impersonated_email", "target@example.com");
    expect(isActiveRecidivizUser("user@recidiviz.org")).toBe(false);
  });

  it("returns false for a non-Recidiviz user", () => {
    expect(isActiveRecidivizUser("user@gmail.com")).toBe(false);
  });

  it("returns false for undefined email", () => {
    expect(isActiveRecidivizUser(undefined)).toBe(false);
  });
});
