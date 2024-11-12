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

import { describe, expect, test, vi } from "vitest";

import { testTRPCClient } from "~case-notes-server/test/setup";

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
  undefined,
  {
    nextPageToken: "next-page-token",
  },
]);

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
        query: vi.fn(),
        dataset: vi.fn().mockImplementation(() => {
          return {
            table: vi.fn().mockImplementation(() => {
              return {
                insert: vi.fn(),
              };
            }),
          };
        }),
      };
    }),
  };
});

describe("search", () => {
  test("trpc routes should be set", async () => {
    const { results } = await testTRPCClient.search.query({
      query: "housing",
      clientExternalId: "fake-external-id",
      cursor: "fake-page-token",
      userExternalId: "fake-user-external-id",
    });

    expect(results).toEqual([
      expect.objectContaining({
        documentId: "doc-id",
      }),
    ]);
  });
});
