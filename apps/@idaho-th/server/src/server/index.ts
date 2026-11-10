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

import type { FastifyRequest, RouteOptions } from "fastify";

import { registerHealthRoute } from "~@idaho-th/server/routes/health";
import { registerInternalRoutes } from "~@idaho-th/server/routes/internal";
import { releaseServerResources } from "~@idaho-th/server/server/releaseResources";
import { IDAHO_TH_TRPC_PATH } from "~@idaho-th/shared";
import { appRouter, createContext } from "~@idaho-th/trpc";
import { warmPdfSorterPool } from "~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import { buildCommonServer } from "~server-setup-plugin";

type RouteOptionsWithLogSerializers = RouteOptions & {
  logSerializers?: Record<string, (value: FastifyRequest) => unknown>;
};

export function buildServer() {
  if (!process.env["AUTH0_DOMAIN"] || !process.env["AUTH0_AUDIENCE"]) {
    throw new Error("Missing required environment variables for Auth0");
  }

  const server = buildCommonServer({
    appRouter,
    createContext,
    trpcPrefix: IDAHO_TH_TRPC_PATH,
    allowMethodOverride: true,
    auth0Options: {
      domain: process.env["AUTH0_DOMAIN"],
      audience: process.env["AUTH0_AUDIENCE"],
    },
  });

  server.addHook("onRoute", (routeOptions: RouteOptionsWithLogSerializers) => {
    routeOptions.bodyLimit = 10 * 1024 * 1024;
    routeOptions.logSerializers = {
      req: (req) => ({
        method: req.method,
        url: req.url?.split("?")[0],
        host: req.host,
        remoteAddress: req.ip,
        remotePort: req.socket?.remotePort,
      }),
    };
  });

  registerInternalRoutes(server);
  // Unlike the internal routes above, intentionally public — backs the LB
  // uptime check and the Cloud Run startup probe.
  registerHealthRoute(server);

  // Starts building the PDF sorter worker pool now (including the one-time
  // esbuild dev-bundle step) instead of on whichever upload request happens
  // to arrive first.
  warmPdfSorterPool(getLogger("pdf-sorter-pool-warmup"));

  server.addHook("onClose", releaseServerResources);

  return server;
}
