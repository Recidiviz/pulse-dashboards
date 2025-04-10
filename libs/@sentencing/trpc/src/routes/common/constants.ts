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

import { Client, Prisma } from "@prisma/sentencing/client";

export const INSIGHT_INCLUDES_AND_OMITS = {
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
        sentenceLengthBucketStart: true,
        sentenceLengthBucketEnd: true,
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
  } satisfies Prisma.InsightInclude,
  omit: {
    id: true,
    offenseId: true,
    rollupOffenseId: true,
  } satisfies Prisma.InsightOmit,
};

export const GenderToDisplayName: Record<Client["gender"], string> = {
  MALE: "Male",
  FEMALE: "Female",
  NON_BINARY: "Non-binary",
  TRANS: "Transgender",
  TRANS_FEMALE: "Transgender Female",
  TRANS_MALE: "Transgender Male",
  INTERNAL_UNKNOWN: "Unknown",
  EXTERNAL_UNKNOWN: "Unknown",
};
