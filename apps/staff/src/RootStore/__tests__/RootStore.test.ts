// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import createAuth0Client from "@auth0/auth0-spa-js";
import { Mock } from "vitest";

import RootStore from "..";

import.meta.env["VITE_SENTENCING_API_URL"] = ""; // For tRPC mock in `libs/sentencing-client`
const METADATA_NAMESPACE = import.meta.env.VITE_METADATA_NAMESPACE;

vi.mock("@auth0/auth0-spa-js");
vi.mock("../../FirestoreStore");
vi.mock("../../api/metrics");
vi.mock("../TenantStore", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      currentTenantId: "US_MO",
    })),
  };
});

describe("RootStore", () => {
  it("contains a TenantStore", () => {
    expect(RootStore.tenantStore).toBeDefined();
  });

  it("contains a UserStore", () => {
    expect(RootStore.userStore).toBeDefined();
  });

  it("contains a FirestoreStore", () => {
    expect(RootStore.firestoreStore).toBeDefined();
  });

  it("contains an AnalyticsStore", () => {
    expect(RootStore.analyticsStore).toBeDefined();
  });

  it("contains a currentTenantId", () => {
    expect(RootStore.currentTenantId).toBeDefined();
  });

  it("contains user", async () => {
    const metadataField = `${METADATA_NAMESPACE}app_metadata`;
    const user = {
      [metadataField]: { stateCode: "US_MO" },
      email_verified: true,
    };
    (createAuth0Client as Mock).mockResolvedValue({
      getUser: () => user,
      isAuthenticated: () => true,
      getTokenSilently: () => "token",
    });

    await RootStore.userStore.authorize(vi.fn());

    expect(RootStore.user).toBeDefined();
  });
});
