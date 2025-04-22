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

import { StateCode } from "@prisma/jii-texting/client";
import { FastifyInstance } from "fastify";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import { getAuthenticateInternalRequestPreHandlerFn } from "~@jii-texting/server/server/authUtils";
import { RequestWithStateCodeParam } from "~@jii-texting/server/server/types";

/**
 * Encapsulates the routes for the JII texting server
 * @param {FastifyInstance} server  Encapsulated Fastify Instance
 */
async function registerRoutes(server: FastifyInstance) {
  if (!process.env["GOOGLE_WORKFLOWS_SERVICE_ACCOUNT_EMAIL"]) {
    throw new Error(
      "Missing required environment variables for JII Texting Routes setup",
    );
  }

  // This should be the only user/email with access to these routes
  const email = process.env["GOOGLE_WORKFLOWS_SERVICE_ACCOUNT_EMAIL"];

  /**
   * Returns the most recent WorkflowExecution object
   * @param stateCode The state code that we're retrieving WorkflowExecution information for
   * @returns An object whose key is workflowExecution and value is the latest WorkflowExecution, null if none exist
   */
  server.get(
    "/workflow-executions/latest/:stateCode",
    {
      preHandler: [getAuthenticateInternalRequestPreHandlerFn(email)],
    },
    async (request: RequestWithStateCodeParam, response) => {
      const { stateCode: stateCodeStr } = request.params;
      const stateCode = stateCodeStr as StateCode;
      const prisma = getPrismaClientForStateCode(stateCode);

      const mostRecentWorkflowExecution =
        await prisma.workflowExecution.findFirst({
          orderBy: { workflowExecutionTime: "desc" },
          omit: {
            id: true,
          },
        });

      response.status(200).send({
        workflowExecution: mostRecentWorkflowExecution,
      });
    },
  );

  /**
   * Creates a WorkflowExecution object with the current date
   * @param stateCode The state code that we're executing the Workflow for
   * @returns The ID of the newly created WorkflowExecution
   */
  server.post(
    "/workflow-executions/:stateCode",
    {
      preHandler: [getAuthenticateInternalRequestPreHandlerFn(email)],
    },
    async (request: RequestWithStateCodeParam, response) => {
      const { stateCode: stateCodeStr } = request.params;
      const stateCode = stateCodeStr as StateCode;
      const prisma = getPrismaClientForStateCode(stateCode);

      const workflowExecution = await prisma.workflowExecution.create({
        data: {
          stateCode: stateCode,
          workflowExecutionTime: new Date(),
        },
      });

      response.status(200).send({
        workflowExecutionId: workflowExecution.id,
      });
    },
  );
}

export default registerRoutes;
