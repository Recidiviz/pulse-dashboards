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

import { caller, mockCtx } from "../../../../test/mockResidentProcedure";
import { resourceApiClient } from "./resourceApiClient";

vi.mock("./resourceApiClient", () => ({
  resourceApiClient: {
    getOrganizations: vi.fn(),
    getOrganization: vi.fn(),
  },
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("getResources", () => {
  test("passes ctx.stateCode to resourceApiClient", async () => {
    mockCtx.stateCode = "US_NYC";

    await caller.resources.getResources();

    expect(resourceApiClient.getOrganizations).toHaveBeenCalledWith("US_NYC");
  });
});

describe("getResource", () => {
  test("passes organizationId to resourceApiClient", async () => {
    await caller.resources.getResource({ organizationId: 42 });

    expect(resourceApiClient.getOrganization).toHaveBeenCalledWith(42);
  });
});
