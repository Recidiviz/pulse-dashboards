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

import { getPrismaClientForStateCode } from "~@jii/prisma";
import {
  dataProviderSingleton,
  MockImportHandler,
} from "~data-import-plugin/testkit";

import { RESIDENTS_FILE_NAME } from "../../constants";
import { getImportHandler } from "../../handler";
import { resetDb } from "../../testUtils";
import { BATCH_SIZE } from "./resident";

vi.mock("~data-import-plugin", () => ({
  ImportHandler: MockImportHandler,
}));

const STATE_CODE = "US_NC";
const DATA_PROVIDER_FILE_NAME = `${STATE_CODE}/${RESIDENTS_FILE_NAME}`;

const importHandler = getImportHandler();
const prismaClient = getPrismaClientForStateCode(STATE_CODE);

const personData = {
  pseudonymized_id: "test_pseudo_id",
  person_external_id: "EXT001",
  display_id: "D001",
  state_code: "US_NC",
  person_name: JSON.stringify({
    given_names: "Jane",
    middle_names: "Q",
    surname: "Doe",
  }),
  facility_id: "FAC1",
  unit_id: "UN1",
  person_id: "1",
  state_specific_data: JSON.stringify({
    state_code: "US_NC",
  }),
};

describe("residentHandler", () => {
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

  it("inserts a new resident", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [personData]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const result = await prismaClient.resident.findMany();
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "displayId": "D001",
          "facilityId": "FAC1",
          "givenNames": "Jane",
          "importedAt": 2025-05-19T00:00:00.000Z,
          "middleNames": "Q",
          "personExternalId": "EXT001",
          "pseudonymizedId": "test_pseudo_id",
          "stateSpecificData": {
            "stateCode": "US_NC",
          },
          "surname": "Doe",
          "unitId": "UN1",
        },
      ]
    `);
  });

  it("ignores extra columns", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      {
        ...personData,
        // note here that state_code is also an expected extra column,
        // already in the test data
        extra_column: "extra_value",
      },
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const result = await prismaClient.resident.findFirstOrThrow();
    expect("stateCode" in result).toBeFalse();
    expect("extraColumn" in result).toBeFalse();
  });

  it("updates an existing resident", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [personData]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);
    expect(await prismaClient.resident.findMany()).toHaveLength(1);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...personData, facility_id: "FAC2" },
      { ...personData, pseudonymized_id: "other_pseudo_id", person_id: 2 },
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    expect(await prismaClient.resident.findMany()).toHaveLength(2);

    const updatedResident = await prismaClient.resident.findUniqueOrThrow({
      where: { pseudonymizedId: personData.pseudonymized_id },
    });
    expect(updatedResident.facilityId).toBe("FAC2");
    expect(updatedResident.importedAt).toEqual(new Date("2025-05-20"));

    const newResident = await prismaClient.resident.findUniqueOrThrow({
      where: { pseudonymizedId: "other_pseudo_id" },
    });
    expect(newResident.pseudonymizedId).toBe("other_pseudo_id");
    expect(newResident.importedAt).toEqual(new Date("2025-05-20"));
  });

  it("deletes residents not present in the current import", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      personData,
      { ...personData, pseudonymized_id: "other_pseudo_id", person_id: 2 },
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);
    expect(await prismaClient.resident.findMany()).toHaveLength(2);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [personData]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const retained = await prismaClient.resident.findUnique({
      where: { pseudonymizedId: personData.pseudonymized_id },
    });
    expect(retained).not.toBeNull();

    const deleted = await prismaClient.resident.findUnique({
      where: { pseudonymizedId: "other_pseudo_id" },
    });
    expect(deleted).toBeNull();
  });

  const minimalRecord = {
    pseudonymized_id: "minimal_pseudo_id",
    person_external_id: "EXT_MIN",
    display_id: "D_MIN",
    state_code: "US_NC",
    person_name: JSON.stringify({}),
    state_specific_data: JSON.stringify({ state_code: "US_NC" }),
    // facility_id, unit_id omitted — nullish in schema
    // given_names, middle_names, surname omitted — nullish in fullNameSchema
  };

  it("succeeds on create when all optional fields are missing", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [minimalRecord]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const result = await prismaClient.resident.findFirstOrThrow();
    expect(result.givenNames).toBeNull();
    expect(result.middleNames).toBeNull();
    expect(result.surname).toBeNull();
    expect(result.facilityId).toBeNull();
    expect(result.unitId).toBeNull();
  });

  it("succeeds on update when all optional fields are missing", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [personData]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...minimalRecord, pseudonymized_id: personData.pseudonymized_id },
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const result = await prismaClient.resident.findFirstOrThrow({
      where: { pseudonymizedId: personData.pseudonymized_id },
    });
    expect(result.givenNames).toBeNull();
    expect(result.middleNames).toBeNull();
    expect(result.surname).toBeNull();
    expect(result.facilityId).toBeNull();
    expect(result.unitId).toBeNull();
  });

  it("fails when state_specific_data is missing for a state with a schema", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { state_specific_data, ...recordWithoutSSD } = personData;
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [recordWithoutSSD]);

    await expect(
      importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]),
    ).rejects.toThrow();

    expect(await prismaClient.resident.findMany()).toHaveLength(0);
  });

  it("succeeds when state_specific_data is missing for a state with no schema", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { state_specific_data, ...recordWithoutSSD } = personData;
    // ID has no SSD schema as of this writing. if that changes this test should fail
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...recordWithoutSSD, state_code: "US_ID" },
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const result = await prismaClient.resident.findFirstOrThrow();
    expect(result.stateSpecificData).toEqual({});
  });

  it("fails when state_specific_data does not conform to the schema", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      {
        ...personData,
        state_specific_data: JSON.stringify({
          state_code: "US_NC",
          rna_due_date: "not-a-date",
        }),
      },
    ]);

    await expect(
      importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]),
    ).rejects.toThrow();

    expect(await prismaClient.resident.findMany()).toHaveLength(0);
  });

  it("correctly imports more than BATCH_SIZE residents", async () => {
    const manyPeople = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => ({
      ...personData,
      pseudonymized_id: `${personData.pseudonymized_id}${i}`,
      person_id: i,
    }));

    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, manyPeople);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    const result = await prismaClient.resident.findMany();
    expect(result).toHaveLength(manyPeople.length);
  });
});
