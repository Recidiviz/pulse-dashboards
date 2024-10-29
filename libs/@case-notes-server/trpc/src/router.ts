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

import { TRPCError } from "@trpc/server";

import { baseProcedure, router } from "~@case-notes-server/trpc/init";
import { searchSchema } from "~@case-notes-server/trpc/schema";
import { vertexSearch } from "~@case-notes-server/trpc/utils/ai";
import { exactMatchSearch } from "~@case-notes-server/trpc/utils/exact-match";

type SearchResults = {
  documentId: string | null | undefined;
  date: Date | undefined;
  contactMode: string | null | undefined;
  type: string | null | undefined;
  title: string | null | undefined;
  preview: string | undefined;
  fullText: string | null | undefined;
}[];

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
        exactMatchResults: SearchResults;
        nonExactMatchResults: SearchResults;
      },
      result,
    ) => {
      if (exactMatchResultIds.includes(result.documentId)) {
        acc.exactMatchResults.push(result);
      } else {
        acc.nonExactMatchResults.push(result);
      }
      return acc;
    },
    {
      exactMatchResults: [],
      nonExactMatchResults: [],
    },
  );

  // Get the exact match results that are not in the vertex results
  const nonVertexExactMatchResults = exactMatchResults.filter((result) => {
    return !vertexResultIds.includes(result.documentId);
  });

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
        input: { withSnippet, query, externalId, pageToken },
        ctx: { stateCode },
      }) => {
        if (
          !process.env["VERTEX_PROJECT_ID"] ||
          !process.env["VERTEX_ENGINE_ID"] ||
          !process.env["CASE_NOTES_BQ_TABLE_ADDRESS"]
        ) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Required env variables are not set",
          });
        }

        const includeFilterConditions = {
          external_id: externalId ? [externalId] : [],
          state_code: [stateCode],
        };

        const { results: vertexResults, nextPageToken } = await vertexSearch({
          withSnippet,
          query,
          pageToken,
          includeFilterConditions,
          projectId: process.env["VERTEX_PROJECT_ID"],
          engineId: process.env["VERTEX_ENGINE_ID"],
        });

        let exactMatchResults: Awaited<ReturnType<typeof exactMatchSearch>> =
          [];

        // Only fetch exact match results if we're requesting the first page of results
        if (!pageToken) {
          exactMatchResults = await exactMatchSearch({
            query,
            projectId: process.env["VERTEX_PROJECT_ID"],
            tableAddress: process.env["CASE_NOTES_BQ_TABLE_ADDRESS"],
            includeFilterConditions,
          });
        }

        const sortedResults = exactMatchResults.length
          ? sortResults(vertexResults, exactMatchResults)
          : vertexResults;

        return {
          results: sortedResults,
          nextPageToken,
        };
      },
    ),
});

// export type definition of API
export type AppRouter = typeof appRouter;
