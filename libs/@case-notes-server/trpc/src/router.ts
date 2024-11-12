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

import { captureException } from "@sentry/node";
import { TRPCError } from "@trpc/server";

import {
  SearchResult,
  SearchResultWithTags,
} from "~@case-notes-server/trpc/common/types";
import { baseProcedure, router } from "~@case-notes-server/trpc/init";
import { searchSchema } from "~@case-notes-server/trpc/schema";
import { vertexSearch } from "~@case-notes-server/trpc/utils/ai";
import { exactMatchSearch } from "~@case-notes-server/trpc/utils/exact-match";
import { logResults } from "~@case-notes-server/trpc/utils/logging";

type SearchResults = SearchResult[];

function sortResults(
  vertexResults: SearchResults,
  exactMatchResults: SearchResults,
) {
  const vertexResultIds = vertexResults.map((result) => result.documentId);
  const exactMatchResultIds = exactMatchResults.map(
    (result) => result.documentId,
  );

  // Split up the vertex results into exact match results and non-exact match results
  const splitResults = vertexResults.reduce(
    (
      acc: {
        exactMatchResults: SearchResultWithTags[];
        nonExactMatchResults: SearchResultWithTags[];
      },
      result,
    ) => {
      if (exactMatchResultIds.includes(result.documentId)) {
        acc.exactMatchResults.push({
          ...result,
          isExactMatch: true,
          isVertexMatch: true,
        });
      } else {
        acc.nonExactMatchResults.push({
          ...result,
          isExactMatch: false,
          isVertexMatch: true,
        });
      }
      return acc;
    },
    {
      exactMatchResults: [],
      nonExactMatchResults: [],
    },
  );

  // Get the exact match results that are not in the vertex results
  const nonVertexExactMatchResults = exactMatchResults
    .filter((result) => {
      return !vertexResultIds.includes(result.documentId);
    })
    .map((result) => ({
      ...result,
      isExactMatch: true,
      isVertexMatch: false,
    }));

  // Return results in this order:
  // 1. Exact match results that are in the vertex results
  // 2. Exact match results that are not in the vertex results
  // 3. Non-exact match results
  return [
    ...splitResults.exactMatchResults,
    ...nonVertexExactMatchResults,
    ...splitResults.nonExactMatchResults,
  ];
}

export const appRouter = router({
  search: baseProcedure
    .input(searchSchema)
    .query(
      async ({
        input: { withSnippet, userExternalId, query, clientExternalId, cursor },
        ctx: { stateCode },
      }) => {
        if (
          !process.env["VERTEX_PROJECT_ID"] ||
          !process.env["VERTEX_ENGINE_ID"] ||
          !process.env["CASE_NOTES_BQ_TABLE_ADDRESS"] ||
          !process.env["LOGS_BQ_PROJECT_ID"] ||
          !process.env["LOGS_BQ_DATASET_ID"] ||
          !process.env["LOGS_BQ_TABLE_ID"]
        ) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Required env variables are not set",
          });
        }

        const requestTime = new Date();

        const includeFilterConditions = {
          external_id: clientExternalId ? [clientExternalId] : [],
          state_code: [stateCode],
        };

        const {
          results: vertexResults,
          nextPageToken,
          filter: vertexFilter,
        } = await vertexSearch({
          withSnippet,
          query,
          pageToken: cursor,
          includeFilterConditions,
          projectId: process.env["VERTEX_PROJECT_ID"],
          engineId: process.env["VERTEX_ENGINE_ID"],
        });

        let exactMatchResults: Awaited<SearchResults> = [];

        let performedExactMatchSearch = false;
        let exactMatchQuery;
        // Only fetch exact match results if we're requesting the first page of results
        if (!cursor) {
          performedExactMatchSearch = true;

          try {
            const { results, queryString } = await exactMatchSearch({
              query,
              projectId: process.env["VERTEX_PROJECT_ID"],
              tableAddress: process.env["CASE_NOTES_BQ_TABLE_ADDRESS"],
              includeFilterConditions,
            });
            exactMatchResults = results;
            exactMatchQuery = queryString;
          } catch (e) {
            // Log the error but don't throw it, since we still want to return the search results
            captureException(`Failed to fetch exact match results: ${e}`);
          }
        }

        const sortedResults = sortResults(vertexResults, exactMatchResults);

        try {
          logResults({
            queryInfo: {
              query,
              clientExternalId,
              pageToken: cursor,
              stateCode,
              userExternalId,
              timestamp: requestTime,
              performedExactMatchSearch,
              exactMatchQuery,
              vertexFilter,
            },
            results: sortedResults,
            projectId: process.env["LOGS_BQ_PROJECT_ID"],
            datasetId: process.env["LOGS_BQ_DATASET_ID"],
            tableId: process.env["LOGS_BQ_TABLE_ID"],
          });
        } catch (e) {
          // Log the error but don't throw it, since we still want to return the search results
          captureException(`Failed to log results: ${e}`);
        }

        return {
          results: sortedResults,
          nextPageToken,
        };
      },
    ),
});

// export type definition of API
export type AppRouter = typeof appRouter;
