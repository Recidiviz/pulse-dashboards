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

import { z } from "zod";

import { permissionSchema } from "./permissions";

/**
 * Returns config values matching the specified tenant, if it exists.
 * For convenience in scenarios such as test, offline, etc., returns empty values
 * if the tenant does not exist so that the result can always be passed to the Auth0 SDK.
 * @param tenantKey the only valid keys are "staging" and "production", but because we expect
 * this to be read from an environment variable in practice we will accept any string
 */
export function getAuth0Config(tenantKey: string): {
  domain: string;
  client_id: string;
  audience: string;
} {
  let domain = "";
  // Client IDs are considered public information, not secrets:
  // https://auth0.com/docs/get-started/applications/application-settings#basic-information
  let clientId = "";
  let audience = "";

  switch (tenantKey) {
    case "staging":
      domain = "recidiviz-jii-staging.us.auth0.com";
      clientId = "9SXcwNaSRiRv6zGuYY2pgPUFH8zMZF2O";
      // this is not a real URL and won't be used for requests, this is just our naming convention
      // for Auth0 API identifiers (Auth0 recommends using a URL but does not actually call it)
      audience = "https://jii-api-staging.recidiviz.org";
      break;
    case "production":
      domain = "recidiviz-jii.us.auth0.com";
      clientId = "zODqQ6NV9NHwfbrr8vHmK2pwF9c4GSPU";
      // similar to above, this is not a real URL either and that's fine
      audience = "https://jii-api.recidiviz.org";
      break;
  }

  return {
    domain,
    client_id: clientId,
    audience,
  };
}

/**
 * This should match the namespace used in the {@link [Auth0 action](../auth0/actions/add-metadata-to-token.js)}
 * that adds the metadata object to the user token
 */
export const metadataNamespace = "https://jii.recidiviz.org";

/**
 * This should match the fields added to app_metadata in the Auth0 actions in `../auth0/actions`
 */
export const metadataSchema = z.object({
  stateCode: z.string(),
  allowedStates: z.array(z.string()).optional(),
  permissions: z.array(permissionSchema).optional(),
});