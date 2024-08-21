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

import { Prisma, PrismaClient } from "@prisma/client";
import { captureException } from "@sentry/node";

import { PRISMA_CASE_GET_ARGS } from "~sentencing-server/trpc/routes/case/constants";

type CaseData = Prisma.CaseGetPayload<typeof PRISMA_CASE_GET_ARGS>;

export async function getInsightForCase(
  caseData: CaseData,
  prisma: PrismaClient,
) {
  if (!caseData.Client || !caseData.lsirScore || !caseData.offense) {
    // Log this, but it might not necessarily be an error
    console.log(
      `Unable to retrieve insight for case with id ${caseData.id}. Some necessary data is missing: ${JSON.stringify(caseData)}.`,
    );
    return undefined;
  }

  const { id } = caseData;

  const insights = await prisma.insight.findMany({
    where: {
      // Check that the LSIR score is larger than the start of the bucket, where the start of the bucket is not -1
      assessmentScoreBucketStart: {
        lte: caseData.lsirScore,
      },
      NOT: {
        assessmentScoreBucketStart: {
          equals: -1,
        },
      },
      // Check that the LSIR score is smaller than the end of the bucket or that the end of the bucket is -1 (which means that there is no end)
      OR: [
        {
          assessmentScoreBucketEnd: {
            gte: caseData.lsirScore,
          },
        },
        {
          assessmentScoreBucketEnd: {
            equals: -1,
          },
        },
      ],
      offense: {
        name: caseData.offense.name,
      },
      gender: caseData.Client.gender,
    },
    include: {
      offense: {
        select: {
          name: true,
        },
      },
      rollupOffense: {
        select: {
          name: true,
        },
      },
      rollupRecidivismSeries: {
        select: {
          recommendationType: true,
          dataPoints: {
            omit: {
              id: true,
              recidivismSeriesId: true,
            },
          },
        },
      },
      dispositionData: {
        omit: {
          id: true,
          insightId: true,
        },
      },
    },
    omit: {
      id: true,
      offenseId: true,
      rollupOffenseId: true,
    },
  });

  if (!insights.length) {
    throw new Error(
      `No corresponding insight found for provided case with id ${id}.`,
    );
  }

  if (insights.length > 1) {
    captureException(
      `Multiple insights found for case with id ${id}: ${JSON.stringify(insights)}. Returning first one.`,
    );
  }

  const insightToReturn = insights[0];

  return {
    ...insightToReturn,
    // Move offenses names to top level
    offense: insightToReturn.offense.name,
    rollupOffense: insightToReturn.rollupOffense?.name,
  };
}
