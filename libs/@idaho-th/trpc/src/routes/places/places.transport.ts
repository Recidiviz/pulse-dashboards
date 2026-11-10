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

import { Agent, fetch as undiciFetch } from "undici";

import type { PlacesConfig } from "~@idaho-th/trpc/routes/places/config";
import {
  PLACES_AUTOCOMPLETE_INCLUDED_PRIMARY_TYPES,
  PLACES_AUTOCOMPLETE_PATH,
  PLACES_DEFAULT_INCLUDED_REGION_CODES,
  PLACES_DETAILS_FIELD_MASK,
  PLACES_DETAILS_PATH,
  PLACES_HTTP_TIMEOUT_MS,
  PLACES_KEEPALIVE_TIMEOUT_MS,
  PLACES_MAX_CONNECTIONS,
  PLACES_MAX_RETRY_ATTEMPTS,
  PLACES_RETRY_BASE_DELAY_MS,
} from "~@idaho-th/trpc/routes/places/constants";
import {
  isRetryablePlacesError,
  placesErrorForStatus,
  PlacesResponseError,
  PlacesTimeoutError,
} from "~@idaho-th/trpc/routes/places/places.errors";
import type {
  AutocompleteParams,
  PlaceDetailsParams,
  RawAutocompleteResponse,
  RawPlaceDetailsResponse,
} from "~@idaho-th/trpc/routes/places/places.types";

const placesDispatcher = new Agent({
  connections: PLACES_MAX_CONNECTIONS,
  headersTimeout: PLACES_HTTP_TIMEOUT_MS,
  bodyTimeout: PLACES_HTTP_TIMEOUT_MS,
  keepAliveTimeout: PLACES_KEEPALIVE_TIMEOUT_MS,
});

// undici codes raised when the Agent's headers/body timeouts fire. These act as
// a backstop to the per-request AbortController; map them to the same
// `PlacesTimeoutError` so a timeout always surfaces as a TIMEOUT, never a
// generic request failure.
const UNDICI_TIMEOUT_CODES = new Set([
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  const code = (error as { code?: string }).code;
  return code !== undefined && UNDICI_TIMEOUT_CODES.has(code);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number): number {
  const exponential = PLACES_RETRY_BASE_DELAY_MS * 2 ** attempt;
  return Math.round(Math.random() * exponential);
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= PLACES_MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      // Retries are intentionally sequential: each attempt waits for the
      // previous to fail before backing off and trying again.
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < PLACES_MAX_RETRY_ATTEMPTS && isRetryablePlacesError(error);
      if (!canRetry) throw error;
      // eslint-disable-next-line no-await-in-loop
      await sleep(backoffDelayMs(attempt));
    }
  }
  throw lastError;
}

type PlacesRequest = {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
  fieldMask?: string;
};

async function readErrorMessage(
  response: Awaited<ReturnType<typeof undiciFetch>>,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string; status?: string };
    };
    return (
      payload.error?.status ?? payload.error?.message ?? response.statusText
    );
  } catch {
    return response.statusText;
  }
}

async function placesFetch<T>(
  config: PlacesConfig,
  request: PlacesRequest,
): Promise<T> {
  const url = new URL(config.baseUrl + request.path);
  for (const [key, value] of Object.entries(request.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {
    "X-Goog-Api-Key": config.apiKey,
    "Content-Type": "application/json",
  };
  if (request.fieldMask) {
    headers["X-Goog-FieldMask"] = request.fieldMask;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  let response: Awaited<ReturnType<typeof undiciFetch>>;
  try {
    response = await undiciFetch(url, {
      method: request.method,
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
      signal: controller.signal,
      dispatcher: placesDispatcher,
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new PlacesTimeoutError(undefined, { cause: error });
    }
    throw new PlacesResponseError("Google Places request failed", {
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw placesErrorForStatus(
      response.status,
      await readErrorMessage(response),
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new PlacesResponseError("Failed to parse Google Places response", {
      cause: error,
    });
  }
}

export function fetchAutocomplete(
  config: PlacesConfig,
  params: AutocompleteParams,
): Promise<RawAutocompleteResponse> {
  const body: Record<string, unknown> = {
    input: params.input,
    regionCode: config.regionCode,
    languageCode: config.languageCode,
    includedRegionCodes: [...PLACES_DEFAULT_INCLUDED_REGION_CODES],
  };
  if (PLACES_AUTOCOMPLETE_INCLUDED_PRIMARY_TYPES.length > 0) {
    body["includedPrimaryTypes"] = [
      ...PLACES_AUTOCOMPLETE_INCLUDED_PRIMARY_TYPES,
    ];
  }
  if (params.sessionToken) {
    body["sessionToken"] = params.sessionToken;
  }

  return withRetry(() =>
    placesFetch<RawAutocompleteResponse>(config, {
      method: "POST",
      path: PLACES_AUTOCOMPLETE_PATH,
      body,
    }),
  );
}

export function fetchPlaceDetails(
  config: PlacesConfig,
  params: PlaceDetailsParams,
): Promise<RawPlaceDetailsResponse> {
  const searchParams: Record<string, string> = {
    languageCode: config.languageCode,
    regionCode: config.regionCode,
  };
  if (params.sessionToken) {
    searchParams["sessionToken"] = params.sessionToken;
  }

  return withRetry(() =>
    placesFetch<RawPlaceDetailsResponse>(config, {
      method: "GET",
      path: `${PLACES_DETAILS_PATH}/${encodeURIComponent(params.placeId)}`,
      searchParams,
      fieldMask: PLACES_DETAILS_FIELD_MASK,
    }),
  );
}
