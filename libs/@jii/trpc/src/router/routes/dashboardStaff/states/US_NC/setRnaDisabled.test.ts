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
import { textAnswers } from "../../../../../test/US_NC/fixtures/rna";
import { caller } from "../../../../../test/US_NC/mockStaffProcedure";

const testResidentId = "abc123";
const testDate = new Date(2025, 4, 7);

it("sets the given RNA to disabled", async () => {
  tk.freeze(testDate);

  const rna = await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {
        ...textAnswers,
      },
      createdAt: testDate,
      enabledAt: testDate,
    },
  });

  await caller.setRNADisabled({
    id: rna.id,
  });

  const rnaResult = await testPrismaClient.usNcRNA.findFirst({
    select: { enabledAt: true, answers: true },
    where: {
      pseudonymizedId: testResidentId,
    },
  });

  expect(rnaResult?.enabledAt).toBeNull();
  // the rest of the RNA shouldn't be touched
  expect(rnaResult?.answers).not.toBeEmptyObject();
});
