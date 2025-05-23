// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  mockGetPayload,
  testPrismaClient,
  testServer,
} from "~@jii-texting/server/test/setup";
import { testAndGetSentryReports } from "~@jii-texting/server/test/setup/utils";
import { fakeWorkflowExecutionOne } from "~@jii-texting/utils/test/constants";

vi.stubEnv("GOOGLE_WORKFLOWS_SERVICE_ACCOUNT_EMAIL", "valid@example.com");

describe("GET /workflow-executions/latest/US_ID", () => {
  describe("authenticated requests", () => {
    beforeEach(() => {
      mockGetPayload.mockReturnValueOnce({
        email_verified: true,
        email: "valid@example.com",
      });
    });

    test("returns 200 and null on initial request", async () => {
      const response = await testServer.inject({
        method: "GET",
        url: "/workflow-executions/latest/US_ID",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      expect(JSON.parse(response.body)).toMatchObject({
        workflowExecution: null,
      });
    });

    test("returns 200 and object", async () => {
      const stateCode = "US_ID";

      await testPrismaClient.workflowExecution.create({
        data: { ...fakeWorkflowExecutionOne },
      });

      const response = await testServer.inject({
        method: "GET",
        url: `/workflow-executions/latest/${stateCode}`,
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(JSON.parse(response.body)).toMatchObject({
        workflowExecution: {
          stateCode: stateCode,
          workflowExecutionTime:
            fakeWorkflowExecutionOne.workflowExecutionTime.toISOString(),
        },
      });
    });
  });

  describe("unauthenticated requests", () => {
    test("should return 400 if state code is invalid", async () => {
      const response = await testServer.inject({
        method: "GET",
        url: "/workflow-executions/latest/XX", // Invalid state code
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: "Invalid state code",
      });

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "Invalid state code received: XX",
      );
    });

    test("should return 403 if email invalid", async () => {
      mockGetPayload.mockReturnValueOnce({
        email_verified: true,
        email: "fake@fake.com",
      });

      const response = await testServer.inject({
        method: "GET",
        url: "/workflow-executions/latest/US_ID",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: "Invalid token",
      });

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "error verifying auth token: Error: Invalid email address",
      );
    });

    test("should return 403 if no email associated with token", async () => {
      mockGetPayload.mockReturnValueOnce({
        email_verified: true,
      });

      const response = await testServer.inject({
        method: "GET",
        url: "/workflow-executions/latest/US_ID", // Invalid state code
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: "Invalid token",
      });

      const sentryReports = await testAndGetSentryReports();
      expect(sentryReports[0].error?.message).toContain(
        "error verifying auth token: Error: Email not verified",
      );
    });
  });
});

describe("POST /workflows-executions", () => {
  describe("authenticated requests", () => {
    beforeEach(() => {
      mockGetPayload.mockReturnValueOnce({
        email_verified: true,
        email: "valid@example.com",
      });
    });

    test("workflow execution created", async () => {
      const response = await testServer.inject({
        method: "POST",
        url: "/workflow-executions/US_ID",
      });

      const execution = await testPrismaClient.workflowExecution.findFirst({
        where: {
          id: JSON.parse(response.body).id,
        },
      });

      expect(execution).toBeDefined();
    });
  });
});

describe("GET /utils/is-weekend", () => {
  beforeEach(() => {
    mockGetPayload.mockReturnValueOnce({
      email_verified: true,
      email: "valid@example.com",
    });
  });

  test("is weekend", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-04-20T00:00:00.000Z"));
    const response = await testServer.inject({
      method: "GET",
      url: "/utils/is-weekend",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    expect(JSON.parse(response.body)).toMatchObject({
      date: "2025-04-20",
      isWeekend: true,
    });
    vi.useRealTimers();
  });

  test("input is weekend", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/utils/is-weekend?date=2025-04-20T12:50:33.000000Z",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    expect(JSON.parse(response.body)).toMatchObject({
      date: "2025-04-20",
      isWeekend: true,
    });
  });

  test("is weekday", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-04-23T00:00:00.000Z"));
    const response = await testServer.inject({
      method: "GET",
      url: "/utils/is-weekend",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    expect(JSON.parse(response.body)).toMatchObject({
      date: "2025-04-23",
      isWeekend: false,
    });
    vi.useRealTimers();
  });

  test("input is weekday", async () => {
    const response = await testServer.inject({
      method: "GET",
      url: "/utils/is-weekend?date=2025-04-22T12:50:33.000000Z",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    expect(JSON.parse(response.body)).toMatchObject({
      date: "2025-04-22",
      isWeekend: false,
    });
  });
});
