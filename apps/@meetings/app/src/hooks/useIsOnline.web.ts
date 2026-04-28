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

import * as Sentry from "@sentry/react-native";
import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import env from "../env";

const HEALTH_URL = `${env.EXPO_PUBLIC_SERVER_URL}health`;

async function checkServerReachable(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_URL, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// We're storing this state at the module level and not the hook level
// because we need it to stay consistent across new hook renders.
let onlineState = navigator.onLine;
const listeners = new Set<(online: boolean) => void>();

function setOnlineState(online: boolean) {
  if (onlineState !== online) {
    Sentry.logger.info(online ? "network.online" : "network.offline", {
      trigger: "web",
    });
  }

  onlineState = online;
  // We're going to use this state to manage tanstack's online manager
  onlineManager.setOnline(online);
  listeners.forEach((l) => l(online));
}

window.addEventListener("offline", () => setOnlineState(false));
window.addEventListener("online", () => {
  // The browser 'online' event only means a network interface is available,
  // not that our server is reachable — confirm before marking as online.
  checkServerReachable().then(setOnlineState);
});

// Initialize state by actually checking server status
checkServerReachable().then(setOnlineState);

// The hook really controls the module-level listeners and acts as
// an API into the module state, not so much actually
// manages its own state.
export default function useIsOnline() {
  const [isOnline, setIsOnline] = useState(() => onlineState);

  useEffect(() => {
    listeners.add(setIsOnline);
    return () => {
      listeners.delete(setIsOnline);
    };
  }, []);

  return { isOnline };
}
