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

import { protos, SearchServiceClient } from "@google-cloud/discoveryengine";
import { TRPCError } from "@trpc/server";

import { baseProcedure, router } from "~@case-notes-server/trpc/init";
import { searchSchema } from "~@case-notes-server/trpc/schema";
import {
  extractCaseNotesResults,
  formatFilterConditions,
  getContentSearchSpec,
} from "~@case-notes-server/trpc/utils";

const DISCOVERY_ENGINE_API_ENDPOINT = "us-discoveryengine.googleapis.com";
const LOCATION = "us";
const COLLECTION_ID = "default_collection";
const SERVING_CONFIG_ID = "default_config";

const PAGE_SIZE = 20;
const QUERY_EXPANSION_CONDITION =
  protos.google.cloud.discoveryengine.v1alpha.SearchRequest.QueryExpansionSpec
    .Condition.AUTO;
const SPELL_CORRECTION_MODE =
  protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode
    .AUTO;
const AUTO_PAGINATE_SETTING = false;

export const appRouter = router({
  search: baseProcedure
    .input(searchSchema)
    .query(
      async ({
        input: { withSnippet, query, externalId },
        ctx: { stateCode },
      }) => {
        if (!process.env["PROJECT_ID"] || !process.env["ENGINE_ID"]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Required env variables are not set",
          });
        }

        const searchClient = new SearchServiceClient({
          apiEndpoint: DISCOVERY_ENGINE_API_ENDPOINT,
        });

        const includeFilterConditions = {
          external_id: externalId ? [externalId] : [],
          state_code: [stateCode],
        };

        const contentSearchSpec = getContentSearchSpec(withSnippet);

        const servingConfig =
          searchClient.projectLocationCollectionEngineServingConfigPath(
            process.env["PROJECT_ID"],
            LOCATION,
            COLLECTION_ID,
            process.env["ENGINE_ID"],
            SERVING_CONFIG_ID,
          );

        const filter = formatFilterConditions(includeFilterConditions);

        const request = {
          query,
          servingConfig,
          contentSearchSpec,
          filter,
          pageSize: PAGE_SIZE,
          queryExpansionSpec: {
            condition: QUERY_EXPANSION_CONDITION,
          },
          spellCorrectionSpec: {
            mode: SPELL_CORRECTION_MODE,
          },
        } satisfies protos.google.cloud.discoveryengine.v1.ISearchRequest;

        const [results] = await searchClient.search(request, {
          autoPaginate: AUTO_PAGINATE_SETTING,
        });

        const extractedResults = extractCaseNotesResults(results);
        return extractedResults.map((result, i) => ({
          ...result,
          relevanceOrder: i,
        }));
      },
    ),
});

// export type definition of API
export type AppRouter = typeof appRouter;
