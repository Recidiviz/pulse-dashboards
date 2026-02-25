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

export async function callPublicPathwaysApi<
  RecordFormat extends MetricRecord,
>(
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
