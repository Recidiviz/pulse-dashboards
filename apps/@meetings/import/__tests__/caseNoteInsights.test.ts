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

import { describe, expect, test } from "vitest";

import {
  CNI_EMPLOYMENT_FILE_NAME,
  CNI_HOUSING_FILE_NAME,
} from "~@meetings/import/constants";
import { getImportHandler } from "~@meetings/import/handler";
import { testPrismaClient } from "~@meetings/import/test/setup";
import {
  TEST_CNI_EMPLOYMENT_FILE_NAME,
  TEST_CNI_HOUSING_FILE_NAME,
  TEST_STATE_CODE,
} from "~@meetings/import/test/setup/constants";
import { fakeClient } from "~@meetings/import/test/setup/seed";
import { StateCode } from "~@meetings/prisma/client";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

// The raw shape as it appears in the exported GCS file: a nested JSON object (not a
// stringified JSON blob) with snake_case keys.
const rawEmploymentCniFields = {
  primary_status: {
    field_value: "employed",
    quotes: ["I have a job now"],
    last_verified_date: "2024-01-01",
    extractor_version_id: "extractor-v1",
    document_id: "doc-hash-1",
  },
  employers: [
    {
      job_title: {
        field_value: "Line Cook",
        quotes: ["I work as a line cook"],
        last_verified_date: "2024-01-01",
        extractor_version_id: "extractor-v1",
        document_id: "doc-hash-1",
      },
    },
  ],
};

const rawHousingCniFields = {
  primary_status: {
    field_value: "housed",
    quotes: ["I have my own apartment"],
    last_verified_date: "2024-02-01",
    extractor_version_id: "extractor-v1",
    document_id: "doc-hash-1",
  },
};

// The camelCase shape we expect to be stored in the db after import.
const processedEmploymentCniFields = {
  primaryStatus: {
    fieldValue: "employed",
    quotes: ["I have a job now"],
    lastVerifiedDate: "2024-01-01",
    extractorVersionId: "extractor-v1",
    documentId: "doc-hash-1",
  },
  employers: [
    {
      jobTitle: {
        fieldValue: "Line Cook",
        quotes: ["I work as a line cook"],
        lastVerifiedDate: "2024-01-01",
        extractorVersionId: "extractor-v1",
        documentId: "doc-hash-1",
      },
    },
  ],
};

const processedHousingCniFields = {
  primaryStatus: {
    fieldValue: "housed",
    quotes: ["I have my own apartment"],
    lastVerifiedDate: "2024-02-01",
    extractorVersionId: "extractor-v1",
    documentId: "doc-hash-1",
  },
};

describe("import case note insights employment data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing summaries and insert new ones", async () => {
    const newClient = await testPrismaClient.client.create({
      data: {
        stateCode: StateCode.US_NE,
        personId: BigInt(2),
        stablePersonExternalId: "client-ext-2",
        stablePersonExternalIdType: "client-ext-type-1",
        pseudonymizedId: "client-pid-2",
        displayPersonExternalId: "client-display-ext-2",
        givenNames: "New",
        middleNames: "",
        surname: "Client",
        suffix: "",
        supervisionType: "PAROLE",
        staffEmails: [],
        lastImportedAt: new Date(0),
      },
    });

    await testPrismaClient.caseNoteInsightsSummary.create({
      data: {
        stateCode: StateCode.US_NE,
        clientId: fakeClient.personId,
        category: "employment",
        cniFields: {
          primaryStatus: {
            fieldValue: "unemployed",
            quotes: ["I don't have a job"],
            lastVerifiedDate: "2023-01-01",
            extractorVersionId: "old-extractor",
            documentId: "old-document",
          },
          employers: [],
        },
        lastImportedAt: new Date(0),
      },
    });

    dataProviderSingleton.setData(TEST_CNI_EMPLOYMENT_FILE_NAME, [
      // Update to the existing summary
      {
        state_code: StateCode.US_NE,
        // person_id is a string in the import file
        person_id: fakeClient.personId.toString(),
        category: "employment",
        cni_fields: rawEmploymentCniFields,
      },
      // New summary for a new client + category pair
      {
        state_code: StateCode.US_NE,
        person_id: newClient.personId.toString(),
        category: "employment",
        cni_fields: rawEmploymentCniFields,
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CNI_EMPLOYMENT_FILE_NAME]);

    const dbSummaries = await testPrismaClient.caseNoteInsightsSummary.findMany(
      {
        orderBy: { clientId: "asc" },
      },
    );

    // There should only be two summaries - the updated one and the new one
    expect(dbSummaries).toHaveLength(2);

    expect(dbSummaries).toEqual([
      expect.objectContaining({
        clientId: fakeClient.personId,
        category: "employment",
        cniFields: processedEmploymentCniFields,
      }),
      expect.objectContaining({
        clientId: newClient.personId,
        category: "employment",
        cniFields: processedEmploymentCniFields,
      }),
    ]);
  });

  test("should correctly import more than BATCH_SIZE case note insights summaries", async () => {
    const existingSummaryData = {
      state_code: StateCode.US_NE,
      person_id: fakeClient.personId.toString(),
      category: "employment",
      cni_fields: rawEmploymentCniFields,
    };

    // Generate 600 new summaries (more than BATCH_SIZE of 500), each for a distinct
    // client so they don't collide with the unique [clientId, category] constraint.
    const batchClients = Array.from({ length: 600 }, (_, i) => ({
      stateCode: StateCode.US_NE,
      personId: BigInt(1000 + i),
      stablePersonExternalId: `batch-client-ext-${i}`,
      stablePersonExternalIdType: "client-ext-type-1",
      pseudonymizedId: `batch-client-pid-${i}`,
      displayPersonExternalId: `batch-client-display-ext-${i}`,
      givenNames: "Batch",
      middleNames: "",
      surname: "Client",
      suffix: "",
      supervisionType: "PAROLE",
      staffEmails: [],
      lastImportedAt: new Date(0),
    }));
    await testPrismaClient.client.createMany({ data: batchClients });

    const newSummariesData = batchClients.map((client) => ({
      state_code: StateCode.US_NE,
      person_id: client.personId.toString(),
      category: "employment",
      cni_fields: rawEmploymentCniFields,
    }));

    dataProviderSingleton.setData(TEST_CNI_EMPLOYMENT_FILE_NAME, [
      existingSummaryData,
      ...newSummariesData,
    ]);

    await importHandler.import(TEST_STATE_CODE, [CNI_EMPLOYMENT_FILE_NAME]);

    const dbSummaries =
      await testPrismaClient.caseNoteInsightsSummary.findMany();
    expect(dbSummaries).toHaveLength(601);
  });
});

describe("import case note insights housing data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should upsert existing summaries and insert new ones", async () => {
    const newClient = await testPrismaClient.client.create({
      data: {
        stateCode: StateCode.US_NE,
        personId: BigInt(2),
        stablePersonExternalId: "client-ext-2",
        stablePersonExternalIdType: "client-ext-type-1",
        pseudonymizedId: "client-pid-2",
        displayPersonExternalId: "client-display-ext-2",
        givenNames: "New",
        middleNames: "",
        surname: "Client",
        suffix: "",
        supervisionType: "PAROLE",
        staffEmails: [],
        lastImportedAt: new Date(0),
      },
    });

    await testPrismaClient.caseNoteInsightsSummary.create({
      data: {
        stateCode: StateCode.US_NE,
        clientId: fakeClient.personId,
        category: "housing",
        cniFields: {
          primaryStatus: {
            fieldValue: "unhoused",
            quotes: ["I don't have a place to live"],
            lastVerifiedDate: "2023-01-01",
            extractorVersionId: "old-extractor",
            documentId: "old-document",
          },
        },
        lastImportedAt: new Date(0),
      },
    });

    dataProviderSingleton.setData(TEST_CNI_HOUSING_FILE_NAME, [
      // Update to the existing summary
      {
        state_code: StateCode.US_NE,
        // person_id is a string in the import file
        person_id: fakeClient.personId.toString(),
        category: "housing",
        cni_fields: rawHousingCniFields,
      },
      // New summary for a new client + category pair
      {
        state_code: StateCode.US_NE,
        person_id: newClient.personId.toString(),
        category: "housing",
        cni_fields: rawHousingCniFields,
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [CNI_HOUSING_FILE_NAME]);

    const dbSummaries = await testPrismaClient.caseNoteInsightsSummary.findMany(
      {
        orderBy: { clientId: "asc" },
      },
    );

    // There should only be two summaries - the updated one and the new one
    expect(dbSummaries).toHaveLength(2);

    expect(dbSummaries).toEqual([
      expect.objectContaining({
        clientId: fakeClient.personId,
        category: "housing",
        cniFields: processedHousingCniFields,
      }),
      expect.objectContaining({
        clientId: newClient.personId,
        category: "housing",
        cniFields: processedHousingCniFields,
      }),
    ]);
  });

  test("should correctly import more than BATCH_SIZE case note insights summaries", async () => {
    const existingSummaryData = {
      state_code: StateCode.US_NE,
      person_id: fakeClient.personId.toString(),
      category: "housing",
      cni_fields: rawHousingCniFields,
    };

    // Generate 600 new summaries (more than BATCH_SIZE of 500), each for a distinct
    // client so they don't collide with the unique [clientId, category] constraint.
    const batchClients = Array.from({ length: 600 }, (_, i) => ({
      stateCode: StateCode.US_NE,
      personId: BigInt(1000 + i),
      stablePersonExternalId: `batch-client-ext-${i}`,
      stablePersonExternalIdType: "client-ext-type-1",
      pseudonymizedId: `batch-client-pid-${i}`,
      displayPersonExternalId: `batch-client-display-ext-${i}`,
      givenNames: "Batch",
      middleNames: "",
      surname: "Client",
      suffix: "",
      supervisionType: "PAROLE",
      staffEmails: [],
      lastImportedAt: new Date(0),
    }));
    await testPrismaClient.client.createMany({ data: batchClients });

    const newSummariesData = batchClients.map((client) => ({
      state_code: StateCode.US_NE,
      person_id: client.personId.toString(),
      category: "housing",
      cni_fields: rawHousingCniFields,
    }));

    dataProviderSingleton.setData(TEST_CNI_HOUSING_FILE_NAME, [
      existingSummaryData,
      ...newSummariesData,
    ]);

    await importHandler.import(TEST_STATE_CODE, [CNI_HOUSING_FILE_NAME]);

    const dbSummaries =
      await testPrismaClient.caseNoteInsightsSummary.findMany();
    expect(dbSummaries).toHaveLength(601);
  });
});
