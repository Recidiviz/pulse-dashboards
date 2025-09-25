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
    (p) => p.stableExternalId,
  );
  const processedExternalIds: string[] = [];

  // Load new people data
  // We do this in a for loop since we are using AsyncGenerator (needs to be iterated over)
  for await (const personData of data) {
    const incomingGroups = await prismaClient.group.findMany({
      where: {
        groupName: {
          in: personData.group_ids, // finds all groups where groupName is in the array
        },
      },
    });

    // Log if there are any incoming groups are missing
    const foundGroupNames = new Set(incomingGroups.map((g) => g.groupName));
    const missingGroups = personData.group_ids.filter(
      (id) => !foundGroupNames.has(id),
    );
    console.log(`Groups not found: ${missingGroups.join(", ")}`);

    // Find the person if they exist
    const currentGroupsForPerson = await prismaClient.person.findUnique({
      where: { stableExternalId: personData.stable_person_external_id },
      select: {
        groups: { select: { groupName: true, id: true } },
      },
    });
    const incomingGroupIds = incomingGroups.map((g) => g.id);
    const groupsToDisconnect =
      currentGroupsForPerson !== null
        ? currentGroupsForPerson.groups.filter(
            (currentGroup) => !incomingGroupIds.includes(currentGroup.id),
          )
        : [];

    const newPerson = {
      stableExternalId: personData.stable_person_external_id,
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
        stableExternalId: newPerson.stableExternalId,
      },
      create: {
        ...newPerson,
        groups: { connect: incomingGroupIds.map((id) => ({ id })) },
      },
      update: {
        ...newPerson,
        groups: {
          connect: incomingGroupIds.map((id) => ({ id })),
          disconnect: groupsToDisconnect.map((group) => ({ id: group.id })), // Disconnect the groups in the array
        },
      },
    });

    processedExternalIds.push(newPerson.stableExternalId);
  }

  // If existing Person not in the set of processed external ids, set Groups to empty array
  const noLongerEligiblePeopleExternalIds = existingPeopleExternalIds.filter(
    (existingPersonExternalId) =>
      !processedExternalIds.includes(existingPersonExternalId),
  );

  for await (const noLongerEligiblePeopleExternalId of noLongerEligiblePeopleExternalIds) {
    await prismaClient.person.update({
      where: {
        stableExternalId: noLongerEligiblePeopleExternalId,
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
