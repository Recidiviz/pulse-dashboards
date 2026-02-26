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

import { SARImportSchema } from "~@sentencing/import/models";
import {
  AssessmentType,
  DomainRiskLevel,
  PrismaClient,
} from "~@sentencing/prisma/client";

const EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE: Record<
  string,
  AssessmentType
> = {
  ORAS_COMMUNITY_SUPERVISION: AssessmentType.ORAS_CST,
  ORAS_COMMUNITY_SUPERVISION_SCREENING: AssessmentType.Other,
  ORAS_PRISON_INTAKE: AssessmentType.ORAS_PIT,
  ORAS_PRISON_SCREENING: AssessmentType.Other,
  ORAS_REENTRY: AssessmentType.ORAS_RT,
  ORAS_SUPPLEMENTAL_REENTRY: AssessmentType.ORAS_SRT,
};

// Maps ORAS section names (from assessment_metadata) to database field names
// Section names vary slightly across different ORAS assessment types
const ORAS_SECTION_TO_DB_FIELD: Record<string, string> = {
  // Criminal History (same across all types)
  "Criminal History": "criminalHistoryLevel",

  // Criminal Attitudes (varies: "and" vs "&")
  "Criminal Attitudes and Behavioral Patterns": "criminalBehaviorLevel",
  "Criminal Attitudes & Behavioral Patterns": "criminalBehaviorLevel",

  // Education/Employment (varies: "Situations" vs "Situation", "and" vs "&")
  "Education, Employment and Financial Situations": "educationLevelScore",
  "Education, Employment and Financial Situation": "educationLevelScore",
  "Education, Employment & Financial Situation": "educationLevelScore",
  "Education, Employment & Social Support": "educationLevelScore",
  "Education, Employment and Social Support": "educationLevelScore",

  // Family & Social Support (varies: "and" vs "&")
  "Family and Social Support": "familySocialSupportLevel",
  "Family & Social Support": "familySocialSupportLevel",

  // Neighborhood Problems
  "Neighborhood Problems": "neighborhoodLevel",

  // Substance (varies: "Abuse" vs "Use", with/without "Mental Health")
  "Substance Abuse": "substanceAbuseLevel",
  "Substance Use": "substanceAbuseLevel",
  "Substance Abuse and Mental Health": "substanceAbuseLevel",
  "Substance Use and Mental Health": "substanceAbuseLevel",
  "Substance Use & Mental Health": "substanceAbuseLevel",

  // Peer Associations (varies: "Associations" vs "Associates")
  "Peer Associations": "peerAssociatesLevel",
  "Peer Associates": "peerAssociatesLevel",

};

// Maps score field names to their corresponding risk level field names.
// responsivityLevel is intentionally excluded — Responsivity is not numerically
// scored in the source data (it is a case planning checklist, not a risk domain).
const SCORE_FIELD_TO_RISK_LEVEL_FIELD: Record<string, string> = {
  criminalHistoryLevel: "criminalHistoryRiskLevel",
  educationLevelScore: "educationRiskLevel",
  neighborhoodLevel: "neighborhoodRiskLevel",
  substanceAbuseLevel: "substanceAbuseRiskLevel",
  familySocialSupportLevel: "familySocialSupportRiskLevel",
  peerAssociatesLevel: "peerAssociatesRiskLevel",
  criminalBehaviorLevel: "criminalBehaviorRiskLevel",
};

// Maps raw domain_risk_level values (1/2/3) to DomainRiskLevel enum
const RAW_RISK_LEVEL_TO_ENUM: Record<string, DomainRiskLevel> = {
  "1": DomainRiskLevel.LOW,
  "2": DomainRiskLevel.MODERATE,
  "3": DomainRiskLevel.HIGH,
};

export async function transformAndLoadSARData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof SARImportSchema>>,
) {
  // Load new SAR data
  // We do this in a for loop instead of Promise.all to avoid a prisma pool connection error

  const staffExternalIds = new Set(
    (
      await prismaClient.staff.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  const clientExternalIds = new Set(
    (
      await prismaClient.client.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  for await (const sarData of data) {
    // Check if the staff and clients exist in the db
    const staffExists = staffExternalIds.has(sarData.staff_id);
    const clientExists = clientExternalIds.has(sarData.client_id);

    // Client is required for SAR - skip if client doesn't exist yet
    if (!clientExists) {
      console.warn(
        `Skipping SAR ${sarData.external_id}: client ${sarData.client_id} not found`,
      );
      continue;
    }

    // Build the base SAR record
    const assessmentScore = parseInt(sarData.assessment_score ?? "0", 10);
    const newSAR: Record<string, unknown> = {
      externalId: sarData.external_id,
      dueDate: sarData.due_date,
      assessmentScore,
      assessmentType: sarData.report_type
        ? EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE[sarData.report_type]
        : undefined,
    };

    // Map ORAS domain scores and risk levels from assessment_metadata to database fields
    // domain_score comes as a string from BigQuery, parse to int
    for (const domain of sarData.assessment_metadata ?? []) {
      const dbField = ORAS_SECTION_TO_DB_FIELD[domain.domain_name];
      if (dbField && domain.domain_score) {
        const score = parseInt(domain.domain_score, 10);
        if (!isNaN(score)) {
          newSAR[dbField] = score;
        }
      }
      if (dbField && domain.domain_risk_level) {
        // Guard handles any future dbField that lacks a corresponding risk level entry
        const riskLevelField = SCORE_FIELD_TO_RISK_LEVEL_FIELD[dbField];
        const riskLevel = RAW_RISK_LEVEL_TO_ENUM[domain.domain_risk_level];
        if (riskLevelField && riskLevel) {
          newSAR[riskLevelField] = riskLevel;
        }
      }
    }

    // Staff connection (optional for SAR)
    const createStaffConnection = staffExists
      ? { connect: { externalId: sarData.staff_id } }
      : undefined;

    const updateStaffConnection = staffExists
      ? { connect: { externalId: sarData.staff_id } }
      : { disconnect: true };

    // Client connection (required for SAR)
    const clientConnection = { connect: { externalId: sarData.client_id } };

    // Load data
    await prismaClient.sentencingAssessmentReport.upsert({
      where: {
        externalId: sarData.external_id,
      },
      create: {
        ...newSAR,
        staff: createStaffConnection,
        client: clientConnection,
        externalId: sarData.external_id,
      },
      update: {
        ...newSAR,
        staff: updateStaffConnection,
        client: clientConnection,
      },
    });
  }
}
