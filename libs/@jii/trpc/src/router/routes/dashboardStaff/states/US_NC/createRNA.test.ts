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

import tk from "timekeeper";

import { testPrismaClient } from "../../../../../test/prisma";
import {
  checkboxAnswers,
  lifeAreaAnswers,
  textAnswers,
} from "../../../../../test/US_NC/fixtures/rna";
import { caller } from "../../../../../test/US_NC/mockStaffProcedure";

const testResidentId = "abc123";
const testOldAssessmentDate = new Date(2025, 4, 6);
const testDate = new Date(2025, 4, 7);

it("can create a new RNA when the resident didn't have one", async () => {
  tk.freeze(testDate);

  await caller.createRNA({
    pseudonymizedId: testResidentId,
  });

  const rnaResult = await testPrismaClient.usNcRNA.findFirst({
    select: { enabledAt: true, answers: true, updatedAt: true },
    where: {
      pseudonymizedId: testResidentId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  expect(rnaResult?.enabledAt).toEqual(testDate);
  expect(rnaResult?.answers).toBeEmptyObject();
});

it("can create a new RNA when last RNA was stale", async () => {
  tk.freeze(testOldAssessmentDate);

  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {
        ...textAnswers,
        ...lifeAreaAnswers,
        ...checkboxAnswers,
      },
      createdAt: testOldAssessmentDate,
      enabledAt: null,
    },
  });

  tk.freeze(testDate);

  await caller.createRNA({
    pseudonymizedId: testResidentId,
  });

  const rnaResult = await testPrismaClient.usNcRNA.findFirst({
    select: { enabledAt: true, answers: true, updatedAt: true },
    where: {
      pseudonymizedId: testResidentId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  expect(rnaResult?.enabledAt).toEqual(testDate);
  expect(rnaResult?.answers).toBeEmptyObject();
});
