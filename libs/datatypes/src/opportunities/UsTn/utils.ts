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

import { dateStringSchema } from "../../utils/zod";

const UsTnIncidentSchema = z.object({
  incidentDate: dateStringSchema,
  incidentTypeCode: z.string(),
});

const UsTnIncidentPeriodReportSchema = z.object({
  numIncidents: z.number(),
  incidentTimePeriod: z.string(),
  incidents: z.array(UsTnIncidentSchema),
});
type UsTnIncidentPeriodReport = z.output<typeof UsTnIncidentPeriodReportSchema>;

const UsTnConviction = z.object({
  description: z.string(),
  imposedDate: dateStringSchema,
});

const UsTnProgramCompletionSchema = z.object({
  completionDate: dateStringSchema,
  programCode: z.string(),
  programType: z.string(),
});

type UsTnProgramCompletion = z.output<typeof UsTnProgramCompletionSchema>;

function formatConvictions(
  convictions: z.output<typeof UsTnConviction>[] | null,
): string {
  if (convictions === null) return "";

  return convictions
    .map((c) => `${c.description} on ${c.imposedDate.toLocaleDateString()}`)
    .join("/n");
}
export const q1Notes = z
  .object({
    listPriorNonTdocConvictions60Months: z
      .array(UsTnConviction)
      .nullable()
      .default([])
      .transform(formatConvictions),
    listPriorViolentTdocConvictions60Months: z
      .array(UsTnConviction)
      .nullable()
      .default([])
      .transform(formatConvictions),
  })
  .optional()
  .default({
    listPriorNonTdocConvictions60Months: [],
    listPriorViolentTdocConvictions60Months: [],
  });

export const q2Notes = z
  .array(z.string())
  .optional()
  .transform((notes) => {
    return notes?.join(", ") ?? "";
  });

const formatIncidentReportPeriod = (
  period: UsTnIncidentPeriodReport,
  padding = "",
) => {
  return period.incidents
    .map((i) => {
      return `${padding}${i.incidentTypeCode} on ${i.incidentDate.toLocaleDateString()}`;
    })
    .join(", ");
};

export function formatMultiplePeriodReports(
  periods: UsTnIncidentPeriodReport[],
): string {
  return periods
    .map((p) => {
      const header = `Disciplinaries in last ${p.incidentTimePeriod}:\n`;
      return header + formatIncidentReportPeriod(p, "  ");
    })
    .join("\n");
}

const formatSinglePeriodReport = (
  notes: UsTnIncidentPeriodReport[] | undefined,
) => {
  if (!notes || notes.length === 0) return "";

  return formatIncidentReportPeriod(notes[0]);
};

export const singleIncidentPeriodReportSchema = z
  .array(UsTnIncidentPeriodReportSchema)
  .optional()
  .transform(formatSinglePeriodReport);

export const multiIncidentPeriodReportSchema = z
  .array(UsTnIncidentPeriodReportSchema)
  .optional()
  .default([]);

function formatProgramCompletions(reports: UsTnProgramCompletion[]): string {
  return reports
    .map(
      ({ programCode, programType, completionDate }) =>
        `Completed ${programCode} (${programType}) on ${completionDate.toLocaleDateString()}`,
    )
    .join("\n");
}

export const q7Notes = z
  .array(UsTnProgramCompletionSchema)
  .optional()
  .default([])
  .transform(formatProgramCompletions);

const booleanToString = z.boolean().transform((x) => x.toString());

export const trusteeFormSchema = z.object({
  trusteeHas10YearsOrLessRemaining: booleanToString,
  trusteeNoAssaultiveDisciplinaryWithSeriousInjuryLast5Years: booleanToString,
  trusteeNoEscapeFromLowTrusteePast5Years: booleanToString,
  trusteeNoEscapeFromMediumCloseMaxPast10Years: booleanToString,
  trusteeNoViolentFelonyConvictionPast5YearsIncarceration: booleanToString,
  trusteeNotConvictedOfFirstDegreeMurder: booleanToString,
  trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: booleanToString,
  trusteeNotScoredHighForViolence: booleanToString,
  trusteeNotServingForSexualOffense: booleanToString,
});

export type TrusteeFormAdditionalFields = {
  trusteeNoFelonyDetainers: string;
  trusteeNoPendingFelonyCharges: string;
  trusteeNoPendingImmigrationActions: string;
  trusteeWardenHasApproved: string;
  trusteeDenialReasons: string;
  trusteeCustodyApproved: string;
};

export type TrusteeFormSchema = z.output<typeof trusteeFormSchema> &
  TrusteeFormAdditionalFields;

export const coverSheetInformationSchema = z.object({
  levelOfCare: z.string().optional(),
  sentenceReleaseEligibilityDate: dateStringSchema.optional(),
  latestVantageCompletedDate: dateStringSchema.optional(),
  latestVantageRiskLevel: z.string().optional(),
  healthClassification: z.string().optional(),
  sentenceExpirationDate: dateStringSchema.optional(),
  activeRecommendations: z.array(
    z.object({
      Recommendation: z.string(),
      // // May also include these fields we're not using and therefore don't need to validate:
      // Pathway: z.string(),
      // PathwayName: z.string(),
      // TreatmentGoal: z.string(),
      // VantagePointTitle: z.string(),
    }),
  ),
  hasIncompatibles: z.boolean(),
  incompatibleArray: z.array(
    z.object({
      incompatibleOffenderId: z.string(),
      incompatibleType: z.string(),
    }),
  ),
  statusAtHearingSeg: z.string(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const partialCoverSheetInformation = coverSheetInformationSchema.partial();

export type CoverSheetFormData = z.infer<typeof partialCoverSheetInformation>;

export type UsTnCoverSheetSharedDraftData = {
  institutionName: string;
  residentFullName: string;
  omsId: string;
  date: string;
  statusAtHearing: string;
  hasIncompatibles: boolean;
  incompatiblesList: string;
  inmateWaivesNotice: boolean;
  currentCustodyLevel: string;
  recommendationFacilityAssignment: string;
  recommendationTransfer: boolean;
  recommendationCustodyLevel: string;
  recommendationOverrideType: string;
  recommendationJustification: string;
  updatedPhotoNeeded: boolean;
  emergencyContactUpdated: boolean;
  emergencyContactUpdatedDate: string;
  inmateAppeal: boolean;
  disagreementReasons: string;
  denialReasons: string;
};
