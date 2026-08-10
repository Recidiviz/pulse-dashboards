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

import { MetricRecord, NewBackendRecord } from "~shared-pathways";

const CONTENT_DISPOSITION_FILENAME_PATTERN = /filename=(?:"([^"]+)"|([^;]+))/;

async function validateResponse(response: Response) {
  const responseJson = await response.json();
  if (!response.ok) {
    const status = responseJson.status ?? response.status;
    const errors = responseJson.errors ?? responseJson.message;
    throw new Error(
      `Fetching data from API failed.\nStatus: ${status} - ${response.statusText}\nErrors: ${JSON.stringify(errors)}`,
    );
  }
  return responseJson;
}

async function throwForFileResponseError(response: Response): Promise<never> {
  const responseJson = await response.json().catch(() => undefined);
  const status = responseJson?.status ?? response.status;
  const errors = responseJson?.errors ?? responseJson?.message;
  throw new Error(
    `Fetching file from API failed.\nStatus: ${status} - ${response.statusText}\nErrors: ${JSON.stringify(errors)}`,
  );
}

export async function callPublicPathwaysApi<RecordFormat extends MetricRecord>(
  endpoint: string,
  getTokenSilently: () => Promise<string | undefined>,
  signal: AbortSignal,
): Promise<NewBackendRecord<RecordFormat>> {
  const url = `${import.meta.env.VITE_PUBLIC_PATHWAYS_API_URL_BASE}/${endpoint}`;
  const token = await getTokenSilently();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  return validateResponse(response) as Promise<NewBackendRecord<RecordFormat>>;
}

export type PublicPathwaysFile = {
  blob: Blob;
  filename: string | undefined;
};

/**
 * Fetches a file (e.g. a CSV export) from the Public Pathways API, rather
 * than a JSON metric response. Returns the raw response body as a Blob,
 * plus the filename the server suggested via the Content-Disposition header.
 */
export async function fetchPublicPathwaysFile(
  endpoint: string,
  getTokenSilently: () => Promise<string | undefined>,
  signal?: AbortSignal,
): Promise<PublicPathwaysFile> {
  const url = `${import.meta.env.VITE_PUBLIC_PATHWAYS_API_URL_BASE}/${endpoint}`;
  const token = await getTokenSilently();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    return throwForFileResponseError(response);
  }

  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(
    CONTENT_DISPOSITION_FILENAME_PATTERN,
  );
  const filename = (filenameMatch?.[1] ?? filenameMatch?.[2])?.trim();

  return { blob: await response.blob(), filename };
}
