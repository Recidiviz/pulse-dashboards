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

import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * A request and reply for calling a dummy router through createCaller. The
 * reply records the headers set on it, with lowercased names.
 */
export function fakeHttp({ url = "/pub" }: { url?: string } = {}) {
  const headers: Record<string, string> = {};
  const res = {
    header(name: string, value: unknown) {
      headers[name.toLowerCase()] = String(value);
      return res;
    },
  };
  return {
    req: { url } as unknown as FastifyRequest,
    res: res as unknown as FastifyReply,
    headers,
  };
}

/** The error a call rejected with, or undefined when it succeeded. */
export async function errorOf(call: Promise<unknown>) {
  try {
    await call;
  } catch (e) {
    return e;
  }
  return undefined;
}
