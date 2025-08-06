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

import { getPrismaClientForStateCode } from "~@reentry/prisma";
import { Prisma, StateCode } from "~@reentry/prisma/client";
import { verifyGoogleIdToken } from "~@reentry/server/server/utils";
import { appRouter, createContext } from "~@reentry/trpc";
import { buildCommonServer } from "~server-setup-plugin";

interface IQuerystring {
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
  access_token: string;
  last_intake_id: string | null;
}

interface ToggleIntakeBody {
  stateCode: string;
  clientPseudoId: string;
  enable: boolean;
}

export function buildServer() {
  const jwtKey = process.env["INTAKE_PRIVATE_JWT_KEY"];
  if (!jwtKey) {
    throw new Error("Missing required environment variables for jwt");
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    useWSS: true, // Enable WebSocket support
    jwtOptions: { key: jwtKey },
    trpcPrefix: "trpc",
  });

  server.get<{
    Querystring: IQuerystring;
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

    if (!client?.intakeEnabled) {
      res
        .status(403)
        .send(
          `No client found with name ${req.query.givenNames} ${req.query.surname} and date of birth ${birthDateString} or intake is not enabled for this client.`,
        );
      return;
    }
    const token = server.jwt.sign({
      pseudonymizedId: client.pseudonymizedId,
    });

    return token;
  });

  server.post<{ Body: GetIntakeTokenBody }>(
    "/get-intake-token",
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
          givenNames: first_name,
          surname: last_name,
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

      const token = server.jwt.sign({
        pseudonymizedId: client.pseudonymizedId,
      });

      const lastIntakeId =
        client.Intake?.[client.Intake?.length - 1]?.id || null;

      const response: GetIntakeTokenResponse = {
        access_token: token,
        last_intake_id: lastIntakeId,
      };

      return res.send(response);
    },
  );

  server.post<{
    Body: ToggleIntakeBody;
  }>("/toogle-enable-intake", async (req, res) => {
    const { stateCode, clientPseudoId, enable } = req.body;

    const allowedEmail = process.env["ALLOWED_GOOGLE_EMAIL"];

    if (!allowedEmail) {
      res.status(500).send("ALLOWED_GOOGLE_EMAIL is not set");
      return;
    }

    try {
      await verifyGoogleIdToken(req.headers.authorization, allowedEmail);
    } catch (e) {
      let message = e;
      if (e instanceof Error) {
        message = e.message;
      }

      res.status(401).send(message);
    }

    if (!Object.values(StateCode).includes(stateCode as StateCode)) {
      res.status(404).send("Invalid state code");
      return;
    }

    const prisma = getPrismaClientForStateCode(req.body.stateCode);

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
  });

  return server;
}
