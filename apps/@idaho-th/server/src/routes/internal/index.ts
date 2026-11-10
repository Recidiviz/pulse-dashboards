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

import type { FastifyInstance } from "fastify";

import { registerCheckProviderProvisionedRoute } from "~@idaho-th/server/routes/internal/checkProviderProvisioned";
import { registerCheckRecidivizStaffRoute } from "~@idaho-th/server/routes/internal/checkRecidivizStaff";
import { registerCheckStaffAuthorizedRoute } from "~@idaho-th/server/routes/internal/checkStaffAuthorized";
import { registerGcsObjectScannedRoute } from "~@idaho-th/server/routes/internal/gcsObjectScanned";
import { registerLinkProviderRoute } from "~@idaho-th/server/routes/internal/linkProvider";
import { registerLinkStaffRoute } from "~@idaho-th/server/routes/internal/linkStaff";

/**
 * Internal webhooks — not protected by JWT; each route verifies its own caller
 * (Auth0 Action shared secret, or a Google-signed OIDC token for GCP-originated
 * calls).
 */
export function registerInternalRoutes(server: FastifyInstance) {
  registerLinkProviderRoute(server);
  registerLinkStaffRoute(server);
  registerCheckProviderProvisionedRoute(server);
  registerCheckStaffAuthorizedRoute(server);
  registerCheckRecidivizStaffRoute(server);
  registerGcsObjectScannedRoute(server);
}
