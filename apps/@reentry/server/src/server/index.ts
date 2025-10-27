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

import { FastifyReply, FastifyRequest } from "fastify";

import { getChatHistoryForClient } from "~@reentry/intake-agent/utils";
import { getPrismaClientForStateCode } from "~@reentry/prisma";
import { Prisma, StateCode } from "~@reentry/prisma/client";
import {
  RequestWithStateCodeParams,
  RequestWithStateCodeStaffIdParams,
} from "~@reentry/server/server/types";
import { getAuthenticateInternalRequestPreHandlerFn } from "~@reentry/server/server/utils";
import { appRouter, createContext } from "~@reentry/trpc";
import { buildCommonServer } from "~server-setup-plugin";

interface GetIntakeTokenQueryString {
  stateCode: string;
  givenNames: string;
  surname: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
}
interface GetIntakeTokenBody {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  state_code: string;
}
interface GetIntakeTokenResponse {
  token: string;
  clientPseudoId: string;
}

interface ToggleIntakeBody {
  clientPseudoId: string;
  enable: boolean;
}

interface GetIntakeForClientQueryString {
  clientPseudoId: string;
}

export function buildServer() {
  const jwtKey = process.env["INTAKE_PRIVATE_JWT_KEY"];
  if (!jwtKey) {
    throw new Error("Missing required environment variables for jwt");
  }

  const allowedEmail = process.env["ALLOWED_GOOGLE_EMAIL"];

  if (!allowedEmail) {
    throw new Error(
      "Missing required environment variables for Google ID token verification",
    );
  }

  if (!process.env["AUTH0_DOMAIN"] || !process.env["AUTH0_AUDIENCE"]) {
    throw new Error("Missing required environment variables for Auth0");
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    useWSS: true, // Enable WebSocket support
    jwtOptions: {
      key: jwtKey,
    },
    auth0Options: {
      domain: process.env["AUTH0_DOMAIN"],
      audience: process.env["AUTH0_AUDIENCE"],
    },
    trpcPrefix: "trpc",
  });

  server.decorate(
    "authenticateJwt",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ authorized: false, error: err });
      }
    },
  );

  // TODO: Remove endpoint when switching to V2
  server.get<{
    Querystring: GetIntakeTokenQueryString;
  }>("/get-intake-token", async (req, res) => {
    const secretKey = process.env["INTAKE_PRIVATE_JWT_KEY"];
    if (!secretKey) {
      res.status(500).send("INTAKE_PRIVATE_JWT_KEY is not set");
      return;
    }

    const prisma = getPrismaClientForStateCode(req.query.stateCode);

    const birthDateString = `${req.query.birthYear}-${req.query.birthMonth}-${req.query.birthDay}`;

    // Get the most recent active intake for the client based on given names and birth date
    const client = await prisma.client.findFirst({
      where: {
        givenNames: req.query.givenNames,
        surname: req.query.surname,
        birthDate: new Date(birthDateString),
      },
      select: {
        intakeEnabled: true,
        pseudonymizedId: true,
      },
    });

    if (!client) {
      res
        .status(403)
        .send(
          `No client found with name ${req.query.givenNames} ${req.query.surname} and date of birth ${birthDateString}`,
        );
      return;
    }
    if (!client.intakeEnabled) {
      res.status(403).send(`Intake is not enabled for this client.`);
      return;
    }

    const token = server.jwt.regular.sign({
      pseudonymizedId: client.pseudonymizedId,
      sub: client.pseudonymizedId,
      token_type: "client",
      login_timestamp: Date.now() / 1000,
    });

    return token;
  });

  server.post<{ Body: GetIntakeTokenBody }>(
    "/get-intake-token",
    { onRequest: [], preValidation: [], preHandler: [] },
    async (req, res) => {
      const { first_name, last_name, date_of_birth, state_code } = req.body;
      const birthDate = new Date(date_of_birth);
      const secretKey = process.env["INTAKE_PRIVATE_JWT_KEY"];

      if (!secretKey) {
        res.status(500).send("INTAKE_PRIVATE_JWT_KEY is not set");
        return;
      }

      const prisma = getPrismaClientForStateCode(state_code);

      const client = await prisma.client.findFirst({
        where: {
          givenNames: { equals: first_name, mode: "insensitive" },
          surname: { equals: last_name, mode: "insensitive" },
          birthDate,
        },
        select: {
          intakeEnabled: true,
          pseudonymizedId: true,
          Intake: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!client?.intakeEnabled) {
        res
          .status(403)
          .send(
            `No client found with name ${first_name} ${last_name} and date of birth ${date_of_birth}, or intake is not enabled.`,
          );
        return;
      }

      const token = server.jwt.regular.sign({
        clientPseudoId: client.pseudonymizedId,
        stateCode: state_code,
        sub: client.pseudonymizedId,
        token_type: "client",
        login_timestamp: Date.now() / 1000,
      });

      if (!token) {
        res.status(500).send("Failed to generate JWT token");
        return;
      }

      const response: GetIntakeTokenResponse = {
        token,
        clientPseudoId: client.pseudonymizedId,
      };

      return res.status(200).send(response);
    },
  );

  server.get<{
    Params: RequestWithStateCodeStaffIdParams;
  }>(
    "/clients-intake-status/:stateCode/:staffId",
    {
      preHandler: server.authenticate,
    },
    async (req, res) => {
      const { stateCode, staffId } = req.params;

      if (!stateCode || !staffId) {
        return res.status(400).send("Missing stateCode or staffId");
      }

      if (isNaN(+staffId)) {
        return res.status(400).send("Invalid staffId");
      }

      const prisma = getPrismaClientForStateCode(stateCode);

      const clients = await prisma.client.findMany({
        where: {
          staff: {
            some: {
              staffId: +staffId,
            },
          },
        },
        include: {
          Intake: true,
        },
      });

      if (!clients.length) {
        return res.status(404).send("No clients found for staffId: " + staffId);
      }

      const clientToStatus: Record<string, string> = {};

      clients.forEach((client) => {
        const intake = client.Intake[client.Intake.length - 1];
        if (intake) {
          clientToStatus[client.pseudonymizedId] = "intake_in_progress";
        } else if (client.intakeEnabled) {
          clientToStatus[client.pseudonymizedId] = "intake_enabled";
        } else {
          clientToStatus[client.pseudonymizedId] = "new";
        }
      });

      return res.status(200).send(clientToStatus);
    },
  );

  server.post<{
    Body: ToggleIntakeBody;
    Params: RequestWithStateCodeParams;
  }>(
    "/toggle-enable-intake/:stateCode",
    {
      preHandler: [getAuthenticateInternalRequestPreHandlerFn(allowedEmail)],
    },
    async (req, res) => {
      const { stateCode } = req.params;
      const { clientPseudoId, enable } = req.body;

      const prisma = getPrismaClientForStateCode(stateCode);

      try {
        await prisma.client.update({
          where: {
            stateCode: stateCode as StateCode,
            pseudonymizedId: clientPseudoId,
          },
          data: {
            intakeEnabled: enable,
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          res.status(404).send("Client not found");
          return;
        }
      }
    },
  );

  // TODO: Remove endpoint when switching to V2
  server.get<{
    Querystring: GetIntakeForClientQueryString;
    Params: RequestWithStateCodeParams;
  }>(
    "/get-intake-for-client/:stateCode",
    {
      preHandler: [getAuthenticateInternalRequestPreHandlerFn(allowedEmail)],
    },
    async (req, res) => {
      const { stateCode } = req.params;
      const { clientPseudoId } = req.query;

      const prisma = getPrismaClientForStateCode(stateCode);

      const intake = await prisma.intake.findFirst({
        select: {
          id: true,
          startDate: true,
          endDate: true,
          config: true,
        },
        where: {
          client: {
            pseudonymizedId: clientPseudoId,
          },
        },
      });

      if (!intake) {
        res.status(404).send("Intake not found");
        return;
      }

      const { messages } = await getChatHistoryForClient(intake.id, stateCode);

      res.send({ ...intake, messages });
    },
  );

  return server;
}
