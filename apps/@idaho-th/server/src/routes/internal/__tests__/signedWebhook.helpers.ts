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
import Fastify from "fastify";

import { computeWebhookSignature } from "~@idaho-th/trpc/auth/webhookSignature";
import {
  WEBHOOK_NONCE_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "~@idaho-th/trpc/auth/webhookSignature";

export const WEBHOOK_SECRET = "test-backend-webhook-secret";
export const WEBHOOK_SECRET_HEADER = "x-webhook-secret";

let nonceCounter = 0;

/**
 * The nonce caches and rate limiters these routes use are module singletons
 * shared by every test in a file, so each request needs its own nonce.
 */
export function uniqueNonce(): string {
  nonceCounter += 1;
  return `nonce-${nonceCounter}-${Date.now()}`;
}

type SignedRequestOptions = {
  route: string;
  rawBody: string;
  secret?: string;
  timestamp?: string;
  nonce?: string;
  /** Signs with these instead of the headers actually sent. */
  signWith?: { route?: string; rawBody?: string; secret?: string };
};

/** Headers an Auth0 Action would send for a signed webhook call. */
export function signedHeaders({
  route,
  rawBody,
  secret = WEBHOOK_SECRET,
  timestamp = String(Date.now()),
  nonce = uniqueNonce(),
  signWith,
}: SignedRequestOptions): Record<string, string> {
  const signature = computeWebhookSignature(
    signWith?.secret ?? secret,
    signWith?.route ?? route,
    timestamp,
    nonce,
    signWith?.rawBody ?? rawBody,
  );

  return {
    "content-type": "application/json",
    [WEBHOOK_SECRET_HEADER]: secret,
    [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    [WEBHOOK_NONCE_HEADER]: nonce,
    [WEBHOOK_SIGNATURE_HEADER]: signature,
  };
}

export async function buildSignedWebhookServer(
  register: (server: FastifyInstance) => void,
  options?: { bodyLimit?: number },
): Promise<FastifyInstance> {
  const server = Fastify({ logger: false, ...options });
  register(server);
  await server.ready();
  return server;
}
