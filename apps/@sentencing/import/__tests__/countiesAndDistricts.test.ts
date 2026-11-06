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

import { COUNTIES_AND_DISTRICTS_FILES_NAME } from "~@sentencing/import/constants";
import { testPrismaClient } from "~@sentencing/import/test/setup";
import { importFile } from "~@sentencing/import/test/setup/utils";
import { StateCode } from "~@sentencing/prisma/client";

describe("import county and district data", () => {
  test("should import new counties and districts and delete old ones", async () => {
    await importFile(COUNTIES_AND_DISTRICTS_FILES_NAME, [
      // New county + district data
      {
        state_code: StateCode.US_ID,
        county: "Plout",
        district: "District 2",
      },
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
