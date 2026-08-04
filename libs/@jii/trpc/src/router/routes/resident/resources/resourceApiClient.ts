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

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createCachedCall } from "../../../../helpers/createCachedCall";
import {
  organizationApiSchema,
  OrganizationDetail,
  organizationDetailApiSchema,
  OrganizationSummary,
} from "./types";

// Maps state codes to Resource API params.
const RESOURCES_CONFIG: Record<string, { origin: string }> = {
  US_NYC: { origin: "NYC_CONNECTIONS" },
};

async function request(path: string, body: unknown): Promise<unknown> {
  const baseUrl = process.env["RESOURCE_API_BASE_URL"];
  const apiKey = process.env["RESOURCE_API_KEY"];

  if (!baseUrl || !apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Resource API is not configured",
    });
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }

  return res.json();
}

async function fetchOrganizations(
  origin: string,
): Promise<OrganizationSummary[]> {
  const rawResponse = await request("/api/v1/organizations", { origin });
  return z.array(organizationApiSchema).parse(rawResponse);
}

async function fetchOrganization(id: number): Promise<OrganizationDetail> {
  const rawResponse = await request("/api/v1/organization", { id });
  return organizationDetailApiSchema.parse(rawResponse);
}

const cachedFetchersByState = Object.fromEntries(
  Object.entries(RESOURCES_CONFIG).map(([stateCode, config]) => [
    stateCode,
    createCachedCall(() => fetchOrganizations(config.origin), 60 * 60),
  ]),
);

export const resourceApiClient = {
  getOrganizations: (stateCode: string): Promise<OrganizationSummary[]> => {
    const fetcher = cachedFetchersByState[stateCode];
    if (!fetcher) {
      return Promise.reject(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No resources configured for ${stateCode}`,
        }),
      );
    }
    return fetcher();
  },
  getOrganization: fetchOrganization,
};
