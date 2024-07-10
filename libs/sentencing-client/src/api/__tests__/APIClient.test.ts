// // Recidiviz - a data platform for criminal justice reform
// // Copyright (C) 2024 Recidiviz, Inc.
// //
// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.
// //
// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU General Public License for more details.
// //
// // You should have received a copy of the GNU General Public License
// // along with this program.  If not, see <https://www.gnu.org/licenses/>.
// // =============================================================================

import { createTRPCProxyClient } from "@trpc/client";
import { beforeEach, expect, Mock, vi } from "vitest";

import { createMockPSIStore } from "../../utils/test";
import { APIClient, tRPCClient } from "../APIClient";
import { CaseDetailsFixture, StaffInfoFixture } from "../offlineFixtures";

vi.mock("@trpc/client", () => ({
  createTRPCProxyClient: vi.fn(),
  httpBatchLink: vi.fn(),
}));

const psiStore = createMockPSIStore();
let mockTRPCClient: tRPCClient;
let apiClient: APIClient;

beforeEach(() => {
  mockTRPCClient = {
    staff: {
      getStaff: {
        query: vi.fn().mockResolvedValue(StaffInfoFixture),
      },
      updateStaff: {
        mutate: vi.fn(),
      },
    },
    case: {
      getCase: {
        query: vi.fn().mockResolvedValue(CaseDetailsFixture),
      },
      updateCase: {
        mutate: vi.fn(),
      },
    },
  };
  (createTRPCProxyClient as Mock).mockReturnValue(mockTRPCClient);
  apiClient = new APIClient(psiStore);
});

test("client is initialized after instantiation of the PSIStore and APIClient", () => {
  expect(apiClient.client).not.toBeUndefined();
});

test("getRequestHeaders returns expected request headers with Auth0 token", async () => {
  const requestHeaders = await apiClient.getRequestHeaders();
  expect(requestHeaders).toEqual({
    Authorization: "Bearer auth0-token",
  });
});

test("should throw an error if tRPC client is undefined", async () => {
  const psiStore = createMockPSIStore(null);
  const apiClient = new APIClient(psiStore);

  await expect(apiClient.getStaffInfo()).rejects.toEqual({
    message: "No tRPC client initialized",
  });
});

test("should throw an error if staffPseudoId is undefined", async () => {
  const psiStore = createMockPSIStore(null);
  const apiClient = new APIClient(psiStore);
  await apiClient.initTRPCClient();

  await expect(apiClient.getStaffInfo()).rejects.toEqual({
    message: "No staff pseudo id found",
  });
});

test("getStaffInfo and return data", async () => {
  const result = await apiClient.getStaffInfo();
  expect(result).toBe(StaffInfoFixture);
  expect(mockTRPCClient.staff.getStaff.query).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.staff.getStaff.query).toHaveBeenCalledWith({
    pseudonymizedId: "TestID-123",
  });
});

test("getCaseDetails returns data", async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];
  const result = await apiClient.getCaseDetails(caseId);
  expect(result).toBe(CaseDetailsFixture);
  expect(mockTRPCClient.case.getCase.query).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.case.getCase.query).toHaveBeenCalledWith({
    id: caseId,
  });
});
