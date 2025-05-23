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

import { personImportSchema } from "~@jii-texting/import/models";

export async function transformAndLoadPersonData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof personImportSchema>>,
) {
  const errors: string[] = [];

  const existingPeopleExternalIds = (await prismaClient.person.findMany()).map(
    (p) => p.externalId,
  );
  const processedExternalIds: string[] = [];

  // Load new people data
  // We do this in a for loop since we are using AsyncGenerator (needs to be iterated over)
  for await (const personData of data) {
    const group = await prismaClient.group.findFirstOrThrow({
      where: { groupName: personData.group_id },
    });

    const newPerson = {
      externalId: personData.external_id,
      pseudonymizedId: personData.pseudonymized_id,
      personId: personData.person_id,
      stateCode: personData.state_code,
      givenName: personData.person_name.given_names,
      middleName: personData.person_name.middle_names,
      surname: personData.person_name.surname,
      nameSuffix: personData.person_name.name_suffix,
      phoneNumber: personData.phone_number,
      officerId: personData.officer_id,
      poName: personData.po_name,
      district: personData.district,
    };

    // Load data
    await prismaClient.person.upsert({
      where: {
        externalId: newPerson.externalId,
      },
      create: {
        ...newPerson,
        groups: { connect: { id: group.id } },
      },
      update: {
        ...newPerson,
        groups: { connect: { id: group.id } },
      },
    });

    processedExternalIds.push(newPerson.externalId);
  }

  // If existing Person not in the set of processed external ids, set Groups to empty array
  const noLongerEligiblePeopleExternalIds = existingPeopleExternalIds.filter(
    (existingPersonExternalId) =>
      !processedExternalIds.includes(existingPersonExternalId),
  );

  for await (const noLongerEligiblePeopleExternalId of noLongerEligiblePeopleExternalIds) {
    await prismaClient.person.update({
      where: {
        externalId: noLongerEligiblePeopleExternalId,
      },
      data: {
        groups: {
          set: [],
        },
      },
    });
  }

  if (errors.length > 0) {
    throw errors.join("\n");
  }
}
