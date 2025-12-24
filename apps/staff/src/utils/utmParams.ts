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

import { captureException } from "@sentry/react";

const UTM_SESSION_STORAGE_KEY = "utm_params";

export type UTMParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

/**
 * List of standard UTM parameter names
 */
const UTM_PARAM_NAMES: readonly (keyof UTMParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

/**
 * Extracts UTM parameters from a URL query string
 * @param url Optional URL to parse. If not provided, uses window.location.search
 * @returns Object containing only the UTM parameters found in the URL
 */
export function extractUTMParams(url?: string): UTMParams {
  const queryString = url ?? window.location.search;
  const searchParams = new URLSearchParams(queryString);

  const utmParams: UTMParams = {};

  UTM_PARAM_NAMES.forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      utmParams[param] = value;
    }
  });

  return utmParams;
}

/**
 * Stores UTM parameters in sessionStorage
 * @param params UTM parameters to store
 */
export function storeUTMParams(params: UTMParams): void {
  if (Object.keys(params).length > 0) {
    sessionStorage.setItem(UTM_SESSION_STORAGE_KEY, JSON.stringify(params));
  }
}

/**
 * Retrieves UTM parameters from sessionStorage
 * @returns The stored UTM parameters, or an empty object if none are stored
 */
export function getStoredUTMParams(): UTMParams {
  const stored = sessionStorage.getItem(UTM_SESSION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      captureException(
        `Encountered error while inserting contact record: ${e}`,
      );
      console.error("Error parsing stored UTM parameters:", e);
      return {};
    }
  }
  return {};
}
