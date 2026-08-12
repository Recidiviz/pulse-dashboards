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

import { FACILITY_FILE_NAME } from "../../constants";
import { getImportHandler } from "../../handler";
import { resetDb } from "../../testUtils";
import { BATCH_SIZE } from "./facility";

vi.mock("~data-import-plugin", () => ({
  ImportHandler: MockImportHandler,
}));

const STATE_CODE = "US_NC";
const DATA_PROVIDER_FILE_NAME = `${STATE_CODE}/${FACILITY_FILE_NAME}`;

const importHandler = getImportHandler();
const prismaClient = getPrismaClient({ stateCode: STATE_CODE, demo: false });

const facilityData = {
  id: "FAC1",
  name: "Facility One",
};

describe("facilityHandler", () => {
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

  it("inserts a new facility", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [facilityData]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    const result = await prismaClient.incarcerationFacility.findMany();
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "id": "FAC1",
          "importedAt": 2025-05-19T00:00:00.000Z,
          "name": "Facility One",
        },
      ]
    `);
  });

  it("succeeds when name is missing", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [{ id: "FAC1" }]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    const result = await prismaClient.incarcerationFacility.findFirstOrThrow();
    expect(result.name).toBeNull();
  });

  it("updates an existing facility", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [facilityData]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);
    expect(await prismaClient.incarcerationFacility.findMany()).toHaveLength(1);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...facilityData, name: "Facility One Renamed" },
      { id: "FAC2", name: "Facility Two" },
    ]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    expect(await prismaClient.incarcerationFacility.findMany()).toHaveLength(2);

    const updatedFacility =
      await prismaClient.incarcerationFacility.findUniqueOrThrow({
        where: { id: facilityData.id },
      });
    expect(updatedFacility.name).toBe("Facility One Renamed");
    expect(updatedFacility.importedAt).toEqual(new Date("2025-05-20"));

    const newFacility =
      await prismaClient.incarcerationFacility.findUniqueOrThrow({
        where: { id: "FAC2" },
      });
    expect(newFacility.importedAt).toEqual(new Date("2025-05-20"));
  });

  it("deletes facilities not present in the current import", async () => {
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      facilityData,
      { id: "FAC2", name: "Facility Two" },
    ]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);
    expect(await prismaClient.incarcerationFacility.findMany()).toHaveLength(2);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [facilityData]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    const retained = await prismaClient.incarcerationFacility.findUnique({
      where: { id: facilityData.id },
    });
    expect(retained).not.toBeNull();

    const deleted = await prismaClient.incarcerationFacility.findUnique({
      where: { id: "FAC2" },
    });
    expect(deleted).toBeNull();
  });

  it("creates and updates a facility whose ID contains a single quote", async () => {
    const facilityWithQuote = { id: "FAC'1", name: "Facility O'Brien" };

    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [facilityWithQuote]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    const created = await prismaClient.incarcerationFacility.findUniqueOrThrow({
      where: { id: facilityWithQuote.id },
    });
    expect(created.name).toBe(facilityWithQuote.name);

    vi.setSystemTime(new Date("2025-05-20"));
    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, [
      { ...facilityWithQuote, name: "Facility O'Brien Renamed" },
    ]);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    const updated = await prismaClient.incarcerationFacility.findUniqueOrThrow({
      where: { id: facilityWithQuote.id },
    });
    expect(updated.name).toBe("Facility O'Brien Renamed");
    expect(updated.importedAt).toEqual(new Date("2025-05-20"));
  });

  it("correctly imports more than BATCH_SIZE facilities", async () => {
    const manyFacilities = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => ({
      id: `${facilityData.id}${i}`,
      name: `${facilityData.name} ${i}`,
    }));

    dataProviderSingleton.setData(DATA_PROVIDER_FILE_NAME, manyFacilities);
    await importHandler.import(STATE_CODE, [FACILITY_FILE_NAME]);

    const result = await prismaClient.incarcerationFacility.findMany();
    expect(result).toHaveLength(manyFacilities.length);
  });
});
