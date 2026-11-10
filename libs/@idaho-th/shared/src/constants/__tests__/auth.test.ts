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
  AUTH0_CONNECTION,
  getAuth0ConnectionForFlow,
  getAuth0RoleForFlow,
  isAllowlistedRecidivizStaffEmail,
  isIdocStaffEmail,
  isRecidivizStaffEmail,
  isStaffEmail,
  parseStaffEmailAllowlist,
  SIGN_IN_FLOW,
} from "~@idaho-th/shared";

describe("isIdocStaffEmail", () => {
  it("matches every Idaho staff domain, case and whitespace insensitively", () => {
    expect(isIdocStaffEmail("cm@idoc.idaho.gov")).toBe(true);
    expect(isIdocStaffEmail("  CM@IDDOC.onMicrosoft.COM  ")).toBe(true);
    expect(isIdocStaffEmail("cm@iddoc.onmicrosoft.com")).toBe(true);
  });

  it("does not match a lookalike domain", () => {
    expect(isIdocStaffEmail("cm@idaho.gov")).toBe(false);
    expect(isIdocStaffEmail("cm@notidoc.idaho.gov.example.com")).toBe(false);
    expect(isIdocStaffEmail("staffer@recidiviz.org")).toBe(false);
  });
});

describe("isStaffEmail", () => {
  it("treats idoc.idaho.gov emails as staff regardless of isStaging", () => {
    expect(isStaffEmail("cm@idoc.idaho.gov")).toBe(true);
    expect(isStaffEmail("cm@idoc.idaho.gov", true)).toBe(true);
  });

  it("treats the Entra staff domain as staff regardless of isStaging", () => {
    // iddoc.onmicrosoft.com is the Entra domain fetchUserRestrictions
    // rewrites before the roster lookup.
    expect(isStaffEmail("cm@iddoc.onmicrosoft.com")).toBe(true);
    expect(isStaffEmail("cm@iddoc.onmicrosoft.com", true)).toBe(true);
  });

  it("does not treat other .gov domains as staff", () => {
    expect(isStaffEmail("cm@some-agency.gov")).toBe(false);
    expect(isStaffEmail("cm@idaho.gov")).toBe(false);
    // A lookalike subdomain must not match through idoc.idaho.gov.
    expect(isStaffEmail("cm@notidoc.idaho.gov")).toBe(false);
  });

  it("treats @recidiviz.org as staff only when isStaging is true", () => {
    expect(isStaffEmail("staffer@recidiviz.org")).toBe(false);
    expect(isStaffEmail("staffer@recidiviz.org", true)).toBe(true);
  });

  it("treats non-.gov, non-recidiviz.org emails as provider", () => {
    expect(isStaffEmail("provider@example.com")).toBe(false);
  });

  it("ignores pentester fixture emails when isStaging is omitted or false", () => {
    expect(
      isStaffEmail("pentester-housing-case-manager-1@recidiviz-test.org"),
    ).toBe(false);
    expect(
      isStaffEmail(
        "pentester-housing-case-manager-1@recidiviz-test.org",
        false,
      ),
    ).toBe(false);
  });

  it("routes pentester CM fixture emails to the staff flow when isStaging is true", () => {
    expect(
      isStaffEmail("pentester-housing-case-manager-1@recidiviz-test.org", true),
    ).toBe(true);
    expect(
      isStaffEmail("pentester-housing-case-manager-2@recidiviz-test.org", true),
    ).toBe(true);
    expect(
      isStaffEmail("pentester-housing-case-manager-3@recidiviz-test.org", true),
    ).toBe(true);
  });

  it("routes pentester provider fixture emails to the provider flow even when isStaging is true", () => {
    expect(
      isStaffEmail("pentester-housing-provider-1@recidiviz-test.org", true),
    ).toBe(false);
  });

  it("does not match unrecognized user-type segments or malformed patterns", () => {
    expect(
      isStaffEmail("pentester-housing-admin-1@recidiviz-test.org", true),
    ).toBe(false);
    expect(
      isStaffEmail("pentester-housing-case-manager@recidiviz-test.org", true),
    ).toBe(false);
    expect(
      isStaffEmail("housing-case-manager-1@recidiviz-test.org", true),
    ).toBe(false);
  });

  it("does not match the fixture pattern on other domains", () => {
    expect(
      isStaffEmail(
        "pentester-housing-case-manager-1@recidiviz-test.org.evil.com",
        true,
      ),
    ).toBe(false);
  });
});

describe("isRecidivizStaffEmail", () => {
  it("does not treat lookalike domains as Recidiviz staff", () => {
    expect(isRecidivizStaffEmail("user@notrecidiviz.org")).toBe(false);
    expect(isRecidivizStaffEmail("recidiviz.org@evil.com")).toBe(false);
  });
});

describe("parseStaffEmailAllowlist", () => {
  it("treats an unset or blank secret as an empty allowlist", () => {
    expect(parseStaffEmailAllowlist()).toEqual([]);
    expect(parseStaffEmailAllowlist("")).toEqual([]);
    expect(parseStaffEmailAllowlist("  ,  ,")).toEqual([]);
  });

  it("normalizes and dedupes entries", () => {
    expect(
      parseStaffEmailAllowlist(
        " allowlisted.staff@recidiviz.org ,Allowlisted.Staff@Recidiviz.ORG ",
      ),
    ).toEqual(["allowlisted.staff@recidiviz.org"]);
  });
});

describe("isAllowlistedRecidivizStaffEmail", () => {
  const allowlist = ["allowlisted.staff@recidiviz.org"];

  it("allows an exact match, ignoring case and surrounding whitespace", () => {
    expect(
      isAllowlistedRecidivizStaffEmail(
        "allowlisted.staff@recidiviz.org",
        allowlist,
      ),
    ).toBe(true);
    expect(
      isAllowlistedRecidivizStaffEmail(
        "  allowlisted.staff@recidiviz.org ",
        allowlist,
      ),
    ).toBe(true);
  });

  it("denies everyone when the allowlist is empty", () => {
    expect(
      isAllowlistedRecidivizStaffEmail("allowlisted.staff@recidiviz.org", []),
    ).toBe(false);
  });

  it("denies other Recidiviz staff who are not allowlisted", () => {
    expect(
      isAllowlistedRecidivizStaffEmail("someone@recidiviz.org", allowlist),
    ).toBe(false);
  });

  it("denies a non-recidiviz.org address even if the secret lists it", () => {
    expect(
      isAllowlistedRecidivizStaffEmail("attacker@evil.com", [
        "attacker@evil.com",
      ]),
    ).toBe(false);
    expect(
      isAllowlistedRecidivizStaffEmail(
        "allowlisted.staff@recidiviz.org.evil.com",
        ["allowlisted.staff@recidiviz.org.evil.com"],
      ),
    ).toBe(false);
  });
});

describe("getAuth0ConnectionForFlow", () => {
  it("routes the staff SSO flow to the IDOC connection in production", () => {
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.STAFF_SSO, true)).toBe(
      AUTH0_CONNECTION.IDOC_SSO,
    );
  });

  it("falls back to the database connection for the staff SSO flow outside production", () => {
    // Staging is a separate tenant without the IDOC connection and local dev
    // points at neither, so only production may name it.
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.STAFF_SSO, false)).toBe(
      AUTH0_CONNECTION.STAFF_DATABASE,
    );
  });

  it("defaults to the non-production connection when the environment is unknown", () => {
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.STAFF_SSO)).toBe(
      AUTH0_CONNECTION.STAFF_DATABASE,
    );
  });

  it("never resolves a flow to an empty connection", () => {
    for (const flow of Object.values(SIGN_IN_FLOW)) {
      expect(getAuth0ConnectionForFlow(flow)).toBeTruthy();
      expect(getAuth0ConnectionForFlow(flow, true)).toBeTruthy();
    }
  });

  it("routes the staff database flow to the database connection in both environments", () => {
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.STAFF_DATABASE)).toBe(
      AUTH0_CONNECTION.STAFF_DATABASE,
    );
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.STAFF_DATABASE, true)).toBe(
      AUTH0_CONNECTION.STAFF_DATABASE,
    );
  });

  it("routes the provider flow to the passwordless magic-link connection", () => {
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.PROVIDER)).toBe(
      AUTH0_CONNECTION.PASSWORDLESS_EMAIL,
    );
    expect(getAuth0ConnectionForFlow(SIGN_IN_FLOW.PROVIDER, true)).toBe(
      AUTH0_CONNECTION.PASSWORDLESS_EMAIL,
    );
  });
  it("routes the Recidiviz staff one-time-code flow to the passwordless connection", () => {
    expect(
      getAuth0ConnectionForFlow(SIGN_IN_FLOW.RECIDIVIZ_STAFF_PASSWORDLESS),
    ).toBe(AUTH0_CONNECTION.PASSWORDLESS_EMAIL);
  });
});

describe("getAuth0RoleForFlow", () => {
  it("names the role for both flows on the passwordless connection", () => {
    expect(getAuth0RoleForFlow(SIGN_IN_FLOW.RECIDIVIZ_STAFF_PASSWORDLESS)).toBe(
      "staff",
    );
    expect(getAuth0RoleForFlow(SIGN_IN_FLOW.PROVIDER)).toBe("provider");
  });

  it("sends no role for the staff connections, which decide it on their own", () => {
    expect(getAuth0RoleForFlow(SIGN_IN_FLOW.STAFF_DATABASE)).toBeUndefined();
    expect(getAuth0RoleForFlow(SIGN_IN_FLOW.STAFF_SSO)).toBeUndefined();
  });
});
