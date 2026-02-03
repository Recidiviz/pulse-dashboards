// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import type { Prisma } from "~@sentencing/prisma/client";
import { SARMetadataSchema } from "~@sentencing/trpc/routes/sar/sar.schema";

export type SARMetadata = z.infer<typeof SARMetadataSchema>;

export type GetSARInput = Pick<
  Prisma.SentencingAssessmentReportWhereUniqueInput,
  "id"
>;

export type UpsertSARInput = Pick<
  Prisma.SentencingAssessmentReportUpdateInput,
  | "status"
  | "address"
  | "defendantDeclinedToParticipate"
  | "needsToBeAddressed"
  | "otherNeedToBeAddressed"
  | "mitigatingFactors"
  | "otherMitigatingFactor"
  | "levelOfEducation"
  | "defendantStatement"
  | "victimImpactStatement"
  | "criminalHistorySummary"
  | "employedAtOffense"
  | "employmentSummary"
  | "familyAndSocialSupportSummary"
  | "homePlan"
  | "housingSummary"
  | "drugHistorySummary"
  | "peerAssociatesSummary"
  | "criminalAttitudesSummary"
  | "responsivityAndBarriersSummary"
  | "communityStrategyRecommendation"
  | "institutionalStrategyRecommendation"
> & {
  ssn?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
  guardianName?: string | null;
  metadata?: Prisma.InputJsonValue;
  charges?: {
    id: string;
    prosecutingAttorney?: string | null;
    defenseAttorney?: string | null;
    pleaAgreement?: Prisma.ChargeUpdateInput["pleaAgreement"];
    pleaDate?: Date | null;
    sentencingDate?: Date | null;
  }[];
};
