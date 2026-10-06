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

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";
import type { StatusTone } from "~@meetings/app/admin/ui/StatusBadge";

import { gradeDisplay } from "./grades";

export type RatingCell =
  | { kind: "badge"; label: string; tone: StatusTone; sub?: string }
  | { kind: "text"; label: string };

export type RatingsTable = {
  headers: string[];
  rows: { dimension: string; cells: RatingCell[] }[];
  /** Whether to explain how the raters' grades are combined. */
  showCombineNote: boolean;
};

const DIMENSIONS = [
  { key: "overall", label: "Overall" },
  { key: "caseNote", label: "Case note" },
  { key: "actionItems", label: "Action items" },
  { key: "transcript", label: "Transcript" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export const COMBINE_NOTE =
  "Combined grade: admin@recidiviz.org overrides other raters on any dimension they graded. Otherwise the worst grade wins.";

const badge = (grade: string | null | undefined, sub?: string): RatingCell => ({
  kind: "badge",
  ...gradeDisplay(grade),
  sub,
});

const PROVIDER_NAMES = {
  ASSEMBLYAI: "AssemblyAI",
  DEEPGRAM: "Deepgram",
} as const;

const GRADE_SEVERITY: Record<string, number> = { BAD: 3, PARTIAL: 2, GOOD: 1 };

function worstOf(a: string, b: string): string {
  return (GRADE_SEVERITY[a] ?? 0) >= (GRADE_SEVERITY[b] ?? 0) ? a : b;
}

/** The judge's transcript comparison as a single grade plus who won. */
function llmTranscriptCell(
  dimension: NonNullable<FlaggedMeetingDetails["llm"]>["dimensions"][number],
): RatingCell {
  const { gradeOrWinner: winner, providerGrades } = dimension;
  if (!providerGrades) return badge(null);
  const { assemblyai, deepgram } = providerGrades;
  if (winner === "ASSEMBLYAI" || winner === "DEEPGRAM") {
    const grade = winner === "ASSEMBLYAI" ? assemblyai : deepgram;
    return badge(grade, `${PROVIDER_NAMES[winner]} preferred`);
  }
  if (winner === "ABOUT_THE_SAME") {
    return badge(worstOf(assemblyai, deepgram), "About the same");
  }
  if (winner === "SINGLE_PROVIDER") {
    return badge(assemblyai !== "NONE" ? assemblyai : deepgram);
  }
  return badge(null);
}

function llmCell(
  details: FlaggedMeetingDetails,
  key: DimensionKey,
): RatingCell {
  const llmKey = key === "transcript" ? "transcriptComparison" : key;
  const dimension = details.llm?.dimensions.find((d) => d.key === llmKey);
  if (!dimension) return badge(null);
  return key === "transcript"
    ? llmTranscriptCell(dimension)
    : badge(dimension.gradeOrWinner);
}

export function raterHeader(
  rater: { raterEmail: string; isAuthoritative: boolean },
  emailCounts: Map<string, number> = new Map(),
): string {
  const local = rater.raterEmail.split("@")[0];
  // Two raters can share a local part across domains; fall back to the email.
  const name = (emailCounts.get(local) ?? 0) > 1 ? rater.raterEmail : local;
  return rater.isAuthoritative ? `${name} (authoritative)` : name;
}

export function buildRatingsTable(
  details: FlaggedMeetingDetails,
): RatingsTable {
  const { labelStudio } = details;
  const raters = labelStudio?.raters ?? [];
  const headers = ["Dimension", "LLM judge", "Label Studio"];

  const emailCounts = new Map<string, number>();
  for (const rater of raters) {
    const local = rater.raterEmail.split("@")[0];
    emailCounts.set(local, (emailCounts.get(local) ?? 0) + 1);
  }
  if (raters.length > 0) {
    headers.push(...raters.map((r) => raterHeader(r, emailCounts)));
  }

  const rows = DIMENSIONS.map(({ key, label }) => {
    const cells: RatingCell[] = [llmCell(details, key)];
    if (!labelStudio) {
      cells.push({ kind: "text", label: "Not sent" });
    } else if (raters.length === 0) {
      cells.push({ kind: "text", label: "Not rated yet" });
    } else {
      const combined = key === "transcript" ? null : labelStudio.combined[key];
      if (!combined) {
        // Transcript quality is never combined across raters.
        cells.push({ kind: "text", label: "—" });
      } else {
        cells.push(
          badge(
            combined.grade,
            combined.overriddenByAuthoritative
              ? `Admin override · worst was ${gradeDisplay(combined.worst).label}`
              : undefined,
          ),
        );
      }
      for (const rater of raters) {
        cells.push(
          badge(
            key === "transcript" ? rater.transcriptGrade : rater.grades[key],
          ),
        );
      }
    }
    return { dimension: label, cells };
  });

  return { headers, rows, showCombineNote: raters.length >= 2 };
}
