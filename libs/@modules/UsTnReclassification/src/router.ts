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

import { getPrismaClient } from "~@modules-server/prisma";
import { auth0Procedure, router } from "~@modules-server/trpc-base";

const saveArgs = z.object({
  editor: z.string(),
  residentId: z.number(),
});

export const moduleRouter = router({
  reclass: auth0Procedure.query(() => {
    return "Hi from TN";
  }),

  getForm: auth0Procedure.input(String).query(async (opts) => {
    const client = getPrismaClient();

    const res = await client.savedForm.findMany({
      where: { lastEditedBy: opts.input },
    });

    return res;
  }),

  saveForm: auth0Procedure.input(saveArgs).mutation(async (opts) => {
    const client = getPrismaClient();

    const res = await client.savedForm.create({
      data: {
        lastEditedBy: opts.input.editor,
        lastEditedAt: new Date(),
        residentId: opts.input.residentId,
        stateCode: "US_TN",
      },
    });

    return res;
  }),
});
