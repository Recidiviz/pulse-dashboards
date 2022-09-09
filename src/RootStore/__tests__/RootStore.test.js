// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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
import RootStore from "../RootStore";
import { useAuth0 } from "../../react-auth0-spa";
import { METADATA_NAMESPACE } from "../../utils/authentication/user";

let rootStore;

jest.mock("../../react-auth0-spa");

const metadataField = `${METADATA_NAMESPACE}app_metadata`;

describe("RootStore", () => {
  const mockUser = { [metadataField]: { state_code: "US_MO" } };
  useAuth0.mockReturnValue({ user: mockUser });

  beforeEach(() => {
    rootStore = new RootStore();
  });

  it("contains a FiltersStore", () => {
    expect(rootStore.filtersStore).toBeDefined();
  });

  it("contains a TenantStore", () => {
    expect(rootStore.tenantStore).toBeDefined();
  });

  it("contains a currentTenantId", () => {
    expect(rootStore.currentTenantId).toBeDefined();
  });

  it("contains filters", () => {
    expect(rootStore.filters).toBeDefined();
  });
});
