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

import { Prisma } from "~@sentencing/prisma/client";
import { getSARInsight } from "~@sentencing/trpc/routes/common/utils";

type SARInsight = NonNullable<Awaited<ReturnType<typeof getSARInsight>>>;

// The SAR fields needed to look up its insight or read its snapshot.
export const SAR_INSIGHT_SELECT = {
  id: true,
  lockedAt: true,
  assessmentDate: true,
  assessmentRiskLevel: true,
  mostSevereOffenseName: true,
  client: { select: { gender: true } },
  insightSnapshot: {
    include: {
      dispositionData: {
        omit: { id: true, sarInsightSnapshotId: true },
      },
    },
  },
} satisfies Prisma.SentencingAssessmentReportSelect;

type SARWithInsightInputs = Prisma.SentencingAssessmentReportGetPayload<{
  select: typeof SAR_INSIGHT_SELECT;
}>;

/**
 * Returns the insight a snapshot recorded, in the same shape as a live
 * lookup, or undefined if no insight existed when the snapshot was taken.
 */
export function snapshotToInsight(
  snapshot: NonNullable<SARWithInsightInputs["insightSnapshot"]>,
): SARInsight | undefined {
  const { gender, assessmentRiskLevel, dispositionNumRecords, offenseName } =
    snapshot;

  // Every Insight has these fields, so a snapshot missing any of them was
  // taken when no insight existed for this offense.
  if (
    gender === null ||
    assessmentRiskLevel === null ||
    dispositionNumRecords === null ||
    offenseName === null
  ) {
    return undefined;
  }

  return {
    gender,
    assessmentRiskLevel,
    dispositionNumRecords,
    offense: offenseName,
    offenseCategory: snapshot.offenseCategory,
    dispositionData: snapshot.dispositionData,
    avgSentenceLengthYears: snapshot.avgSentenceLengthYears,
    avgPctServed: snapshot.avgPctServed,
    timeServedNumRecords: snapshot.timeServedNumRecords,
  };
}

/**
 * Returns the current Insight for the SAR's offense, gender, and assessment
 * risk level, or undefined if the SAR is missing any of them or no insight
 * matches.
 */
export async function lookUpSARInsight(
  sar: Pick<
    SARWithInsightInputs,
    | "assessmentDate"
    | "assessmentRiskLevel"
    | "mostSevereOffenseName"
    | "client"
  >,
  prisma: Prisma.TransactionClient,
): Promise<SARInsight | undefined> {
  const offenseName = sar.mostSevereOffenseName;
  const riskLevel = sar.assessmentRiskLevel;
  if (!sar.assessmentDate || !offenseName || !riskLevel) return undefined;

  return getSARInsight(offenseName, sar.client.gender, riskLevel, prisma);
}

/**
 * Saves insight as the SAR's snapshot, replacing any earlier snapshot and its
 * dispositions. With no insight, every data field is saved as null, which
 * snapshotToInsight reads as "no insight existed".
 */
export async function saveInsightSnapshot(
  prisma: Prisma.TransactionClient,
  sarId: string,
  insight: SARInsight | undefined,
) {
  const snapshotData = {
    gender: insight?.gender ?? null,
    assessmentRiskLevel: insight?.assessmentRiskLevel ?? null,
    offenseName: insight?.offense ?? null,
    offenseCategory: insight?.offenseCategory ?? null,
    dispositionNumRecords: insight?.dispositionNumRecords ?? null,
    avgSentenceLengthYears: insight?.avgSentenceLengthYears ?? null,
    avgPctServed: insight?.avgPctServed ?? null,
    timeServedNumRecords: insight?.timeServedNumRecords ?? null,
  };
  const dispositions = insight?.dispositionData ?? [];

  await prisma.sARInsightSnapshot.upsert({
    where: { sentencingAssessmentReportId: sarId },
    create: {
      ...snapshotData,
      sentencingAssessmentReport: { connect: { id: sarId } },
      dispositionData: { createMany: { data: dispositions } },
    },
    update: {
      ...snapshotData,
      dispositionData: {
        deleteMany: {},
        createMany: { data: dispositions },
      },
    },
  });
}
