// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Prisma, PrismaClient } from "~@sentencing/prisma/client";
import { PRISMA_CASE_GET_ARGS } from "~@sentencing/trpc/routes/case/constants";
import { getInsight } from "~@sentencing/trpc/routes/common/utils";

type CaseData = Prisma.CaseGetPayload<typeof PRISMA_CASE_GET_ARGS>;

export async function getInsightForCase(
  caseData: CaseData,
  prisma: PrismaClient,
) {
  if (!caseData.client || !caseData.lsirScore || !caseData.offense) {
    // Log this, but it might not necessarily be an error
    console.log(
      `Unable to retrieve insight for case with id ${caseData.id}. Some necessary data is missing: ${JSON.stringify(caseData)}.`,
    );
    return undefined;
  }

  return await getInsight(
    caseData.offense.name,
    caseData.client.gender,
    caseData.lsirScore,
    caseData.isCurrentOffenseSexual,
    caseData.isCurrentOffenseViolent,
    prisma,
  );
}
