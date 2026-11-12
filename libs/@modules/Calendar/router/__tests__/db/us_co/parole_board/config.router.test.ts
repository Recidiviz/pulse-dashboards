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

import { testPrismaClient } from "../../../setup";
import { OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import { seedCalendarConfig } from "../../../setup/seedCalendarConfig";
import { coEditor } from "../../../setup/users";
import {
  initUsCoClient,
  paroleBoardCalendarId,
  US_CO_TEST_CONFIG,
} from "../../../us_co/parole_board/setup";

describe("Calendar.usCo.paroleBoard.admin.config.get", () => {
  let calendarId: string;

  beforeEach(async () => {
    calendarId = await paroleBoardCalendarId();
  });

  it("returns Colorado's settings from its code, without the editor route", async () => {
    const client = await initUsCoClient(coEditor);

    const config =
      await client.Calendar.usCo.paroleBoard.admin.config.get.query();

    expect(config.calendar).toEqual({
      code: "PAROLE_BOARD_PUBLIC",
      name: "Colorado Parole Board hearing calendar",
      timezone: "America/Denver",
      weekStartsOn: "MONDAY",
      allowedWeekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      weekNumbering: "NTH_WEEKDAY_IN_MONTH",
      holidayRegion: "US-CO",
      holidayPolicy: "WARN",
    });
  });

  it("returns Colorado's entry types with their behaviour, in sortOrder", async () => {
    const seeded = await seedCalendarConfig(
      testPrismaClient,
      calendarId,
      US_CO_TEST_CONFIG,
    );
    const client = await initUsCoClient(coEditor);

    const config =
      await client.Calendar.usCo.paroleBoard.admin.config.get.query();

    expect(config.kinds).toEqual([
      {
        id: seeded.kinds["HEARING"].id,
        code: "HEARING",
        label: "Hearing",
        requiresResource: true,
        cancellable: false,
        deletable: true,
        isPublic: true,
        countsTowardTotal: true,
        sortOrder: 1,
      },
      {
        id: seeded.kinds["FULL_BOARD"].id,
        code: "FULL_BOARD",
        label: "Full Board",
        requiresResource: false,
        cancellable: true,
        deletable: true,
        isPublic: true,
        countsTowardTotal: false,
        sortOrder: 2,
      },
      {
        id: seeded.kinds["BUSINESS_MEETING"].id,
        code: "BUSINESS_MEETING",
        label: "Business Mtg",
        requiresResource: false,
        cancellable: true,
        deletable: false,
        isPublic: true,
        countsTowardTotal: false,
        sortOrder: 3,
      },
    ]);
  });

  it("returns resource types and active resources with their full names, in sortOrder", async () => {
    const seeded = await seedCalendarConfig(testPrismaClient, calendarId, {
      ...US_CO_TEST_CONFIG,
      resourceTypes: [
        { code: "ROOM", label: "Room", sortOrder: 2 },
        { code: "SITE", label: "Site", sortOrder: 1 },
      ],
      resources: [
        {
          code: "SITE_C",
          typeCode: "SITE",
          label: "Site C",
          name: "Site C full name",
          sortOrder: 30,
          isActive: true,
        },
        {
          code: "ROOM_1",
          typeCode: "ROOM",
          label: "Room 1",
          name: null,
          sortOrder: 5,
          isActive: true,
        },
        {
          code: "SITE_OLD",
          typeCode: "SITE",
          label: "Old site",
          name: null,
          sortOrder: 1,
          isActive: false,
        },
      ],
      patterns: [],
    });
    const client = await initUsCoClient(coEditor);

    const config =
      await client.Calendar.usCo.paroleBoard.admin.config.get.query();

    expect(config.resourceTypes).toEqual([
      { code: "SITE", label: "Site", sortOrder: 1 },
      { code: "ROOM", label: "Room", sortOrder: 2 },
    ]);
    expect(config.resources).toEqual([
      {
        id: seeded.resources["ROOM_1"].id,
        code: "ROOM_1",
        name: null,
        label: "Room 1",
        typeCode: "ROOM",
        sortOrder: 5,
      },
      {
        id: seeded.resources["SITE_C"].id,
        code: "SITE_C",
        name: "Site C full name",
        label: "Site C",
        typeCode: "SITE",
        sortOrder: 30,
      },
    ]);
  });

  it("leaves out another calendar's rows", async () => {
    await seedCalendarConfig(
      testPrismaClient,
      await paroleBoardCalendarId(OTHER_CALENDAR_CODE),
      US_CO_TEST_CONFIG,
    );
    const client = await initUsCoClient(coEditor);

    const config =
      await client.Calendar.usCo.paroleBoard.admin.config.get.query();

    expect(config).toMatchObject({
      kinds: [],
      resourceTypes: [],
      resources: [],
    });
  });
});
