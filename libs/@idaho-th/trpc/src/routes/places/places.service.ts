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

import { getPlacesClient } from "~@idaho-th/trpc/routes/clients/places";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import { getPlacesConfig } from "~@idaho-th/trpc/routes/places/config";
import {
  buildPlaceDetailsCacheKey,
  placeDetailsCache,
} from "~@idaho-th/trpc/routes/places/places.cache";
import {
  formatPlacesErrorForLog,
  PlacesNotFoundError,
  PlacesRateLimitError,
  PlacesRequestError,
  PlacesTimeoutError,
} from "~@idaho-th/trpc/routes/places/places.errors";
import {
  mapAutocompleteResponse,
  mapPlaceDetailsResponse,
} from "~@idaho-th/trpc/routes/places/places.mapper";
import type {
  AutocompleteInput,
  PlaceDetailsInput,
} from "~@idaho-th/trpc/routes/places/places.schema";
import type {
  AutocompleteResult,
  IPlacesClient,
  PlaceDetails,
  PlacesProcedureMeta,
} from "~@idaho-th/trpc/routes/places/places.types";

const placesLogger = getLogger("places");

function metaForLog(meta: PlacesProcedureMeta): Record<string, string> {
  return {
    traceId: meta.traceId,
    procedureName: meta.procedureName,
    staffPseudonymizedId: meta.staffPseudonymizedId,
  };
}

function mapPlacesError(error: unknown, operation: string): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof PlacesNotFoundError) {
    return new TRPCError({ code: "NOT_FOUND", message: "Place not found" });
  }
  if (error instanceof PlacesRateLimitError) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Address lookup is temporarily rate limited",
    });
  }
  if (error instanceof PlacesTimeoutError) {
    return new TRPCError({
      code: "TIMEOUT",
      message: `Address ${operation} timed out`,
    });
  }
  if (error instanceof PlacesRequestError && error.httpStatus === 400) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid address lookup request",
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Address ${operation} failed`,
  });
}

async function withPlacesErrorHandling<T>(
  meta: PlacesProcedureMeta,
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    placesLogger.error("Google Places operation failed", {
      ...metaForLog(meta),
      operation,
      ...formatPlacesErrorForLog(error),
    });
    throw mapPlacesError(error, operation);
  }
}

export async function autocompleteAddressesService(
  input: AutocompleteInput,
  meta: PlacesProcedureMeta,
  client: IPlacesClient = getPlacesClient(),
): Promise<AutocompleteResult> {
  return withPlacesErrorHandling(meta, "autocomplete", async () => {
    const raw = await client.autocomplete({
      input: input.input,
      sessionToken: input.sessionToken,
    });
    const predictions = mapAutocompleteResponse(raw);

    placesLogger.info("Resolved address autocomplete predictions", {
      ...metaForLog(meta),
      predictionCount: predictions.length,
      hasSessionToken: !!input.sessionToken,
    });

    return { predictions };
  });
}

export async function getPlaceDetailsService(
  input: PlaceDetailsInput,
  meta: PlacesProcedureMeta,
  client: IPlacesClient = getPlacesClient(),
): Promise<PlaceDetails> {
  const { regionCode, languageCode } = getPlacesConfig();
  const cacheKey = buildPlaceDetailsCacheKey(
    input.placeId,
    regionCode,
    languageCode,
  );

  return withPlacesErrorHandling(meta, "details", async () => {
    const cached = placeDetailsCache.get(cacheKey);
    if (cached) {
      placesLogger.info("Resolved place details", {
        ...metaForLog(meta),
        cacheHit: true,
        hasLocation: cached.location !== null,
        hasSessionToken: !!input.sessionToken,
      });
      return cached;
    }

    const raw = await client.placeDetails({
      placeId: input.placeId,
      sessionToken: input.sessionToken,
    });
    const details = mapPlaceDetailsResponse(raw);
    placeDetailsCache.set(cacheKey, details);

    placesLogger.info("Resolved place details", {
      ...metaForLog(meta),
      cacheHit: false,
      hasLocation: details.location !== null,
      hasSessionToken: !!input.sessionToken,
    });

    return details;
  });
}
