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

import { PrismaClient } from "@prisma/jii-texting-server/client";

import {
  fakeFullyEligibleGroup,
  fakeMissingDA,
  fakeMissingFinesFeesGroup,
  fakeMissingIncomeVerification,
  fakePersonOne,
  fakeTopic,
  fakeTrustedTesterGroup,
  fakeTwoMissingCriteria,
  fakeWorkflowExecutionOne,
  fakeWorkflowExecutionThree,
  fakeWorkflowExecutionTwo,
} from "~@jii-texting-server/utils/test/constants";

export async function seed(prismaClient: PrismaClient) {
  const topic = await prismaClient.topic.create({
    data: {
      ...fakeTopic,
      groups: {
        create: [
          fakeTrustedTesterGroup,
          fakeFullyEligibleGroup,
          fakeMissingDA,
          fakeMissingFinesFeesGroup,
          fakeMissingIncomeVerification,
          fakeTwoMissingCriteria,
        ],
      },
    },
    include: {
      groups: true,
    },
  });

  await prismaClient.workflowExecution.createMany({
    data: [
      fakeWorkflowExecutionOne,
      fakeWorkflowExecutionTwo,
      fakeWorkflowExecutionThree,
    ],
  });

  const fullyEligibleGroup = topic.groups.find(
    (group) => group.groupName === fakeFullyEligibleGroup.groupName,
  );

  // Create a person with an active group and no messages
  await prismaClient.person.create({
    data: {
      ...fakePersonOne,
      groups: {
        connect: {
          id: fullyEligibleGroup?.id,
        },
      },
    },
  });
}
