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

import { describe, test } from "vitest";

import { fakeWorkflowExecutionOne } from "~@jii-texting-server/utils/test/constants";
import { testPrismaClient, testServer } from "~jii-texting-server/test/setup";

describe("/workflow-executions", () => {
  describe("GET requests", () => {
    test("returns 200 and null on initial request", async () => {
      // Assumes the test DB is not seeded with any WorkflowExecution objects
      const response = await testServer.inject({
        method: "GET",
        url: "/workflow-executions/latest/US_ID",
      });

      expect(response).toMatchObject({
        statusCode: 200,
      });

      expect(JSON.parse(response.body)).toMatchObject({
        workflowExecution: null,
      });
    });

    test("returns 400 on invalid state code", async () => {
      // Assumes the test DB is not seeded with any WorkflowExecution objects
      const response = await testServer.inject({
        method: "GET",
        url: "/workflow-executions/latest/US_XX",
      });

      expect(response).toMatchObject({
        statusCode: 400,
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
