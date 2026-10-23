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

import { z } from "zod";

import { getPrismaClient } from "~@modules/UsTnReclassification/prisma";
import { auth0Procedure, router } from "~@modules-server/trpc-base";

const saveArgs = z.object({
  editor: z.string(),
  residentId: z.string(),
});

export const moduleRouter = router({
  getForm: auth0Procedure.input(String).query(async (opts) => {
    const client = getPrismaClient();

    const res = await client.usTnCafForm.findMany({
      where: { lastModifiedDate: opts.input },
    });

    return res;
  }),

  saveForm: auth0Procedure.input(saveArgs).mutation(async (opts) => {
    const client = getPrismaClient();

    const res = await client.usTnCafForm.create({
      data: {
        stateCode: "US_TN",
        offenderId: opts.input.residentId,
        classificationType: "RCAF",
        classificationFormType: "Annual",
        assessmentDate: new Date(),

        lastModifiedBy: opts.input.editor,
        lastModifiedDate: new Date(),
        lastClassificationDate: new Date("2026-02-11"),

        question1: 1,
        question1_notes: "foo",
        question2: 2,
        question2_notes: "foo",
        question3: 3,
        question3_notes: "foo",
        question4: 4,
        question4_notes: "foo",
        question5: 5,
        question5_notes: "foo",
        question6: 6,
        question6_notes: "foo",
        question7: 7,
        question7_notes: "foo",

        overallScore: 28,
        scoredCustodyLevel: "Medium",
      },
    });

    return res;
  }),
});
