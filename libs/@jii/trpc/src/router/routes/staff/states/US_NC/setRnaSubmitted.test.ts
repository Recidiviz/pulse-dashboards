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
const testCompletedDate = new Date(2025, 4, 6);
const testDate = new Date(2025, 4, 7);

test("set submitted", async () => {
  tk.freeze(testDate);

  const rna = await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {
        ...textAnswers,
        ...lifeAreaAnswers,
        ...checkboxAnswers,
      },
      completedAt: testCompletedDate,
    },
  });

  const result = await caller.setRNASubmitted({
    id: rna.id,
    isSubmitted: true,
  });
  expect(result).toEqual({
    submittedByStaffAt: testDate,
  });

  expect(
    (
      await testPrismaClient.usNcRNA.findUnique({
        select: { submittedByStaffAt: true },
        where: { id: rna.id },
      })
    )?.submittedByStaffAt,
  ).toEqual(testDate);

  tk.reset();
});

test("clear submitted", async () => {
  const rna = await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {
        ...textAnswers,
        ...lifeAreaAnswers,
        ...checkboxAnswers,
      },
      completedAt: testCompletedDate,
      submittedByStaffAt: testDate,
    },
  });

  const result = await caller.setRNASubmitted({
    id: rna.id,
    isSubmitted: false,
  });
  expect(result).toEqual({
    submittedByStaffAt: null,
  });

  expect(
    (
      await testPrismaClient.usNcRNA.findUnique({
        select: { submittedByStaffAt: true },
        where: { id: rna.id },
      })
    )?.submittedByStaffAt,
  ).toBeNull();
});
