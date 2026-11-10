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

export class PlacesApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PlacesApiError";
  }
}

export class PlacesRequestError extends PlacesApiError {
  constructor(
    message: string,
    readonly httpStatus: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PlacesRequestError";
  }
}

export class PlacesNotFoundError extends PlacesApiError {
  constructor(message = "Place not found", options?: ErrorOptions) {
    super(message, options);
    this.name = "PlacesNotFoundError";
  }
}

export class PlacesRateLimitError extends PlacesApiError {
  constructor(
    message = "Google Places rate limit exceeded",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PlacesRateLimitError";
  }
}

export class PlacesTimeoutError extends PlacesApiError {
  constructor(
    message = "Google Places request timed out",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PlacesTimeoutError";
  }
}

export class PlacesResponseError extends PlacesApiError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PlacesResponseError";
  }
}

export function placesErrorForStatus(
  httpStatus: number,
  message: string,
): PlacesApiError {
  if (httpStatus === 404) return new PlacesNotFoundError();
  if (httpStatus === 429) return new PlacesRateLimitError();
  return new PlacesRequestError(message, httpStatus);
}

export function isRetryablePlacesError(error: unknown): boolean {
  if (error instanceof PlacesTimeoutError) return true;
  if (error instanceof PlacesRequestError) return error.httpStatus >= 500;
  return false;
}

export function formatPlacesErrorForLog(
  error: unknown,
): Record<string, unknown> {
  if (error instanceof PlacesRequestError) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      httpStatus: error.httpStatus,
    };
  }
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message };
  }
  return { errorReason: String(error) };
}
