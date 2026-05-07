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

// Overall max scores per assessment type
export const OVERALL_MAX_SCORE_BY_ASSESSMENT_TYPE: Record<
  AssessmentTypeKey,
  number | null
> = {
  ORAS_CST: 49,
  ORAS_SRT: 45,
  ORAS_PIT: 40,
  ORAS_RT: 28,
  Other: null,
};

// Score thresholds per assessment type and gender.
// Bucket values: 0 = Low, 1 = Moderate, 2 = High (High absorbs Very High).
// Female norms differ from male norms on all tools.
type Boundaries = { moderate: number; high: number };
const SCORE_BUCKET_BOUNDARIES: Partial<
  Record<AssessmentTypeKey, { MALE: Boundaries; FEMALE: Boundaries }>
> = {
  ORAS_CST: {
    MALE: { moderate: 15, high: 24 },
    FEMALE: { moderate: 15, high: 29 },
  },
  ORAS_SRT: {
    MALE: { moderate: 15, high: 21 },
    FEMALE: { moderate: 14, high: 22 },
  },
  ORAS_PIT: {
    MALE: { moderate: 9, high: 17 },
    FEMALE: { moderate: 13, high: 19 },
  },
  ORAS_RT: {
    MALE: { moderate: 10, high: 16 },
    FEMALE: { moderate: 11, high: 15 },
  },
};

function getBoundaries(
  assessmentType: AssessmentTypeKey,
  gender: string | null | undefined,
): Boundaries | null {
  const byGender = SCORE_BUCKET_BOUNDARIES[assessmentType];
  if (!byGender) return null;
  return gender === "FEMALE" ? byGender.FEMALE : byGender.MALE;
}

export function getAssessmentScoreBucket(
  assessmentType: AssessmentTypeKey | null | undefined,
  score: number,
  gender?: string | null,
): number | null {
  if (!assessmentType) return null;
  const boundaries = getBoundaries(assessmentType, gender);
  if (!boundaries) return null;
  if (score >= boundaries.high) return 2;
  if (score >= boundaries.moderate) return 1;
  return 0;
}

/**
 * Returns a human-readable ORAS score range string for a given bucket number
 * (0=Low, 1=Moderate, 2=High).
 * Returns null if the assessment type is unknown or bucket is invalid.
 */
export function getOrasBucketScoreRange(
  bucket: number,
  assessmentType: AssessmentTypeKey,
  gender?: string | null,
): string | null {
  const boundaries = getBoundaries(assessmentType, gender);
  if (!boundaries) return null;
  switch (bucket) {
    case 0:
      return `0-${boundaries.moderate - 1}`;
    case 1:
      return `${boundaries.moderate}-${boundaries.high - 1}`;
    case 2:
      return `${boundaries.high}+`;
    default:
      return null;
  }
}
