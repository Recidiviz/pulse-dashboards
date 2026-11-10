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

import {
  getOptionalEnv,
  getOptionalPositiveIntEnv,
  resolveRequiredEnv,
} from "~@idaho-th/trpc/routes/common/env";
import {
  PLACES_API_BASE_URL,
  PLACES_DEFAULT_LANGUAGE_CODE,
  PLACES_DEFAULT_REGION_CODE,
  PLACES_HTTP_TIMEOUT_MS,
  PLACES_REQUIRED_ENV_KEYS,
} from "~@idaho-th/trpc/routes/places/constants";

export type PlacesConfig = {
  apiKey: string;
  baseUrl: string;
  regionCode: string;
  languageCode: string;
  timeoutMs: number;
};

let cachedConfig: PlacesConfig | null = null;

export function getPlacesConfig(): PlacesConfig {
  if (cachedConfig) return cachedConfig;

  const env = resolveRequiredEnv(PLACES_REQUIRED_ENV_KEYS, {
    label: "Google Places",
  });

  cachedConfig = {
    apiKey: env.IDAHO_TH_GOOGLE_PLACES_API_KEY,
    // Test-only override: points the transport at a mock server in tests. In
    // deployed environments this is unset and falls back to the Google Places
    // host. The value comes from server-side env (SOPS/Secret Manager), never
    // from request input, so it carries no SSRF surface.
    baseUrl:
      getOptionalEnv("IDAHO_TH_GOOGLE_PLACES_BASE_URL") ?? PLACES_API_BASE_URL,
    regionCode:
      getOptionalEnv("IDAHO_TH_GOOGLE_PLACES_REGION_CODE") ??
      PLACES_DEFAULT_REGION_CODE,
    languageCode:
      getOptionalEnv("IDAHO_TH_GOOGLE_PLACES_LANGUAGE_CODE") ??
      PLACES_DEFAULT_LANGUAGE_CODE,
    timeoutMs: getOptionalPositiveIntEnv(
      "IDAHO_TH_GOOGLE_PLACES_TIMEOUT_MS",
      PLACES_HTTP_TIMEOUT_MS,
    ),
  };

  return cachedConfig;
}

export function resetPlacesConfigForTesting(): void {
  cachedConfig = null;
}
