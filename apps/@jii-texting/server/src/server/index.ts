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

import formbody from "@fastify/formbody";
import { setupFastifyErrorHandler } from "@sentry/node";
import Fastify from "fastify";

import registerRoutes from "~@jii-texting/server/server/routes";
import registerTwilioWebhooks from "~@jii-texting/server/server/webhooks";

export function buildServer() {
  // Instantiate Fastify with some config
  const server = Fastify({
    logger: true,
  });

  // Add this plugin to support application/x-www-form-urlencoded requests as made by Twilio
  server.register(formbody);

  // Ensure Sentry is setup before starting the server
  setupFastifyErrorHandler(server);

  registerTwilioWebhooks(server);
  registerRoutes(server);

  return server;
}
