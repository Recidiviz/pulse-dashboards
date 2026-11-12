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

import type { FastifyRequest } from "fastify";

import { http } from "./http";

export interface CacheControlOptions {
  /** How long a browser may keep the response, in seconds. */
  maxAgeS: number;
  /** How long a shared cache, such as a CDN, may keep it. Defaults to maxAgeS. */
  sMaxAgeS?: number;
}

/** Whether the request is a tRPC batch, read the way tRPC reads it. */
function isBatchRequest(req: FastifyRequest): boolean {
  return new URL(req.url, "http://localhost").searchParams.get("batch") === "1";
}

/**
 * Builds middleware that marks a successful query's response cacheable by
 * anyone: "public, max-age=<maxAgeS>, s-maxage=<sMaxAgeS>". Use it only on
 * procedures whose result is the same for every caller.
 *
 * It sets "no-store" before anything else runs and replaces it only once the
 * rest of the procedure has succeeded, so every error sends "no-store".
 * Concat it before any middleware that can reject a call, so that it wraps
 * that middleware too.
 *
 * A tRPC batch always keeps "no-store": one header covers the whole batch,
 * and a batch can mix this read with a signed-in call that a shared cache
 * must never keep. httpBatchLink sends "batch=1" even for a single call, so
 * clients get the cacheable header only through httpLink.
 */
export function cacheControl({
  maxAgeS,
  sMaxAgeS = maxAgeS,
}: CacheControlOptions) {
  const cacheable = `public, max-age=${maxAgeS}, s-maxage=${sMaxAgeS}`;
  return http.procedure.use(async ({ ctx, type, next }) => {
    ctx.res.header("Cache-Control", "no-store");
    const result = await next();
    if (result.ok && type === "query" && !isBatchRequest(ctx.req)) {
      ctx.res.header("Cache-Control", cacheable);
    }
    return result;
  });
}
