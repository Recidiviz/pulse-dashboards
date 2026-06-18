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

import { isDemoMode } from "~client-env-utils";

import { resolveCurrentUserName } from "../utils";

vi.mock("~client-env-utils");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("resolveCurrentUserName", () => {
  describe("in demo mode", () => {
    beforeEach(() => {
      vi.mocked(isDemoMode).mockReturnValue(true);
    });

    test("returns name from workflowsUserInfo when provided", () => {
      expect(
        resolveCurrentUserName(
          { userFullName: "", userFullNameFromAdminPanel: "Admin Panel Name" },
          { givenNames: "Kevin", surname: "Ruffin" },
        ),
      ).toBe("Kevin Ruffin");
    });

    test("falls back to userFullName when workflowsUserInfo names are empty", () => {
      expect(
        resolveCurrentUserName(
          { userFullName: "Demo User", userFullNameFromAdminPanel: "" },
          { givenNames: "", surname: "" },
        ),
      ).toBe("Demo User");
    });

    test("returns userFullName when workflowsUserInfo is not provided", () => {
      expect(
        resolveCurrentUserName({
          userFullName: "Demo User",
          userFullNameFromAdminPanel: "Admin Panel Name",
        }),
      ).toBe("Demo User");
    });

    test("returns Admin Panel Name when userFullName is not set and workflowsUserInfo is empty", () => {
      expect(
        resolveCurrentUserName(
          {
            userFullName: undefined,
            userFullNameFromAdminPanel: "Admin Panel Name",
          },
          { givenNames: "", surname: "" },
        ),
      ).toBe("Admin Panel Name");
    });
  });

  describe("outside demo mode", () => {
    const mockStaffRecord = { officerExternalId: "123" };

    beforeEach(() => {
      vi.mocked(isDemoMode).mockReturnValue(false);
    });

    test("returns undefined when staffRecord is not provided", () => {
      expect(
        resolveCurrentUserName({
          userFullName: "Full Name",
          userFullNameFromAdminPanel: "Admin Panel Name",
        }),
      ).toBeUndefined();
    });

    test("returns userFullNameFromAdminPanel when staffRecord is provided", () => {
      expect(
        resolveCurrentUserName(
          {
            userFullName: "Full Name",
            userFullNameFromAdminPanel: "Admin Panel Name",
          },
          undefined,
          mockStaffRecord,
        ),
      ).toBe("Admin Panel Name");
    });

    test("falls back to userFullName when userFullNameFromAdminPanel is not set", () => {
      expect(
        resolveCurrentUserName(
          {
            userFullName: "Full Name",
            userFullNameFromAdminPanel: undefined as unknown as string,
          },
          undefined,
          mockStaffRecord,
        ),
      ).toBe("Full Name");
    });
  });
});
