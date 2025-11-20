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
import { io, type Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "./eventTypes";

const getUserAgent = (): string => {
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    return navigator.userAgent;
  }
  return "Unknown";
};

export type SocketConnection = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export function createSocket(url: string): SocketConnection {
  // have to separate path from hostname because socket.io interprets
  // URL paths as namespaces. we may use paths for the reverse proxy
  // but they will be stripped out of the final request which will just go to /socket.io
  const socketUrl = new URL(url);
  const socketHost = socketUrl.origin;
  const socketPathPrefix = socketUrl.pathname;

  return io(socketHost, {
    autoConnect: false,
    path: `${socketPathPrefix === "/" ? "" : socketPathPrefix}/socket.io`,
    transports: ["websocket"],
    // Add custom headers to ensure environment data is preserved during reconnections
    extraHeaders: {
      "User-Agent": getUserAgent(),
      "X-Client-Environment": "browser",
    },
  });
}
