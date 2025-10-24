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

import { createWSClient, TRPCLink } from "@trpc/client";
import { AnyRouter } from "@trpc/server";

import { trpc, trpcUrl } from "~@reentry/frontend/trpc";
import { ConnectionState } from "~@reentry/frontend/trpc/types";

export const initWsClient = (
  getAuthHeaders: () => Promise<Record<string, string | undefined>>,
  setConnectionState: (state: ConnectionState) => void,
  setConnectionError: (err: Event | undefined) => void,
) =>
  createWSClient({
    url: trpcUrl,
    connectionParams: getAuthHeaders,
    onOpen: () => {
      setConnectionState("connected");
      setConnectionError(undefined);
    },
    onClose: () => {
      setConnectionState("closed");
      setConnectionError(undefined);
    },
    onError: (err) => {
      console.error("WS error", err);
      setConnectionState("error");
      setConnectionError(err);
    },
    keepAlive: {
      enabled: true,
      intervalMs: 10000, // ping every 10 seconds
      pongTimeoutMs: 5000, // if no pong within 5 seconds, kill connection
    },
  });

export const initTrpcClient = (links: TRPCLink<AnyRouter>[]) => {
  return trpc.createClient({
    links,
  });
};
