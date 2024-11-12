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
import { captureException } from "@sentry/node";
import _ from "lodash";
import moment from "moment";

import { EXCLUDE_FILTER_CONDITIONS } from "~@case-notes-server/trpc/common/constants";
import { IncludeFilterConditions } from "~@case-notes-server/trpc/common/types";

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

const MAX_EXTRACTIVE_ANSWER_COUNT = 1;

function getContentSearchSpec(withSnippet = false) {
  if (!withSnippet) {
    return undefined;
  }
  return {
    extractiveContentSpec: {
      maxExtractiveAnswerCount: MAX_EXTRACTIVE_ANSWER_COUNT, // Ensuring extractive answer is always present.
    },
    snippetSpec: withSnippet
      ? {
          returnSnippet: true, // Only one snippet per document.
        }
      : undefined,
  } satisfies protos.google.cloud.discoveryengine.v1.SearchRequest.IContentSearchSpec;
}

function formatFilterConditions(
  includeFilterConditions: IncludeFilterConditions,
) {
  const formattedConditions = [];

  formattedConditions.push(
    ..._.map(includeFilterConditions, (values, field) => {
      if (values.length === 0) {
        return undefined;
      }
      const valuesAsString = values.map((value) => `"${value}"`).join(", ");
      return `${field}: ANY(${valuesAsString})`;
    }),
  );

  formattedConditions.push(
    ..._.map(EXCLUDE_FILTER_CONDITIONS, (values, field) => {
      if (values.length === 0) {
        return undefined;
      }
      const valuesAsString = values.map((value) => `"${value}"`).join(", ");
      return `NOT ${field}: ANY(${valuesAsString})`;
    }),
  );

  return formattedConditions.filter((v) => v !== undefined).join(" AND ");
}

function extractCaseNotesResults(
  searchResults: protos.google.cloud.discoveryengine.v1.SearchResponse.ISearchResult[],
) {
  const results = [];
  for (const result of searchResults) {
    if (
      !result.document ||
      !result.document.structData ||
      !result.document.structData.fields ||
      !result.document.id
    ) {
      continue;
    }

    const data = result.document.structData.fields;
    const documentId = result.document.id;

    try {
      const noteBody = data["note_body"]?.stringValue ?? undefined;
      const dateString = data["note_date"]?.stringValue ?? undefined;

      results.push({
        documentId: documentId,
        date: dateString ? moment.utc(dateString).toDate() : undefined,
        contactMode: data["note_mode"]?.stringValue ?? undefined,
        type: data["note_type"]?.stringValue ?? undefined,
        title: data["note_title"]?.stringValue ?? undefined,
        preview: noteBody?.substring(0, 250),
        fullText: noteBody ?? undefined,
      });
    } catch (e) {
      // Capture any errors during extraction but don't let it stop other results from being returned
      captureException(
        `Could not parse results. document.id = ${documentId}, document = ${JSON.stringify(result.document)}. Reason for error: ${e}`,
      );
    }
  }

  return results;
}

type VertexSearchArgs = {
  withSnippet: boolean;
  query: string;
  includeFilterConditions: IncludeFilterConditions;
  pageToken?: string;
  projectId: string;
  engineId: string;
};

export async function vertexSearch({
  withSnippet,
  query,
  pageToken,
  includeFilterConditions,
  projectId,
  engineId,
}: VertexSearchArgs) {
  const searchClient = new SearchServiceClient({
    apiEndpoint: DISCOVERY_ENGINE_API_ENDPOINT,
  });

  const contentSearchSpec = getContentSearchSpec(withSnippet);

  const servingConfig =
    searchClient.projectLocationCollectionEngineServingConfigPath(
      projectId,
      LOCATION,
      COLLECTION_ID,
      engineId,
      SERVING_CONFIG_ID,
    );

  const filter = formatFilterConditions(includeFilterConditions);

  const request = {
    query,
    pageToken,
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

  const [results, , response] = await searchClient.search(request, {
    autoPaginate: AUTO_PAGINATE_SETTING,
  });

  const extractedResults = extractCaseNotesResults(results);

  return {
    nextPageToken: response.nextPageToken ?? undefined,
    results: extractedResults,
    filter,
  };
}
