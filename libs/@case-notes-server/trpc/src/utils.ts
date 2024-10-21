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

import { protos } from "@google-cloud/discoveryengine";
import { captureException } from "@sentry/node";
import _ from "lodash";

const MAX_EXTRACTIVE_ANSWER_COUNT = 1;
const MAX_SNIPPET_COUNT = 1;

const EXCLUDE_FILTER_CONDITIONS = {
  note_type: [
    "Investigation (Confidential)",
    "Mental Health (Confidential)",
    "FIAT - Confidential",
  ],
};

export function getContentSearchSpec(withSnippet = false) {
  if (withSnippet) {
    return undefined;
  }
  return {
    extractive_content_spec: {
      maxExtractiveAnswerCount: MAX_EXTRACTIVE_ANSWER_COUNT, // Ensuring extractive answer is always present.
    },
    snippetSpec: withSnippet
      ? {
          maxSnippetCount: MAX_SNIPPET_COUNT, // Only one snippet per document.
        }
      : undefined,
  };
}

export function formatFilterConditions(includeFilterConditions: {
  external_id: string[];
  state_code: string[];
}) {
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

export function extractCaseNotesResults(
  searchResults: protos.google.cloud.discoveryengine.v1.SearchResponse.ISearchResult[],
) {
  const results = [];
  for (const result of searchResults) {
    if (
      !result.document ||
      !result.document.structData ||
      !result.document.structData.fields
    ) {
      continue;
    }

    const data = result.document.structData.fields;
    const documentId = result.document.id;

    try {
      const noteBody = data["note_body"]?.stringValue;
      const dateString = data["note_date"]?.stringValue;
      results.push({
        documentId: documentId,
        date: dateString ? new Date(dateString) : undefined,
        contactMode: data["note_mode"]?.stringValue,
        type: data["note_type"]?.stringValue,
        title: data["note_title"]?.stringValue,
        preview: noteBody?.substring(0, 250),
        fullText: noteBody,
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
