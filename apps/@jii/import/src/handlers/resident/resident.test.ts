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

import { getPrismaClient } from "~@jii/prisma";
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
const prismaClient = getPrismaClient({ stateCode: STATE_CODE, demo: false });

const personData = {
  pseudonymized_id: "test_pseudo_id",
  person_external_id: "EXT001",
  display_id: "D001",
  state_code: "US_NC",
  person_name: JSON.stringify({
    given_names: "JANE",
    middle_names: "Q",
    surname: "DOE",
  }),
  facility_id: "FAC1",
  unit_id: "UN1",
  officer_id: "OFF1",
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
          "officerId": "OFF1",
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

  const otherPersonData = {
    ...personData,
    pseudonymized_id: "other_pseudo_id",
    person_id: 2,
  };
  const thirdPersonData = {
    ...personData,
    pseudonymized_id: "third_pseudo_id",
    person_id: 3,
  };
  // matches the malformed-SSD case tested below
  const invalidSSD = JSON.stringify({
    state_code: "US_NC",
    rna_due_date: "not-a-date",
  });

  it("keeps a resident whose incoming data fails to parse, while still deleting absent residents", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      personData,
      otherPersonData,
      thirdPersonData,
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...personData, facility_id: "FAC2" },
      { ...otherPersonData, state_specific_data: invalidSSD },
      // third resident is absent from this import
    ]);
    await expect(
      importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]),
    ).rejects.toThrow();

    const updated = await prismaClient.resident.findUniqueOrThrow({
      where: { pseudonymizedId: personData.pseudonymized_id },
    });
    expect(updated.facilityId).toBe("FAC2");
    expect(updated.importedAt).toEqual(new Date("2025-05-20"));

    // preserved, with the data (and timestamp) from the last import that succeeded
    const preserved = await prismaClient.resident.findUniqueOrThrow({
      where: { pseudonymizedId: otherPersonData.pseudonymized_id },
    });
    expect(preserved.facilityId).toBe("FAC1");
    expect(preserved.importedAt).toEqual(new Date("2025-05-19"));

    expect(
      await prismaClient.resident.findUnique({
        where: { pseudonymizedId: thirdPersonData.pseudonymized_id },
      }),
    ).toBeNull();
  });

  it("deletes no residents at all when a failed row has no usable id", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      personData,
      otherPersonData,
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...personData, pseudonymized_id: undefined },
      // second resident is absent, but we can't trust an import we can't fully identify
    ]);
    await expect(
      importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]),
    ).rejects.toThrow();

    expect(await prismaClient.resident.findMany()).toHaveLength(2);
  });

  it("skips a resident with an empty ID instead of failing the whole file", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      personData,
      otherPersonData,
    ]);
    await importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      personData,
      // an empty ID can't be matched to an existing record, so it has to fail validation
      // like any other bad row rather than reaching the loader, which treats it as fatal
      { ...otherPersonData, pseudonymized_id: "" },
    ]);
    await expect(
      importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]),
    ).rejects.toThrow();

    // the valid row still imported, and nothing was pruned, because a row we can't identify
    // means we can't tell a departed resident from an unreadable one
    const updated = await prismaClient.resident.findUniqueOrThrow({
      where: { pseudonymizedId: personData.pseudonymized_id },
    });
    expect(updated.importedAt).toEqual(new Date("2025-05-20"));
    expect(await prismaClient.resident.findMany()).toHaveLength(2);
  });

  it("ignores an unparsable resident who is not already in the database", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      personData,
      { ...otherPersonData, state_specific_data: invalidSSD },
    ]);
    await expect(
      importHandler.import(STATE_CODE, [RESIDENTS_FILE_NAME]),
    ).rejects.toThrow();

    const result = await prismaClient.resident.findMany();
    expect(result).toHaveLength(1);
    expect(result[0].pseudonymizedId).toBe(personData.pseudonymized_id);
  });

  const minimalRecord = {
    pseudonymized_id: "minimal_pseudo_id",
    person_external_id: "EXT_MIN",
    display_id: "D_MIN",
    state_code: "US_NC",
    person_name: JSON.stringify({}),
    state_specific_data: JSON.stringify({ state_code: "US_NC" }),
    // facility_id, unit_id, officer_id omitted — nullish in schema
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
    expect(result.officerId).toBeNull();
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
    expect(result.officerId).toBeNull();
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
