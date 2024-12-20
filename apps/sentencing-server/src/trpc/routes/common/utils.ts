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

import { Gender, Prisma, PrismaClient, StateCode } from "@prisma/client";
import { captureException } from "@sentry/node";
import _ from "lodash";

import { INSIGHT_INCLUDES_AND_OMITS } from "~sentencing-server/trpc/routes/common/constants";

type Insight = Prisma.InsightGetPayload<typeof INSIGHT_INCLUDES_AND_OMITS>;

function formatInsightCombinedOffenseCategory(
  rollupCombinedOffenseCategory: string,
) {
  // Non-* everything
  if (
    rollupCombinedOffenseCategory.includes("Non-violent") &&
    rollupCombinedOffenseCategory.includes("Non-drug") &&
    rollupCombinedOffenseCategory.includes("Non-sex")
  ) {
    return "Nonviolent offenses, not sex- or drug-related";
  }

  // Violent + anything else
  if (rollupCombinedOffenseCategory.includes("Violent")) {
    if (rollupCombinedOffenseCategory.includes("Drug")) {
      if (rollupCombinedOffenseCategory.includes("Sex")) {
        return "Violent, drug-related sex offenses";
      }

      return "Violent drug offenses";
    }

    if (rollupCombinedOffenseCategory.includes("Sex")) {
      return "Violent sex offenses";
    }

    return "Violent offenses, not sex- or drug-related";
  }

  // Remaining Drug + others
  if (rollupCombinedOffenseCategory.includes("Drug")) {
    if (rollupCombinedOffenseCategory.includes("Sex")) {
      return "Drug-related nonviolent sex offenses";
    }

    return "Nonviolent drug offenses";
  }

  // Last possible is just Sex
  if (rollupCombinedOffenseCategory.includes("Sex")) {
    return "Nonviolent sex offenses";
  }

  // We should never reach this point
  captureException(
    `Unexpected combined offense category: ${rollupCombinedOffenseCategory}! Unable to format string, so just returning the value`,
  );
  return rollupCombinedOffenseCategory;
}

function formatStateCode(stateCode: StateCode) {
  switch (stateCode) {
    case StateCode.US_ID:
      return "Idaho";
    case StateCode.US_ND:
      return "North Dakota";
  }

  return stateCode;
}

function formatRollupOffenseDescription(insight: Insight) {
  const {
    rollupOffense,
    rollupNcicCategory,
    rollupCombinedOffenseCategory,
    rollupViolentOffense,
    rollupStateCode,
  } = insight;

  if (rollupOffense) {
    // Levels 1 + 2
    return `${rollupOffense.name} offenses`;
  } else if (rollupNcicCategory) {
    // Levels 3 + 4
    // If it doesn't have offense in the name, add it
    if (!rollupNcicCategory.toLowerCase().includes("offense")) {
      return `${rollupNcicCategory} offenses`;
    }

    return `${rollupNcicCategory}`;
  } else if (rollupCombinedOffenseCategory) {
    // Level 5
    return formatInsightCombinedOffenseCategory(rollupCombinedOffenseCategory);
  } else if (rollupViolentOffense !== null) {
    // Level 6
    return rollupViolentOffense ? "Violent offenses" : "Nonviolent offenses";
  }

  return `All offenses in ${formatStateCode(rollupStateCode)}`;
}

async function getInsightsWithReverseLookup(
  offenseName: string,
  gender: Gender,
  lsirScore: number,
  isSexOffenseOverride: boolean | null,
  isViolentOffenseOverride: boolean | null,
  prisma: PrismaClient,
) {
  const insights = await prisma.insight.findMany({
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
    ...INSIGHT_INCLUDES_AND_OMITS,
  });

  // If there are no insights or we don't have to worry about sex/violent offense overrides, return the original insights
  if (
    (isSexOffenseOverride == null && isViolentOffenseOverride == null) ||
    !insights.length
  ) {
    return insights;
  }

  // Just use the first insight for this logic
  const originalInsight = insights[0];

  // If we're not dealing with a level 5 (combined offense category) or level 6 (violent offense) rollup, return the original insights
  if (
    originalInsight.rollupCombinedOffenseCategory == null &&
    originalInsight.rollupViolentOffense == null
  ) {
    return insights;
  }

  let newInsight = null;

  // level 5 rollup (combined offense category)
  if (originalInsight.rollupCombinedOffenseCategory !== null) {
    const originalRollupIncludesSex =
      originalInsight.rollupCombinedOffenseCategory.includes("Sex");
    const originalRollupIncludesViolent =
      originalInsight.rollupCombinedOffenseCategory.includes("Violent");

    // Check to see if the overrides match the insight's rollup combined offense category - if they are not set or they do match, return the original insights
    if (
      (isSexOffenseOverride == null ||
        isSexOffenseOverride === originalRollupIncludesSex) &&
      (isViolentOffenseOverride == null ||
        isViolentOffenseOverride === originalRollupIncludesViolent)
    ) {
      return insights;
    }

    // If the insight's rollup combined offense category contradicts the overrides, perform a new lookup
    const isSexOffense =
      isSexOffenseOverride == null
        ? originalRollupIncludesSex
        : isSexOffenseOverride;
    const isViolentOffense =
      isViolentOffenseOverride == null
        ? originalRollupIncludesViolent
        : isViolentOffenseOverride;
    const isDrugOffense =
      originalInsight.rollupCombinedOffenseCategory.includes("Drug");

    // 1. If everything is false, then use the Non-* search term
    // 2. If everything is true, then use the !Non-* + everything true search term
    // 3. Otherwise use the individualized search term
    // This is because the search is non case sensitive, so we can't just use the ! operator
    let searchTerm;
    if (!isSexOffense && !isViolentOffense && !isDrugOffense) {
      searchTerm = "Non-sex & Non-violent & Non-drug";
    } else if (isSexOffense && isViolentOffense && isDrugOffense) {
      searchTerm = "!Non-sex & Sex & !Non-violent & Violent & !Non-drug & Drug";
    } else {
      searchTerm = `${isSexOffense ? "" : "!"}Sex & ${isViolentOffense ? "" : "!"}Violent & ${isDrugOffense ? "" : "!"}Drug`;
    }

    // We just need the first insight
    newInsight = await prisma.insight.findFirst({
      where: {
        AND: [
          {
            rollupCombinedOffenseCategory: {
              search: searchTerm,
            },
          },
          {
            rollupCombinedOffenseCategory: {
              not: null,
            },
          },
        ],
      },
      ...INSIGHT_INCLUDES_AND_OMITS,
    });
  }

  // Level 6 rollup (violent offense), or unable to find a suitable level 5 rollup
  if (originalInsight.rollupViolentOffense != null || !newInsight) {
    // If we aren't looking at a level 5 rollup, and there isn't a violence categorization override/the insight's rollup violent categorization matches the violent offense override, return the original insights
    if (
      originalInsight.rollupCombinedOffenseCategory == null &&
      (isViolentOffenseOverride == null ||
        originalInsight.rollupViolentOffense === isViolentOffenseOverride)
    ) {
      return insights;
    }

    // Otherwise, perform a new lookup based on the level 6 rollup
    newInsight = await prisma.insight.findFirst({
      where: {
        AND: [
          {
            rollupViolentOffense: isViolentOffenseOverride,
          },
          {
            rollupViolentOffense: {
              not: null,
            },
          },
        ],
      },
      ...INSIGHT_INCLUDES_AND_OMITS,
    });
  }

  // Nothing found so far, get a level 7 rollup
  if (!newInsight) {
    // Level 7 rollup means that every other rollup field is null
    newInsight = await prisma.insight.findFirst({
      where: {
        AND: {
          rollupGender: null,
          rollupAssessmentScoreBucketStart: null,
          rollupAssessmentScoreBucketEnd: null,
          rollupOffense: null,
          rollupNcicCategory: null,
          rollupCombinedOffenseCategory: null,
          rollupViolentOffense: null,
        },
      },
      ...INSIGHT_INCLUDES_AND_OMITS,
    });
  }

  // The offense name, gender, lsir scores, and disposition data should be set to be the same as the original insight, only the recidivism series + the combined offense category should change
  if (newInsight) {
    newInsight.offense = originalInsight.offense;
    newInsight.gender = originalInsight.gender;
    newInsight.assessmentScoreBucketStart =
      originalInsight.assessmentScoreBucketStart;
    newInsight.assessmentScoreBucketEnd =
      originalInsight.assessmentScoreBucketEnd;
    newInsight.dispositionNumRecords = originalInsight.dispositionNumRecords;
    newInsight.dispositionData = originalInsight.dispositionData;
  }

  // Return the insight we have found, otherwise there are no insights to be found
  return newInsight ? [newInsight] : [];
}

export async function getInsight(
  offenseName: string,
  gender: Gender,
  lsirScore: number,
  isSexOffenseOverride: boolean | null,
  isViolentOffenseOverride: boolean | null,
  prisma: PrismaClient,
) {
  const insights = await getInsightsWithReverseLookup(
    offenseName,
    gender,
    lsirScore,
    isSexOffenseOverride,
    isViolentOffenseOverride,
    prisma,
  );

  if (!insights.length) {
    captureException(
      `No insights found for attributes offense name of ${offenseName}, gender of ${gender}, LSI-R Score of ${lsirScore}, sex offense override of ${isSexOffenseOverride}, violent offense override of ${isViolentOffenseOverride}`,
    );

    return undefined;
  }

  if (insights.length > 1) {
    captureException(
      `Multiple insights found for attributes offense name of ${offenseName}, gender of ${gender}, LSI-R Score of ${lsirScore}, sex offense override of ${isSexOffenseOverride}, violent offense override of ${isViolentOffenseOverride}: ${JSON.stringify(insights)}. Returning the first one.`,
    );
  }

  const insightToReturn = insights[0];

  return {
    ..._.pick(insightToReturn, [
      "gender",
      "assessmentScoreBucketStart",
      "assessmentScoreBucketEnd",
      "rollupGender",
      "rollupAssessmentScoreBucketStart",
      "rollupAssessmentScoreBucketEnd",
      "dispositionData",
      "dispositionNumRecords",
      "rollupRecidivismSeries",
      "rollupRecidivismNumRecords",
    ]),
    offense: insightToReturn.offense.name,
    rollupOffense: insightToReturn.rollupOffense?.name,
    rollupOffenseDescription: formatRollupOffenseDescription(insightToReturn),
  };
}
