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

import { createTRPCClient } from "@trpc/client";
import { beforeEach, expect, Mock, vi } from "vitest";

import { createMockPSIStore } from "../../utils/test";
import { APIClient, tRPCClient } from "../APIClient";
import { CaseDetailsFixture, StaffInfoFixture } from "../offlineFixtures";

vi.mock("@trpc/client", () => ({
  createTRPCClient: vi.fn(),
  httpBatchLink: vi.fn(),
}));

const psiStore = createMockPSIStore();
let mockTRPCClient: tRPCClient;
let apiClient: APIClient;
const caseId = Object.keys(CaseDetailsFixture)[0];

beforeEach(() => {
  // update to TRPC v11 broke the typing for this mock and it's not worth the effort to fix it. In an ideal world we would be using msw-trpc for mocking out requests
  // @ts-expect-error: mockTRPCClient is a loose mock for testing purposes
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
        query: vi.fn().mockResolvedValue(CaseDetailsFixture[caseId]),
      },
      updateCase: {
        mutate: vi.fn(),
      },
    },
    opportunity: {
      getOpportunities: {
        query: vi.fn(),
      },
    },
    offense: {
      getOffenses: {
        query: vi.fn(),
      },
    },
    county: {
      getCounties: {
        query: vi.fn(),
      },
    },
    insight: {
      getInsight: {
        query: vi.fn(),
      },
    },
    supervisor: {
      getSupervisor: {
        query: vi.fn(),
      },
    },
  };
  (createTRPCClient as Mock).mockReturnValue(mockTRPCClient);
  apiClient = new APIClient(psiStore);
});

test("client is initialized after instantiation of the PSIStore and APIClient", () => {
  expect(apiClient.client).not.toBeUndefined();
});

test("client should not be initialized if there is no baseUrl", () => {
  const psiStore = createMockPSIStore({ hideApiUrl: true });
  const apiClient = new APIClient(psiStore);

  expect(apiClient.client).toBeUndefined();
});

test("should throw an error if tRPC client is undefined", async () => {
  const psiStore = createMockPSIStore();
  const apiClient = new APIClient(psiStore);

  await expect(apiClient.getStaffInfo()).rejects.toEqual({
    message: "No tRPC client initialized",
  });
});

test("should throw an error if staffPseudoId is undefined", async () => {
  const psiStore = createMockPSIStore({ userPseudoIdOverride: null });
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

test("setIsFirstLogin calls the updateStaff endpoint with the correct arguments", async () => {
  const pseudoId = StaffInfoFixture.pseudonymizedId;
  await apiClient.setIsFirstLogin(pseudoId);
  expect(mockTRPCClient.staff.updateStaff.mutate).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.staff.updateStaff.mutate).toHaveBeenCalledWith({
    pseudonymizedId: pseudoId,
    hasLoggedIn: true,
  });
});

test("getCaseDetails returns data", async () => {
  const result = await apiClient.getCaseDetails(caseId);
  expect(result).toStrictEqual(CaseDetailsFixture[caseId]);
  expect(mockTRPCClient.case.getCase.query).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.case.getCase.query).toHaveBeenCalledWith({
    id: caseId,
  });
});

test("updateCaseDetails calls the updateCase endpoint with the correct arguments", async () => {
  const updates = { lsirScore: 45 };
  await apiClient.updateCaseDetails(caseId, updates);
  expect(mockTRPCClient.case.updateCase.mutate).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.case.updateCase.mutate).toHaveBeenCalledWith({
    id: caseId,
    attributes: updates,
  });
});
