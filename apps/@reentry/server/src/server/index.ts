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

import jwt from "jsonwebtoken";

import { getPrismaClientForStateCode } from "~@reentry/prisma";
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

export function buildServer() {
  if (!process.env["AUTH0_DOMAIN"] || !process.env["AUTH0_AUDIENCE"]) {
    throw new Error("Missing required environment variables for Auth0");
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    auth0Options: {
      domain: process.env["AUTH0_DOMAIN"],
      audience: process.env["AUTH0_AUDIENCE"],
    },
    useWSS: true, // Enable WebSocket support
    trpcPrefix: "trpc",
  });

  server.get<{
    Querystring: IQuerystring;
  }>("/get-intake-token", async (req, res) => {
    const secretKey = process.env["AUTH0_INTAKE_PRIVATE_KEY"];
    if (!secretKey) {
      res.status(500).send("AUTH0_INTAKE_PRIVATE_KEY is not set");
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

    const token = jwt.sign(
      {
        pseudonymizedId: client.pseudonymizedId,
      },
      secretKey,
    );

    return token;
  });

  return server;
}
