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

"use client";

import createFetchClient from "openapi-fetch";
import createClient, { OpenapiQueryClient } from "openapi-react-query";

import type { paths } from "~@reentry/openapi-types";

import { authMiddleware } from "./auth/authMiddleware";

// api singleton
let client: $Api | undefined;

export function createApiClient(baseUrl: string): $Api {
  if (client) return client;

  const fetchClient = createFetchClient<paths>({
    baseUrl,
  });
  fetchClient.use(authMiddleware);

  client = createClient(fetchClient);
  return client;
}

export type $Api = OpenapiQueryClient<paths>;
