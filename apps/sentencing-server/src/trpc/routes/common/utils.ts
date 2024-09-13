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

import { Gender, PrismaClient } from "@prisma/client";

export async function getInsights(
  offenseName: string,
  gender: Gender,
  lsirScore: number,
  prisma: PrismaClient,
) {
  return await prisma.insight.findMany({
    where: {
      // Check that the LSIR score is larger than the start of the bucket, where the start of the bucket is not -1
      assessmentScoreBucketStart: {
        lte: lsirScore,
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
            gte: lsirScore,
          },
        },
        {
          assessmentScoreBucketEnd: {
            equals: -1,
          },
        },
      ],
      offense: {
        name: offenseName,
      },
      gender: gender,
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
}
