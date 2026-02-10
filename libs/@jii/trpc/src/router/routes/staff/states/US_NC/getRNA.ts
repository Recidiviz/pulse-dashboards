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

import { TRPCError } from "@trpc/server";

import {
  getRNAInputSchema,
  getRNAQueryResolver,
} from "../../../../../helpers/US_NC/rna";
import { getStatusOfExistingRNA } from "./rnaStatus";
import { stateStaffProcedure } from "./stateStaffProcedure";

export const getRNA = stateStaffProcedure
  .input(getRNAInputSchema)
  .query(async (queryArgs) => {
    const rnaData = await getRNAQueryResolver(queryArgs);

    if (!rnaData)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No assessment data could be found for this resident (ID: ${queryArgs.input.pseudonymizedId})`,
      });

    const { textAnswers, checkboxAnswers, lifeAreaAnswers } = rnaData;

    return {
      textAnswers,
      checkboxAnswers,
      lifeAreaAnswers,
      status: getStatusOfExistingRNA(rnaData),
    };
  });
