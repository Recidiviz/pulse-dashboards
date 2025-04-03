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

import { StateCode } from "@prisma/jii-texting-server/client";
import { beforeAll, describe, expect, test } from "vitest";

import { PERSON_FILE_NAME } from "~@jii-texting/import/constants";
import { getImportHandler } from "~@jii-texting/import/handler";
import { testPrismaClient } from "~@jii-texting/import/test/setup";
import {
  TEST_PERSON_FILE_NAME,
  TEST_STATE_CODE,
} from "~@jii-texting/import/test/setup/constants";
import {
  fakeFullyEligibleGroup,
  fakePersonOne,
} from "~@jii-texting-server/utils/test/constants";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("handle_import", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  describe("import people data", () => {
    test("should upsert existing people and add new people", async () => {
      // Set up test so that existing person has opt out date and no group
      await testPrismaClient.person.update({
        where: { personId: fakePersonOne.personId },
        data: {
          lastOptOutDate: new Date("2025-01-01"),
          groups: { set: [] },
        },
      });

      dataProviderSingleton.setData(TEST_PERSON_FILE_NAME, [
        // Existing person
        {
          external_id: fakePersonOne.externalId,
          pseudonymized_id: fakePersonOne.pseudonymizedId,
          person_id: fakePersonOne.personId,
          state_code: StateCode.US_ID,
          person_name: JSON.stringify({
            given_names: fakePersonOne.givenName,
            middle_names: fakePersonOne.middleName,
            surname: fakePersonOne.surname,
            name_suffix: fakePersonOne.nameSuffix,
          }),
          phone_number: fakePersonOne.phoneNumber,
          officer_id: fakePersonOne.officerId,
          po_name: fakePersonOne.poName,
          district: fakePersonOne.district,
          group_id: fakeFullyEligibleGroup.groupName,
        },
        // New person
        {
          external_id: "new-person-ext",
          pseudonymized_id: "new-person-pid",
          person_id: "new-person-pid-1",
          state_code: StateCode.US_ID,
          person_name: JSON.stringify({
            given_names: "TestFirst",
            middle_names: "TestMiddle",
            surname: "TestLast",
            name_suffix: "Sr.",
          }),
          phone_number: "8888888888",
          officer_id: fakePersonOne.officerId,
          po_name: fakePersonOne.poName,
          district: fakePersonOne.district,
          group_id: fakeFullyEligibleGroup.groupName,
        },
      ]);

      await importHandler.import(TEST_STATE_CODE, [PERSON_FILE_NAME]);

      const dbPeople = await testPrismaClient.person.findMany({
        include: { groups: true },
      });

      // Check that the new person was created
      // Check that old person lastOptOutDate has not changed and group was set
      expect(dbPeople).toEqual([
        expect.objectContaining({
          externalId: fakePersonOne.externalId,
          lastOptOutDate: new Date("2025-01-01"),
          groups: expect.arrayContaining([
            expect.objectContaining({
              groupName: fakeFullyEligibleGroup.groupName,
            }),
          ]),
        }),
        expect.objectContaining({ externalId: "new-person-ext" }),
      ]);
    });

    test("no longer eligible person should have empty array of groups", async () => {
      const dbPerson = await testPrismaClient.person.findMany({
        select: {
          externalId: true,
          groups: {
            select: {
              id: false,
              groupName: true,
              messageCopyTemplate: true,
              status: true,
              topicId: false,
            },
          },
        },
      });

      // DB should already be seeded with existing person that has a group
      expect(dbPerson).toEqual([
        expect.objectContaining({
          externalId: fakePersonOne.externalId,
          groups: [
            {
              groupName: fakeFullyEligibleGroup.groupName,
              messageCopyTemplate: "Hi, this is a message.",
              status: "ACTIVE",
            },
          ],
        }),
      ]);

      dataProviderSingleton.setData(TEST_PERSON_FILE_NAME, [
        // New person
        {
          external_id: "new-person-ext",
          pseudonymized_id: "new-person-pid",
          person_id: "new-person-pid-1",
          state_code: StateCode.US_ID,
          person_name: JSON.stringify({
            given_names: "TestFirst",
            middle_names: "TestMiddle",
            surname: "TestLast",
            name_suffix: "Sr.",
          }),
          phone_number: "8888888888",
          officer_id: fakePersonOne.officerId,
          po_name: fakePersonOne.poName,
          district: fakePersonOne.district,
          group_id: fakeFullyEligibleGroup.groupName,
        },
      ]);

      await importHandler.import(TEST_STATE_CODE, [PERSON_FILE_NAME]);

      const dbPeople = await testPrismaClient.person.findMany({
        select: {
          externalId: true,
          groups: {
            select: {
              id: false,
              groupName: true,
              messageCopyTemplate: true,
              status: true,
              topicId: false,
            },
          },
        },
      });

      // Check that the new person was created
      // Check that old person groups are set to undefined
      expect(dbPeople).toEqual([
        expect.objectContaining({
          externalId: fakePersonOne.externalId,
          groups: [],
        }),
        expect.objectContaining({ externalId: "new-person-ext" }),
      ]);
    });
  });
});
