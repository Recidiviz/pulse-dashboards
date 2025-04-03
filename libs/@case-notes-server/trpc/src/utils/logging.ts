// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { BigQuery } from "@google-cloud/bigquery";
import _ from "lodash";

import { SearchResultWithTags } from "~@case-notes-server/trpc/common/types";

export async function logResults(options: {
  queryInfo: {
    query: string;
    clientExternalId?: string;
    pageToken?: string;
    stateCode: string;
    userExternalId: string;
    performedExactMatchSearch: boolean;
    timestamp: Date;
    exactMatchQuery?: string;
    vertexFilter?: string;
  };
  results: SearchResultWithTags[];
  projectId: string;
  datasetId: string;
  tableId: string;
}) {
  const { results, projectId, datasetId, tableId, queryInfo } = options;
  const {
    query,
    clientExternalId,
    pageToken,
    stateCode,
    userExternalId,
    timestamp,
    performedExactMatchSearch,
    exactMatchQuery,
    vertexFilter,
  } = queryInfo;

  const bigQueryClient = new BigQuery({
    projectId,
  });

  const resultsToLog = results.map((result) => {
    return _.pick(result, ["documentId", "isExactMatch", "isVertexMatch"]);
  });

  await bigQueryClient
    .dataset(datasetId)
    .table(tableId)
    .insert({
      query,
      client_external_id: clientExternalId,
      user_external_id: userExternalId,
      page_token: pageToken,
      state_code: stateCode,
      results: JSON.stringify(resultsToLog),
      timestamp,
      performed_exact_match_search: performedExactMatchSearch,
      exact_match_query: exactMatchQuery,
      vertex_filter: vertexFilter,
      env: process.env["SENTRY_ENV"],
    });
}
