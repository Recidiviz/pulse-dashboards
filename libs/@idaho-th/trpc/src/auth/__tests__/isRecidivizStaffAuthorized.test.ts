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

import { afterEach, describe, expect, it, vi } from "vitest";

import { isRecidivizStaffAuthorized } from "~@idaho-th/trpc/auth/isRecidivizStaffAuthorized";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isRecidivizStaffAuthorized outside staging", () => {
  it("authorizes an address on the list, whatever its casing or spacing", () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv(
      "IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST",
      " Granted@recidiviz.org , other@recidiviz.org ",
    );

    expect(isRecidivizStaffAuthorized("granted@recidiviz.org")).toBe(true);
    expect(isRecidivizStaffAuthorized("  GRANTED@Recidiviz.ORG ")).toBe(true);
  });

  it("denies an @recidiviz.org address that is not on the list", () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST", "granted@recidiviz.org");

    expect(isRecidivizStaffAuthorized("someone.else@recidiviz.org")).toBe(
      false,
    );
  });

  it("denies everyone when the list is unset or empty", () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST", "");

    expect(isRecidivizStaffAuthorized("granted@recidiviz.org")).toBe(false);
  });

  it("denies a listed address on another domain", () => {
    // Both halves are required, so a mis-set secret cannot hand staff access
    // to an arbitrary domain.
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv(
      "IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST",
      "attacker@example.com,cm@idoc.idaho.gov",
    );

    expect(isRecidivizStaffAuthorized("attacker@example.com")).toBe(false);
    expect(isRecidivizStaffAuthorized("cm@idoc.idaho.gov")).toBe(false);
  });

  it("does not authorize a lookalike domain", () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv(
      "IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST",
      "granted@recidiviz.org.example.com",
    );

    expect(
      isRecidivizStaffAuthorized("granted@recidiviz.org.example.com"),
    ).toBe(false);
  });
});

describe("isRecidivizStaffAuthorized in staging", () => {
  it("authorizes any @recidiviz.org address without a list entry", () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST", "");

    expect(isRecidivizStaffAuthorized("anyone@recidiviz.org")).toBe(true);
  });

  it("still denies every other domain", () => {
    vi.stubEnv("APP_ENV", "staging");

    expect(isRecidivizStaffAuthorized("cm@idoc.idaho.gov")).toBe(false);
    expect(isRecidivizStaffAuthorized("provider@example.com")).toBe(false);
  });
});
