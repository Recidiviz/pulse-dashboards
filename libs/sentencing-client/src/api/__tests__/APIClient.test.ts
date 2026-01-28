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

import { createMockSentencingStore } from "../../utils/test";
import { APIClient, tRPCClient } from "../APIClient";
import { CaseDetailsFixture, StaffInfoFixture } from "../offlineFixtures";

vi.mock("@trpc/client", () => ({
  createTRPCClient: vi.fn(),
  httpBatchLink: vi.fn(),
}));

const sentencingStore = createMockSentencingStore();
let mockTRPCClient: tRPCClient;
let apiClient: APIClient;
const caseId = Object.keys(CaseDetailsFixture)[0];

beforeEach(() => {
  // update to TRPC v11 broke the typing for this mock and it's not worth the effort to fix it. In an ideal world we would be using msw-trpc for mocking out requests
  // @ts-expect-error mockTRPCClient is a loose mock for testing purposes
  mockTRPCClient = {
    staff: {
      getStaff: {
        query: vi.fn().mockResolvedValue({
          ...StaffInfoFixture,
          sentencingAssessmentReports: undefined,
        }),
      },
      updateStaff: {
        mutate: vi.fn(),
      },
    },
    sar: {
      getSAR: {
        query: vi.fn(),
      },
      getSARsForStaff: {
        query: vi
          .fn()
          .mockResolvedValue(StaffInfoFixture.sentencingAssessmentReports),
      },
      updateSAR: {
        mutate: vi.fn(),
      },
      createEmploymentHistory: {
        mutate: vi.fn(),
      },
      updateEmploymentHistory: {
        mutate: vi.fn(),
      },
      deleteEmploymentHistory: {
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
  apiClient = new APIClient(sentencingStore);
});

test("client is initialized after instantiation of the SentencingStore and APIClient", () => {
  expect(apiClient.client).not.toBeUndefined();
});

test("client should not be initialized if there is no baseUrl", () => {
  const sentencingStore = createMockSentencingStore({ hideApiUrl: true });
  const apiClient = new APIClient(sentencingStore);

  expect(apiClient.client).toBeUndefined();
});

test("should throw an error if tRPC client is undefined", async () => {
  const sentencingStore = createMockSentencingStore();
  const apiClient = new APIClient(sentencingStore);

  await expect(apiClient.getStaffInfo()).rejects.toEqual({
    message: "No tRPC client initialized",
  });
});

test("should throw an error if staffPseudoId is undefined", async () => {
  const sentencingStore = createMockSentencingStore({
    userPseudoIdOverride: null,
  });
  const apiClient = new APIClient(sentencingStore);
  await apiClient.initTRPCClient();

  await expect(apiClient.getStaffInfo()).rejects.toEqual({
    message: "No staff pseudo id found",
  });
});

test("getStaffInfo and return data", async () => {
  // Add SAR access permission to routes
  sentencingStore.rootStore.userStore.routes.push(["sarAccess", true]);

  const result = await apiClient.getStaffInfo();
  expect(result).toStrictEqual(StaffInfoFixture);
  expect(mockTRPCClient.staff.getStaff.query).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.staff.getStaff.query).toHaveBeenCalledWith({
    pseudonymizedId: "TestID-123",
  });
  expect(mockTRPCClient.sar.getSARsForStaff.query).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.sar.getSARsForStaff.query).toHaveBeenCalledWith({
    staffPseudonymizedId: "TestID-123",
  });

  // Clean up - remove the route we added
  sentencingStore.rootStore.userStore.routes.pop();
});

test("getStaffInfo should not fetch SARs if user lacks sarAccess permission", async () => {
  // Ensure NO SAR access permission (don't add sarAccess to routes)
  const result = await apiClient.getStaffInfo();

  // Should still return staff data
  expect(mockTRPCClient.staff.getStaff.query).toHaveBeenCalledTimes(1);
  expect(mockTRPCClient.staff.getStaff.query).toHaveBeenCalledWith({
    pseudonymizedId: "TestID-123",
  });

  // Should NOT call SAR endpoint
  expect(mockTRPCClient.sar.getSARsForStaff.query).not.toHaveBeenCalled();

  // Should return empty array for SARs
  expect(result.sentencingAssessmentReports).toEqual([]);
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
