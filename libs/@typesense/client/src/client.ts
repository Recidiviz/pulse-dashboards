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
export interface TypesenseClientConfig {
  host: string;
  apiKey: string;
  connectionTimeoutSeconds?: number;
}

export function createTypesenseClient(
  config: TypesenseClientConfig,
): TypesenseClient {
  const url = new URL(config.host);
  const port = parseInt(url.port, 10) || (url.protocol === "https:" ? 443 : 80);

  return new TypesenseClient({
    nodes: [
      {
        host: url.hostname,
        port,
        protocol: url.protocol.replace(":", ""),
      },
    ],
    apiKey: config.apiKey,
    connectionTimeoutSeconds:
      config.connectionTimeoutSeconds ?? DEFAULT_CONNECTION_TIMEOUT_SECONDS,
  });
}

export function createLocalTypesenseClient(): TypesenseClient {
  return createTypesenseClient({
    host: process.env["TYPESENSE_HOST"] || "http://localhost:8108",
    apiKey: process.env["TYPESENSE_API_KEY"] || "xyz",
  });
}
