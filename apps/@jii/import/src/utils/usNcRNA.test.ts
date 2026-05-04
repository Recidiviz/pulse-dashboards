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

import { z } from "zod";

import { getPrismaClientForStateCode } from "~@jii/prisma";
import {
  dataProviderSingleton,
  MockImportHandler,
} from "~data-import-plugin/testkit";

import { NC_RNA_FILE_NAME } from "../constants";
import { getImportHandler } from "../handler";
import { rnaWritebackSchema } from "../models";
import { resetDb } from "../testUtils";

vi.mock("~data-import-plugin", () => ({
  ImportHandler: MockImportHandler,
}));

const STATE_CODE = "US_NC";
const DATA_PROVIDER_FILE_NAME = `${STATE_CODE}/${NC_RNA_FILE_NAME}`;

const importHandler = getImportHandler();
const prismaClient = getPrismaClientForStateCode(STATE_CODE);

const personData: z.input<typeof rnaWritebackSchema> = {
  pseudonymized_id: "test_pseudonymized_id",
  seq_number: "1",
  opus_id: "test_opus_id",
  admit_date: "2022-02-22",
};

describe("transformAndLoadRNAWritebackData", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(async () => {
    vi.setSystemTime(new Date("2025-05-19"));
    await resetDb(prismaClient);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("inserts a new person", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [personData]);
    await importHandler.import(STATE_CODE, [NC_RNA_FILE_NAME]);

    const result = await prismaClient.usNcRNAWritebackData.findMany();
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "admitDate": 2022-02-22T00:00:00.000Z,
          "importedAt": 2025-05-19T00:00:00.000Z,
          "opusId": "test_opus_id",
          "pseudonymizedId": "test_pseudonymized_id",
          "seqNumber": "1",
        },
      ]
    `);
  });

  it("ignores extra columns", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...personData, state_code: "US_NC", person_id: "123" },
    ]);
    await importHandler.import(STATE_CODE, [NC_RNA_FILE_NAME]);

    const result = await prismaClient.usNcRNAWritebackData.findMany();
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "admitDate": 2022-02-22T00:00:00.000Z,
          "importedAt": 2025-05-19T00:00:00.000Z,
          "opusId": "test_opus_id",
          "pseudonymizedId": "test_pseudonymized_id",
          "seqNumber": "1",
        },
      ]
    `);
  });

  it("upserts an existing person", async () => {
    // Import the person
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [personData]);
    await importHandler.import(STATE_CODE, [NC_RNA_FILE_NAME]);
    expect(await prismaClient.usNcRNAWritebackData.findMany()).toHaveLength(1);

    // Import one existing person and one new person, on the next day
    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...personData, seq_number: null },
      { ...personData, pseudonymized_id: "other_pseudonymized_id" },
    ]);
    await importHandler.import(STATE_CODE, [NC_RNA_FILE_NAME]);

    // Should be only one result, with corresponding `importedAt`
    const result = await prismaClient.usNcRNAWritebackData.findMany();
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "admitDate": 2022-02-22T00:00:00.000Z,
          "importedAt": 2025-05-20T00:00:00.000Z,
          "opusId": "test_opus_id",
          "pseudonymizedId": "other_pseudonymized_id",
          "seqNumber": "1",
        },
        {
          "admitDate": 2022-02-22T00:00:00.000Z,
          "importedAt": 2025-05-20T00:00:00.000Z,
          "opusId": "test_opus_id",
          "pseudonymizedId": "test_pseudonymized_id",
          "seqNumber": null,
        },
      ]
    `);
  });

  it("correctly imports more than BATCH_SIZE people", async () => {
    const manyPeople = Array.from({ length: 501 }, (_, i) => ({
      ...personData,
      pseudonymized_id: `${personData.pseudonymized_id}${i}`,
      opus_id: `${personData.opus_id}${i}`,
    }));

    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, manyPeople);
    await importHandler.import(STATE_CODE, [NC_RNA_FILE_NAME]);

    const result = await prismaClient.usNcRNAWritebackData.findMany();
    expect(result).toHaveLength(manyPeople.length);
  });
});
