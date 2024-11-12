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
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testTRPCClient } from "~@case-notes-server/trpc/test/setup";

const mockServerConfigFn = vi.fn().mockReturnValue("serving-config");

const mockSearchFn = vi.fn().mockResolvedValue([
  [
    {
      document: {
        id: "exact-match-id",
        structData: {
          fields: {
            note_body: {
              stringValue:
                "After Kevin completes his CTC days, he will move to ROL or Veterans Housing. He is not going to live with his brother in Meridian because he feels he needs a clean and sober start to his probation again. Kevin is UE at this time and he will either begin looking for EM or begin CS hours per the VTC rules",
            },
            note_date: {
              stringValue: "2024-10-27",
            },
            note_mode: {
              stringValue: "Face to Face",
            },
            note_type: {
              stringValue: "Check In",
            },
            note_title: {
              stringValue: "",
            },
          },
        },
      },
    },
    {
      document: {
        id: "doc-id",
        structData: {
          fields: {
            note_body: {
              stringValue:
                "During our meeting today, Alice was punctual and provided an update on her housing search. She has found a potential apartment and is hopeful about securing it soon. Her job is going well, and her manager has praised her dedication. Alice's sentencing evaluation is proceeding smoothly, and she feels confident about her future.",
            },
            note_date: {
              stringValue: "2024-10-16",
            },
            note_mode: {
              stringValue: "Address",
            },
            note_type: {
              stringValue: "Supervision Notes",
            },
            note_title: {
              stringValue: "Address Change",
            },
          },
        },
      },
    },
  ],
  undefined,
  {
    nextPageToken: "next-page-token",
  },
]);

const mockQueryFn = vi.fn().mockResolvedValue([
  [
    {
      id: "exact-match-id",
      note_date: "2024-10-27",
      note_title: "",
      note_body:
        "After Kevin completes his CTC days, he will move to ROL or Veterans Housing. He is not going to live with his brother in Meridian because he feels he needs a clean and sober start to his probation again. Kevin is UE at this time and he will either begin looking for EM or begin CS hours per the VTC rules",
      note_type: "Check In",
      note_mode: "Face to Face",
      external_id: "exact-match-external-id",
    },
    {
      id: "exact-match-id-2",
      note_date: "2024-10-27",
      note_title: "",
      note_body: "Another exact match search result.",
      note_type: "Check In",
      note_mode: "Face to Face",
      external_id: "exact-match-external-id",
    },
  ],
]);

const mockInsertFn = vi.fn();
const mockTableFn = vi.fn().mockImplementation(() => {
  return {
    insert: mockInsertFn,
  };
});
const mockDatasetFn = vi.fn().mockImplementation(() => {
  return {
    table: mockTableFn,
  };
});

vi.mock("@google-cloud/discoveryengine", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@google-cloud/discoveryengine")>();
  return {
    ...actual,
    SearchServiceClient: vi.fn().mockImplementation(() => {
      return {
        projectLocationCollectionEngineServingConfigPath: mockServerConfigFn,
        search: mockSearchFn,
      };
    }),
  };
});

vi.mock("@google-cloud/bigquery", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@google-cloud/bigquery")>();
  return {
    ...actual,
    BigQuery: vi.fn().mockImplementation(() => {
      return {
        query: mockQueryFn,
        dataset: mockDatasetFn,
      };
    }),
  };
});

describe("search", () => {
  beforeEach(() => {
    mockServerConfigFn.mockClear();
    mockSearchFn.mockClear();
    mockQueryFn.mockClear();
    mockDatasetFn.mockClear();
    mockTableFn.mockClear();
    mockInsertFn.mockClear();
  });

  test("should work if all parameters are passed", async () => {
    const { results, nextPageToken } = await testTRPCClient.search.query({
      query: "housing",
      clientExternalId: "fake-external-id",
      userExternalId: "user-external-id",
    });

    expect(mockServerConfigFn).toHaveBeenCalledWith(
      "project-id",
      "us",
      "default_collection",
      "engine-id",
      "default_config",
    );

    expect(mockSearchFn).toHaveBeenCalledWith(
      {
        query: "housing",
        servingConfig: "serving-config",
        contentSearchSpec: undefined,
        pageToken: undefined,
        filter:
          'external_id: ANY("fake-external-id") AND state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
        pageSize: 20,
        queryExpansionSpec: {
          condition:
            protos.google.cloud.discoveryengine.v1alpha.SearchRequest
              .QueryExpansionSpec.Condition.AUTO,
        },
        spellCorrectionSpec: {
          mode: protos.google.cloud.discoveryengine.v1.SearchRequest
            .SpellCorrectionSpec.Mode.AUTO,
        },
      },
      { autoPaginate: false },
    );

    expect(mockQueryFn).toHaveBeenCalledWith(
      'SELECT * FROM `bq-table` WHERE external_id IN ("fake-external-id") AND state_code IN ("US_IX") AND note_type NOT IN ("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential") AND (regexp_contains(lower(external_id), lower(r"housing")) OR regexp_contains(lower(note_body), lower(r"housing")) OR regexp_contains(lower(note_date), lower(r"housing")) OR regexp_contains(lower(note_id), lower(r"housing")) OR regexp_contains(lower(note_mode), lower(r"housing")) OR regexp_contains(lower(note_title), lower(r"housing")) OR regexp_contains(lower(note_type), lower(r"housing")) OR regexp_contains(lower(state_code), lower(r"housing"))) LIMIT 50',
    );

    expect(nextPageToken).toEqual("next-page-token");
    // The order of results should be
    // 1. Vertex results with exact matches
    // 2. BigQuery results with exact matches
    // 3. Vertex results without exact matches
    expect(results).toEqual([
      {
        documentId: "exact-match-id",
        fullText:
          "After Kevin completes his CTC days, he will move to ROL or Veterans Housing. He is not going to live with his brother in Meridian because he feels he needs a clean and sober start to his probation again. Kevin is UE at this time and he will either begin looking for EM or begin CS hours per the VTC rules",
        date: new Date("2024-10-27"),
        contactMode: "Face to Face",
        type: "Check In",
        title: "",
        preview:
          "After Kevin completes his CTC days, he will move to ROL or Veterans Housing. He is not going to live with his brother in Meridian because he feels he needs a clean and sober start to his probation again. Kevin is UE at this time and he will either be",
        isExactMatch: true,
        isVertexMatch: true,
      },
      expect.objectContaining({
        documentId: "exact-match-id-2",
        isExactMatch: true,
        isVertexMatch: false,
      }),
      expect.objectContaining({
        documentId: "doc-id",
        isExactMatch: false,
        isVertexMatch: true,
      }),
    ]);

    expect(mockDatasetFn).toHaveBeenCalledWith("logs-dataset-id");
    expect(mockTableFn).toHaveBeenCalledWith("logs-table-id");
    expect(mockInsertFn).toHaveBeenCalledWith({
      query: "housing",
      page_token: undefined,
      state_code: "US_IX",
      client_external_id: "fake-external-id",
      user_external_id: "user-external-id",
      exact_match_query:
        'SELECT * FROM `bq-table` WHERE external_id IN ("fake-external-id") AND state_code IN ("US_IX") AND note_type NOT IN ("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential") AND (regexp_contains(lower(external_id), lower(r"housing")) OR regexp_contains(lower(note_body), lower(r"housing")) OR regexp_contains(lower(note_date), lower(r"housing")) OR regexp_contains(lower(note_id), lower(r"housing")) OR regexp_contains(lower(note_mode), lower(r"housing")) OR regexp_contains(lower(note_title), lower(r"housing")) OR regexp_contains(lower(note_type), lower(r"housing")) OR regexp_contains(lower(state_code), lower(r"housing"))) LIMIT 50',
      performed_exact_match_search: true,
      timestamp: expect.any(Date),
      vertex_filter:
        'external_id: ANY("fake-external-id") AND state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
      env: "test",
      results: JSON.stringify({
        "exact-match-id": {
          isExactMatch: true,
          isVertexMatch: true,
        },
        "exact-match-id-2": {
          isExactMatch: true,
          isVertexMatch: false,
        },
        "doc-id": {
          isExactMatch: false,
          isVertexMatch: true,
        },
      }),
    });
  });

  test("should perform full word matches for small searches", async () => {
    const { results, nextPageToken } = await testTRPCClient.search.query({
      query: "ua",
      clientExternalId: "fake-external-id",
      userExternalId: "user-external-id",
    });

    expect(mockServerConfigFn).toHaveBeenCalledWith(
      "project-id",
      "us",
      "default_collection",
      "engine-id",
      "default_config",
    );

    expect(mockSearchFn).toHaveBeenCalledWith(
      {
        query: "ua",
        servingConfig: "serving-config",
        contentSearchSpec: undefined,
        pageToken: undefined,
        filter:
          'external_id: ANY("fake-external-id") AND state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
        pageSize: 20,
        queryExpansionSpec: {
          condition:
            protos.google.cloud.discoveryengine.v1alpha.SearchRequest
              .QueryExpansionSpec.Condition.AUTO,
        },
        spellCorrectionSpec: {
          mode: protos.google.cloud.discoveryengine.v1.SearchRequest
            .SpellCorrectionSpec.Mode.AUTO,
        },
      },
      { autoPaginate: false },
    );

    expect(mockQueryFn).toHaveBeenCalledWith(
      'SELECT * FROM `bq-table` WHERE external_id IN ("fake-external-id") AND state_code IN ("US_IX") AND note_type NOT IN ("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential") AND (regexp_contains(lower(external_id), lower(r"\\bua\\b")) OR regexp_contains(lower(note_body), lower(r"\\bua\\b")) OR regexp_contains(lower(note_date), lower(r"\\bua\\b")) OR regexp_contains(lower(note_id), lower(r"\\bua\\b")) OR regexp_contains(lower(note_mode), lower(r"\\bua\\b")) OR regexp_contains(lower(note_title), lower(r"\\bua\\b")) OR regexp_contains(lower(note_type), lower(r"\\bua\\b")) OR regexp_contains(lower(state_code), lower(r"\\bua\\b"))) LIMIT 50',
    );

    expect(nextPageToken).toEqual("next-page-token");
    // The order of results should be
    // 1. Vertex results with exact matches
    // 2. BigQuery results with exact matches
    // 3. Vertex results without exact matches
    expect(results).toEqual([
      {
        documentId: "exact-match-id",
        fullText:
          "After Kevin completes his CTC days, he will move to ROL or Veterans Housing. He is not going to live with his brother in Meridian because he feels he needs a clean and sober start to his probation again. Kevin is UE at this time and he will either begin looking for EM or begin CS hours per the VTC rules",
        date: new Date("2024-10-27"),
        contactMode: "Face to Face",
        type: "Check In",
        title: "",
        preview:
          "After Kevin completes his CTC days, he will move to ROL or Veterans Housing. He is not going to live with his brother in Meridian because he feels he needs a clean and sober start to his probation again. Kevin is UE at this time and he will either be",
        isExactMatch: true,
        isVertexMatch: true,
      },
      expect.objectContaining({
        documentId: "exact-match-id-2",
        isExactMatch: true,
        isVertexMatch: false,
      }),
      expect.objectContaining({
        documentId: "doc-id",
        isExactMatch: false,
        isVertexMatch: true,
      }),
    ]);

    expect(mockDatasetFn).toHaveBeenCalledWith("logs-dataset-id");
    expect(mockTableFn).toHaveBeenCalledWith("logs-table-id");
    expect(mockInsertFn).toHaveBeenCalledWith({
      query: "ua",
      page_token: undefined,
      state_code: "US_IX",
      client_external_id: "fake-external-id",
      user_external_id: "user-external-id",
      exact_match_query:
        'SELECT * FROM `bq-table` WHERE external_id IN ("fake-external-id") AND state_code IN ("US_IX") AND note_type NOT IN ("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential") AND (regexp_contains(lower(external_id), lower(r"\\bua\\b")) OR regexp_contains(lower(note_body), lower(r"\\bua\\b")) OR regexp_contains(lower(note_date), lower(r"\\bua\\b")) OR regexp_contains(lower(note_id), lower(r"\\bua\\b")) OR regexp_contains(lower(note_mode), lower(r"\\bua\\b")) OR regexp_contains(lower(note_title), lower(r"\\bua\\b")) OR regexp_contains(lower(note_type), lower(r"\\bua\\b")) OR regexp_contains(lower(state_code), lower(r"\\bua\\b"))) LIMIT 50',
      performed_exact_match_search: true,
      timestamp: expect.any(Date),
      vertex_filter:
        'external_id: ANY("fake-external-id") AND state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
      env: "test",
      results: JSON.stringify({
        "exact-match-id": {
          isExactMatch: true,
          isVertexMatch: true,
        },
        "exact-match-id-2": {
          isExactMatch: true,
          isVertexMatch: false,
        },
        "doc-id": {
          isExactMatch: false,
          isVertexMatch: true,
        },
      }),
    });
  });

  test("should work without external ids", async () => {
    const { results, nextPageToken } = await testTRPCClient.search.query({
      query: "housing",
      userExternalId: "user-external-id",
    });

    expect(mockServerConfigFn).toHaveBeenCalledWith(
      "project-id",
      "us",
      "default_collection",
      "engine-id",
      "default_config",
    );

    expect(mockSearchFn).toHaveBeenCalledWith(
      {
        query: "housing",
        servingConfig: "serving-config",
        contentSearchSpec: undefined,
        filter:
          'state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
        pageSize: 20,
        queryExpansionSpec: {
          condition:
            protos.google.cloud.discoveryengine.v1alpha.SearchRequest
              .QueryExpansionSpec.Condition.AUTO,
        },
        spellCorrectionSpec: {
          mode: protos.google.cloud.discoveryengine.v1.SearchRequest
            .SpellCorrectionSpec.Mode.AUTO,
        },
      },
      { autoPaginate: false },
    );

    // Should not include external id filter
    expect(mockQueryFn).toHaveBeenCalledWith(
      'SELECT * FROM `bq-table` WHERE state_code IN ("US_IX") AND note_type NOT IN ("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential") AND (regexp_contains(lower(external_id), lower(r"housing")) OR regexp_contains(lower(note_body), lower(r"housing")) OR regexp_contains(lower(note_date), lower(r"housing")) OR regexp_contains(lower(note_id), lower(r"housing")) OR regexp_contains(lower(note_mode), lower(r"housing")) OR regexp_contains(lower(note_title), lower(r"housing")) OR regexp_contains(lower(note_type), lower(r"housing")) OR regexp_contains(lower(state_code), lower(r"housing"))) LIMIT 50',
    );

    expect(nextPageToken).toEqual("next-page-token");
    expect(results).toEqual([
      expect.objectContaining({
        documentId: "exact-match-id",
        isExactMatch: true,
        isVertexMatch: true,
      }),
      expect.objectContaining({
        documentId: "exact-match-id-2",
        isExactMatch: true,
        isVertexMatch: false,
      }),
      expect.objectContaining({
        documentId: "doc-id",
        isExactMatch: false,
        isVertexMatch: true,
      }),
    ]);

    expect(mockDatasetFn).toHaveBeenCalledWith("logs-dataset-id");
    expect(mockTableFn).toHaveBeenCalledWith("logs-table-id");
    expect(mockInsertFn).toHaveBeenCalledWith({
      query: "housing",
      page_token: undefined,
      state_code: "US_IX",
      client_external_id: undefined,
      user_external_id: "user-external-id",
      exact_match_query:
        'SELECT * FROM `bq-table` WHERE state_code IN ("US_IX") AND note_type NOT IN ("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential") AND (regexp_contains(lower(external_id), lower(r"housing")) OR regexp_contains(lower(note_body), lower(r"housing")) OR regexp_contains(lower(note_date), lower(r"housing")) OR regexp_contains(lower(note_id), lower(r"housing")) OR regexp_contains(lower(note_mode), lower(r"housing")) OR regexp_contains(lower(note_title), lower(r"housing")) OR regexp_contains(lower(note_type), lower(r"housing")) OR regexp_contains(lower(state_code), lower(r"housing"))) LIMIT 50',
      performed_exact_match_search: true,
      timestamp: expect.any(Date),
      vertex_filter:
        'state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
      env: "test",
      results: JSON.stringify({
        "exact-match-id": {
          isExactMatch: true,
          isVertexMatch: true,
        },
        "exact-match-id-2": {
          isExactMatch: true,
          isVertexMatch: false,
        },
        "doc-id": {
          isExactMatch: false,
          isVertexMatch: true,
        },
      }),
    });
  });

  test("shouldn't search bigquery if page token is passed", async () => {
    const { results, nextPageToken } = await testTRPCClient.search.query({
      query: "housing",
      clientExternalId: "fake-external-id",
      cursor: "next-page-token",
      userExternalId: "user-external-id",
    });

    expect(mockServerConfigFn).toHaveBeenCalledWith(
      "project-id",
      "us",
      "default_collection",
      "engine-id",
      "default_config",
    );

    expect(mockSearchFn).toHaveBeenCalledWith(
      {
        query: "housing",
        servingConfig: "serving-config",
        contentSearchSpec: undefined,
        pageToken: "next-page-token",
        filter:
          'external_id: ANY("fake-external-id") AND state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
        pageSize: 20,
        queryExpansionSpec: {
          condition:
            protos.google.cloud.discoveryengine.v1alpha.SearchRequest
              .QueryExpansionSpec.Condition.AUTO,
        },
        spellCorrectionSpec: {
          mode: protos.google.cloud.discoveryengine.v1.SearchRequest
            .SpellCorrectionSpec.Mode.AUTO,
        },
      },
      { autoPaginate: false },
    );

    // Shouldn't call BigQuery
    expect(mockQueryFn).toHaveBeenCalledTimes(0);

    expect(nextPageToken).toEqual("next-page-token");
    // Should only return vertex results
    expect(results).toEqual([
      expect.objectContaining({
        documentId: "exact-match-id",
        isExactMatch: false,
        isVertexMatch: true,
      }),
      expect.objectContaining({
        documentId: "doc-id",
        isExactMatch: false,
        isVertexMatch: true,
      }),
    ]);

    expect(mockDatasetFn).toHaveBeenCalledWith("logs-dataset-id");
    expect(mockTableFn).toHaveBeenCalledWith("logs-table-id");
    expect(mockInsertFn).toHaveBeenCalledWith({
      query: "housing",
      page_token: "next-page-token",
      state_code: "US_IX",
      client_external_id: "fake-external-id",
      user_external_id: "user-external-id",
      performed_exact_match_search: false,
      timestamp: expect.any(Date),
      exact_match_query: undefined,
      vertex_filter:
        'external_id: ANY("fake-external-id") AND state_code: ANY("US_IX") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
      env: "test",
      results: JSON.stringify({
        "exact-match-id": {
          isExactMatch: false,
          isVertexMatch: true,
        },
        "doc-id": {
          isExactMatch: false,
          isVertexMatch: true,
        },
      }),
    });
  });
});
