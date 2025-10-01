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

import { beforeAll, describe, expect, test } from "vitest";

import { CONTACT_FILE_NAME } from "~@jii-texting/import/constants";
import { getImportHandler } from "~@jii-texting/import/handler";
import { testUsTxPrismaClient } from "~@jii-texting/import/test/setup";
import { TEST_CONTACT_FILE_NAME } from "~@jii-texting/import/test/setup/constants";
import {
  fakeContactOne,
  fakeContactThree,
  fakeContactTwo,
} from "~@jii-texting/utils/test/constants";
import { dataProviderSingleton } from "~data-import-plugin/testkit";

let importHandler: ReturnType<typeof getImportHandler>;

describe("handle_import", () => {
  beforeAll(async () => {
    importHandler = getImportHandler();
  });

  describe("import contact data", () => {
    test("should upsert existing contacts and add new contacts", async () => {
      dataProviderSingleton.setData(TEST_CONTACT_FILE_NAME, [
        // Update existing contact for fakeUsTxPersonOne
        {
          state_code: "US_TX",
          person_id: "person_id_1",
          stable_person_external_id: "person-ext-id-1",
          contact_external_id: fakeContactOne.externalId,
          contacting_officer_id: fakeContactOne.contactingOfficerId,
          contacting_po_name: fakeContactOne.contactingPoName,
          contact_location_type: "OFFICE", // Changed from HOME to OFFICE
          contact_method: fakeContactOne.method,
          reminder_type: fakeContactOne.reminderType,
          contact_address: fakeContactOne.address,
          contact_datetime: fakeContactOne.datetime.toISOString(),
          update_datetime: fakeContactOne.updateDatetime?.toISOString(),
        },
        // New contact for fakeUsTxPersonTwo
        {
          state_code: "US_TX",
          person_id: "person_id_2",
          stable_person_external_id: "person-ext-id-2",
          contact_external_id: fakeContactTwo.externalId,
          contacting_officer_id: fakeContactTwo.contactingOfficerId,
          contacting_po_name: fakeContactTwo.contactingPoName,
          contact_location_type: fakeContactTwo.locationType,
          contact_method: fakeContactTwo.method,
          reminder_type: fakeContactTwo.reminderType,
          contact_address: fakeContactTwo.address,
          contact_datetime: fakeContactTwo.datetime.toISOString(),
          update_datetime: fakeContactTwo.updateDatetime?.toISOString(),
        },
      ]);

      await importHandler.import("US_TX", [CONTACT_FILE_NAME]);

      const dbContacts = await testUsTxPrismaClient.contact.findMany();

      // Check that the existing contact was updated and new contact was created
      expect(dbContacts).toEqual([
        expect.objectContaining({
          externalId: fakeContactOne.externalId,
          locationType: "OFFICE",
        }),
        expect.objectContaining({
          externalId: fakeContactTwo.externalId,
          locationType: fakeContactTwo.locationType,
        }),
      ]);
    });

    test("no longer eligible contact should have reminderType set to null", async () => {
      dataProviderSingleton.setData(TEST_CONTACT_FILE_NAME, [
        //  New contact for fakeUsTxPersonThree, existing contact for fakeUsTxPersonOne not included
        {
          state_code: "US_TX",
          person_id: "person_id_3",
          stable_person_external_id: "person-ext-id-3",
          contact_external_id: fakeContactThree.externalId,
          contacting_officer_id: fakeContactThree.contactingOfficerId,
          contacting_po_name: fakeContactThree.contactingPoName,
          contact_location_type: fakeContactThree.locationType,
          contact_method: fakeContactThree.method,
          reminder_type: fakeContactThree.reminderType,
          contact_address: fakeContactThree.address,
          contact_datetime: fakeContactThree.datetime.toISOString(),
          update_datetime: fakeContactThree.updateDatetime?.toISOString(),
        },
      ]);

      await importHandler.import("US_TX", [CONTACT_FILE_NAME]);

      const dbContacts = await testUsTxPrismaClient.contact.findMany({
        select: {
          externalId: true,
          reminderType: true,
        },
      });

      // Check that the new contact was created and old contact reminderType was set to null
      expect(dbContacts).toEqual([
        expect.objectContaining({
          externalId: fakeContactThree.externalId,
          reminderType: fakeContactThree.reminderType,
        }),
        expect.objectContaining({
          externalId: fakeContactOne.externalId,
          reminderType: null, // Set to null because it was not in the import data
        }),
      ]);
    });

    test("should update contact datetime and update_datetime fields", async () => {
      // Update with new datetime values
      const newUpdateDateTime = "2025-01-21T15:35:00Z";

      dataProviderSingleton.setData(TEST_CONTACT_FILE_NAME, [
        {
          state_code: "US_TX",
          person_id: "person_id_1",
          stable_person_external_id: "person-ext-id-1",
          contact_external_id: fakeContactOne.externalId,
          contacting_officer_id: fakeContactOne.contactingOfficerId,
          contacting_po_name: fakeContactOne.contactingPoName,
          contact_location_type: fakeContactOne.locationType,
          contact_method: fakeContactOne.method,
          reminder_type: fakeContactOne.reminderType,
          contact_address: fakeContactOne.address,
          contact_datetime: fakeContactOne.datetime.toISOString(),
          update_datetime: newUpdateDateTime, //updated updateDatetime
        },
      ]);

      await importHandler.import("US_TX", [CONTACT_FILE_NAME]);

      const dbContacts = await testUsTxPrismaClient.contact.findMany({
        where: { externalId: fakeContactOne.externalId },
        select: {
          externalId: true,
          updateDatetime: true,
        },
      });

      // Check that datetime fields were updated
      expect(dbContacts).toEqual([
        expect.objectContaining({
          externalId: fakeContactOne.externalId,
          updateDatetime: new Date(newUpdateDateTime),
        }),
      ]);
    });
  });
});
