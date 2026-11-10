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

import { IDAHO_TH_TRPC_PATH } from "~@idaho-th/shared";

export interface IdahoThRuntimeConfig {
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  apiUrl: string;
  appEnv: string;
  /** Intercom Messenger workspace app id; when unset the widget does not boot. */
  intercomAppId?: string;
}

declare global {
  interface Window {
    /** Populated by /config.js on Cloud Run; omitted for local dev and Firebase hosting. */
    __IDAHO_TH_CONFIG__?: {
      AUTH0_DOMAIN?: string;
      AUTH0_CLIENT_ID?: string;
      AUTH0_AUDIENCE?: string;
      API_URL?: string;
      APP_ENV?: string;
      INTERCOM_APP_ID?: string;
    };
  }
}

function isRuntimeConfigActive(): boolean {
  const config = window.__IDAHO_TH_CONFIG__;
  if (!config) {
    return false;
  }

  return Object.values(config).some(
    (value) => typeof value === "string" && value.length > 0,
  );
}

function readConfigValue(
  runtimeKey: keyof NonNullable<Window["__IDAHO_TH_CONFIG__"]>,
  viteKey:
    | "VITE_AUTH0_DOMAIN"
    | "VITE_AUTH0_CLIENT_ID"
    | "VITE_AUTH0_AUDIENCE"
    | "VITE_IDAHO_TH_API_URL"
    | "VITE_APP_ENV"
    | "VITE_INTERCOM_APP_ID",
): string | undefined {
  const fromRuntime = window.__IDAHO_TH_CONFIG__?.[runtimeKey];
  if (typeof fromRuntime === "string" && fromRuntime.length > 0) {
    return fromRuntime;
  }

  if (isRuntimeConfigActive()) {
    return undefined;
  }

  const fromVite = import.meta.env[viteKey];
  return typeof fromVite === "string" && fromVite.length > 0
    ? fromVite
    : undefined;
}

/**
 * Client settings for Idaho TH.
 *
 * Resolution order: `window.__IDAHO_TH_CONFIG__` (runtime) then Vite env (build-time).
 */
export function getIdahoThRuntimeConfig(): IdahoThRuntimeConfig {
  const auth0Domain = readConfigValue("AUTH0_DOMAIN", "VITE_AUTH0_DOMAIN");
  const auth0ClientId = readConfigValue(
    "AUTH0_CLIENT_ID",
    "VITE_AUTH0_CLIENT_ID",
  );
  const auth0Audience = readConfigValue(
    "AUTH0_AUDIENCE",
    "VITE_AUTH0_AUDIENCE",
  );
  const apiUrl =
    readConfigValue("API_URL", "VITE_IDAHO_TH_API_URL") ?? IDAHO_TH_TRPC_PATH;
  const appEnv = readConfigValue("APP_ENV", "VITE_APP_ENV") ?? "";
  const intercomAppId = readConfigValue(
    "INTERCOM_APP_ID",
    "VITE_INTERCOM_APP_ID",
  );

  if (!auth0Domain || !auth0ClientId || !auth0Audience) {
    throw new Error(
      "Missing Idaho TH client config. For local dev, set VITE_AUTH0_* in .env files. On Cloud Run, ensure frontend env vars are configured.",
    );
  }

  return {
    auth0Domain,
    auth0ClientId,
    auth0Audience,
    apiUrl,
    appEnv,
    ...(intercomAppId ? { intercomAppId } : {}),
  };
}
