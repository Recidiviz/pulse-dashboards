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

import { PrismaClient } from "@prisma/jii-texting/client";
import z from "zod";

import { contactImportSchema } from "~@jii-texting/import/models";

export async function transformAndLoadContactData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof contactImportSchema>>,
) {
  // Identify existing contactIds
  const existingContactIds = (await prismaClient.contact.findMany()).map(
    (c) => c.externalId,
  );
  const processedContactIds: string[] = [];

  // Load new contact data
  for await (const contactData of data) {
    try {
      const newContact = {
        externalId: contactData.contact_external_id,
        contactingOfficerId: contactData.contacting_officer_id,
        contactingPoName: contactData.contacting_po_name,
        locationType: contactData.contact_location_type,
        method: contactData.contact_method,
        address: contactData.contact_address,
        datetime: new Date(contactData.contact_datetime),
        updateDatetime: new Date(contactData.update_datetime),
        reminderType: contactData.reminder_type,
      };

      // Load data
      await prismaClient.contact.upsert({
        where: {
          externalId: contactData.contact_external_id,
        },
        update: {
          ...newContact,
          personStableExternalId: contactData.stable_person_external_id,
        },
        create: {
          ...newContact,
          personStableExternalId: contactData.stable_person_external_id,
        },
      });
      processedContactIds.push(newContact.externalId);
    } catch (error) {
      console.error("Failed to process contact record:", {
        contactId: contactData.contact_external_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  // If existing externalId is not in the set of processed contactIds, set reminderType to NULL
  const noLongerEligibleContactIds = existingContactIds.filter(
    (existingContactId: string) =>
      !processedContactIds.includes(existingContactId),
  );

  for await (const noLongerEligibleContactId of noLongerEligibleContactIds) {
    await prismaClient.contact.update({
      where: {
        externalId: noLongerEligibleContactId,
      },
      data: {
        reminderType: null,
      },
    });
  }
}
