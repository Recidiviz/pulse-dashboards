// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { StateCode } from "@prisma/sentencing-server/client";

import { COUNTIES_AND_DISTRICTS_FILES_NAME } from "~@sentencing-server/import/constants";
import { getImportHandler } from "~@sentencing-server/import/handler";
import { testPrismaClient } from "~@sentencing-server/import/test/setup";
import {
  TEST_COUNTIES_AND_DISTRICTS_FILES_NAME,
  TEST_STATE_CODE,
} from "~@sentencing-server/import/test/setup/constants";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("import county and district data", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  test("should import new counties and districts and delete old ones", async () => {
    dataProviderSingleton.setData(TEST_COUNTIES_AND_DISTRICTS_FILES_NAME, [
      // New county + district data
      {
        state_code: StateCode.US_ID,
        county: "Plout",
        district: "District 2",
      },
    ]);

    await importHandler.import(TEST_STATE_CODE, [
      COUNTIES_AND_DISTRICTS_FILES_NAME,
    ]);

    const dbDistricts = await testPrismaClient.district.findMany({
      include: {
        counties: true,
      },
    });
    // Only the new district and county should be in here
    expect(dbDistricts).toEqual([
      expect.objectContaining({
        name: "District 2",
        counties: expect.arrayContaining([
          expect.objectContaining({
            name: "Plout",
          }),
        ]),
      }),
    ]);
  });
});
