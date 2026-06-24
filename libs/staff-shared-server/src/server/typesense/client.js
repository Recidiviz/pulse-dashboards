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

import { Client as TypesenseClient } from "typesense";

const DEFAULT_CONNECTION_TIMEOUT_SECONDS = 5;

// Mirrors createTypesenseClient in libs/@typesense/client/src/client.ts. We
// inline it here because staff-shared-server is plain ESM run directly via node
// (no TS path-alias resolution), so it can't import the TS workspace lib at
// runtime — but it can use the `typesense` npm client directly.
function createTypesenseClient({ host, apiKey }) {
  const url = new URL(host);
  const port = parseInt(url.port, 10) || (url.protocol === "https:" ? 443 : 80);

  return new TypesenseClient({
    nodes: [
      {
        host: url.hostname,
        port,
        protocol: url.protocol.replace(":", ""),
      },
    ],
    apiKey,
    connectionTimeoutSeconds: DEFAULT_CONNECTION_TIMEOUT_SECONDS,
  });
}

/**
 * Builds a Typesense client pointed at the cluster this deployment is wired to,
 * authenticated with the read-only inspect key.
 */
export function createTypesenseInspectClient() {
  const host = process.env.TYPESENSE_HOST;
  const apiKey = process.env.TYPESENSE_API_INSPECT_KEY;

  if (!host) {
    throw new Error("TYPESENSE_HOST is not configured for this environment");
  }
  if (!apiKey) {
    throw new Error(
      "TYPESENSE_API_INSPECT_KEY is not configured for this environment",
    );
  }

  return createTypesenseClient({ host, apiKey });
}
