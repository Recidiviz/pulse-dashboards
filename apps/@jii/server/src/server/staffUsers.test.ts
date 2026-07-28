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

import { GoogleAuth } from "google-auth-library";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { checkAdminPanelPermissions } from "./staffUsers";

vi.mock("google-auth-library");

const mockRequest = vi.fn();
const mockGetIdTokenClient = vi.fn();

beforeEach(() => {
  vi.stubEnv("ADMIN_PANEL_IAP_AUDIENCE", "https://admin-panel.example.com");
  vi.stubEnv("ADMIN_PANEL_API_URL", "https://admin-panel.example.com/");

  mockGetIdTokenClient.mockResolvedValue({ request: mockRequest });
  // @ts-expect-error not passing a complete object here, only what we need to stub
  vi.mocked(GoogleAuth).mockReturnValue({
    getIdTokenClient: mockGetIdTokenClient,
  });
});

const testEmail = "test@state.gov";

describe("Admin panel user profile", () => {
  test("returns a profile when the user has JII access", async () => {
    mockRequest.mockResolvedValue({
      data: {
        stateCode: "US_OZ",
        district: "D1",
        allowedApps: { jii: true, staff: true },
        emailAddress: testEmail,
      },
    });

    const profile = await checkAdminPanelPermissions(testEmail);

    expect(profile).toEqual({
      stateCode: "US_OZ",
      district: "D1",
      permissions: ["enhanced", "live_data"],
    });
    // relies on Application Default Credentials rather than an explicit key
    expect(GoogleAuth).toHaveBeenCalledWith();
  });

  test("returns undefined when the user does not have JII access", async () => {
    mockRequest.mockResolvedValue({
      data: {
        stateCode: "US_OZ",
        district: "D1",
        allowedApps: { jii: false, staff: true },
        emailAddress: testEmail,
      },
    });

    expect(await checkAdminPanelPermissions(testEmail)).toBeUndefined();
  });

  test("omits live_data for ID test users", async () => {
    const idTestEmail = "test@recidiviz-test.org";
    mockRequest.mockResolvedValue({
      data: {
        stateCode: "US_ID",
        district: "D1",
        allowedApps: { jii: true, staff: true },
        emailAddress: idTestEmail,
      },
    });

    const profile = await checkAdminPanelPermissions(idTestEmail);

    expect(profile?.permissions).toEqual(["enhanced"]);
  });

  test("throws if required configuration is missing", async () => {
    vi.stubEnv("ADMIN_PANEL_API_URL", "");

    await expect(checkAdminPanelPermissions(testEmail)).rejects.toThrow(
      "missing configuration for Admin Panel access",
    );
  });
});
