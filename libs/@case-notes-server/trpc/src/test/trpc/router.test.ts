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
import { describe, expect, test, vi } from "vitest";

import { testTRPCClient } from "~@case-notes-server/trpc/test/setup";

const mockServerConfigFn = vi.fn().mockReturnValue("serving-config");

const mockSearchFn = vi.fn().mockResolvedValue([
  [
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
]);

vi.mock("@google-cloud/discoveryengine", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error - TS doesn't know about the mock
    ...actual,
    SearchServiceClient: vi.fn().mockImplementation(() => {
      return {
        projectLocationCollectionEngineServingConfigPath: mockServerConfigFn,
        search: mockSearchFn,
      };
    }),
  };
});

describe("search", () => {
  test("should work if all parameters are passed", async () => {
    const searchReults = await testTRPCClient.search.query({
      query: "housing",
      externalId: "fake-external-id",
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
        contentSearchSpec: {
          extractive_content_spec: {
            maxExtractiveAnswerCount: 1,
          },
          snippetSpec: undefined,
        },
        filter:
          'external_id: ANY("fake-external-id") AND state_code: ANY("US_ID") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
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

    expect(searchReults).toEqual([
      {
        documentId: "doc-id",
        fullText:
          "During our meeting today, Alice was punctual and provided an update on her housing search. She has found a potential apartment and is hopeful about securing it soon. Her job is going well, and her manager has praised her dedication. Alice's sentencing evaluation is proceeding smoothly, and she feels confident about her future.",
        date: new Date("2024-10-16"),
        contactMode: "Address",
        type: "Supervision Notes",
        title: "Address Change",
        preview:
          "During our meeting today, Alice was punctual and provided an update on her housing search. She has found a potential apartment and is hopeful about securing it soon. Her job is going well, and her manager has praised her dedication. Alice's sentencin",
        relevanceOrder: 0,
      },
    ]);
  });

  test("should work without external ids", async () => {
    const searchReults = await testTRPCClient.search.query({
      query: "housing",
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
        contentSearchSpec: {
          extractive_content_spec: {
            maxExtractiveAnswerCount: 1,
          },
          snippetSpec: undefined,
        },
        filter:
          'state_code: ANY("US_ID") AND NOT note_type: ANY("Investigation (Confidential)", "Mental Health (Confidential)", "FIAT - Confidential")',
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

    expect(searchReults).toEqual([
      {
        documentId: "doc-id",
        fullText:
          "During our meeting today, Alice was punctual and provided an update on her housing search. She has found a potential apartment and is hopeful about securing it soon. Her job is going well, and her manager has praised her dedication. Alice's sentencing evaluation is proceeding smoothly, and she feels confident about her future.",
        date: new Date("2024-10-16"),
        contactMode: "Address",
        type: "Supervision Notes",
        title: "Address Change",
        preview:
          "During our meeting today, Alice was punctual and provided an update on her housing search. She has found a potential apartment and is hopeful about securing it soon. Her job is going well, and her manager has praised her dedication. Alice's sentencin",
        relevanceOrder: 0,
      },
    ]);
  });
});
