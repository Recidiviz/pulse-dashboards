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

// Keys = DB values (from Prisma enum), Values = UI display names
export const AssessmentTypeDisplayNames = {
  ORAS_CST: "Community Supervision Tool (ORAS-CST)",
  ORAS_SRT: "Supplemental Reentry Tool (ORAS-SRT)",
  ORAS_PIT: "Prison Intake Tool (ORAS-PIT)",
  ORAS_RT: "Reentry Tool (ORAS-RT)",
  Other: "Other Assessment",
} as const;

export type AssessmentTypeKey = keyof typeof AssessmentTypeDisplayNames;

/** The four ORAS assessment tool types (excludes "Other"). */
export const ORAS_TOOL_KEYS = [
  "ORAS_CST",
  "ORAS_SRT",
  "ORAS_PIT",
  "ORAS_RT",
] as const satisfies AssessmentTypeKey[];

export function getAssessmentTypeDisplayName(
  dbValue: AssessmentTypeKey | null | undefined,
): string {
  if (!dbValue) return "Unknown";
  return AssessmentTypeDisplayNames[dbValue];
}

/** Returns the short tool code for an assessment type, e.g. "ORAS_CST" → "ORAS-CST". */
export function getAssessmentTypeShortName(
  assessmentType: AssessmentTypeKey | null | undefined,
): string {
  if (!assessmentType || assessmentType === "Other") return "ORAS";
  return assessmentType.replace(/_/g, "-");
}

// Overall max scores derived from observed production data (excluding Age domain)
export const OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE: Record<
  AssessmentTypeKey,
  number | null
> = {
  ORAS_CST: 49,
  ORAS_SRT: 44,
  ORAS_PIT: 39,
  ORAS_RT: 27,
  Other: null,
};

// Score thresholds per assessment type (male ranges from official ORAS scoring guide)
// Bucket values: 0 = Low, 1 = Moderate, 2 = High, 3 = Very High
const SCORE_BUCKET_BOUNDARIES: Partial<
  Record<
    AssessmentTypeKey,
    { moderate: number; high: number; veryHigh?: number }
  >
> = {
  ORAS_CST: { moderate: 15, high: 24, veryHigh: 34 },
  ORAS_SRT: { moderate: 15, high: 21 },
  ORAS_PIT: { moderate: 9, high: 17, veryHigh: 25 },
  ORAS_RT: { moderate: 10, high: 16 },
};

export function getAssessmentScoreBucket(
  assessmentType: AssessmentTypeKey | null | undefined,
  score: number,
): number | null {
  if (!assessmentType) return null;
  const boundaries = SCORE_BUCKET_BOUNDARIES[assessmentType];
  if (!boundaries) return null;
  if (boundaries.veryHigh !== undefined && score >= boundaries.veryHigh)
    return 3;
  if (score >= boundaries.high) return 2;
  if (score >= boundaries.moderate) return 1;
  return 0;
}

/**
 * Returns a human-readable ORAS score range string for a given bucket number
 * (0=Low, 1=Moderate, 2=High, 3=Very High).
 * Returns null if the assessment type is unknown or bucket is invalid.
 */
export function getOrasBucketScoreRange(
  bucket: number,
  assessmentType: AssessmentTypeKey,
): string | null {
  const boundaries = SCORE_BUCKET_BOUNDARIES[assessmentType];
  if (!boundaries) return null;
  switch (bucket) {
    case 0:
      return `0-${boundaries.moderate - 1}`;
    case 1:
      return `${boundaries.moderate}-${boundaries.high - 1}`;
    case 2:
      return boundaries.veryHigh
        ? `${boundaries.high}-${boundaries.veryHigh - 1}`
        : `${boundaries.high}+`;
    case 3:
      return boundaries.veryHigh ? `${boundaries.veryHigh}+` : null;
    default:
      return null;
  }
}
