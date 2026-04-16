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

import React from "react";

import { SARInsight } from "../../api";
import {
  convertDecimalToPercentage,
  formatOffenseLabel,
  formatTimeServedPct,
} from "../../utils/utils";
import {
  getDescriptionGender,
  getSentenceLengthBucketLabel,
  sentenceLengthLabelFilter,
} from "../CaseDetails/components/charts/common/utils";
import { BUCKET_TO_RISK_LEVEL } from "../CaseDetails/components/charts/DispositionChart/sarUtils";
import {
  getAssessmentTypeShortName,
  getOrasBucketScoreRange,
  ORAS_TOOL_KEYS,
} from "../OffenderAssessment/assessmentTypeUtils";

export type InsightDescriptionContext = {
  gender: NonNullable<SARInsight>["gender"];
  assessmentScoreBucketStart: number | null;
  offense: NonNullable<SARInsight>["offense"];
  offenseCategory: NonNullable<SARInsight>["offenseCategory"];
};

/** Renders the bold inline subject segment shared by the full and empty chart states. */
export function InsightSubjectSpans({
  gender,
  assessmentScoreBucketStart,
  offense,
  offenseCategory,
}: InsightDescriptionContext) {
  const genderString = getDescriptionGender(gender);
  const offenseDescriptor =
    offenseCategory ?? formatOffenseLabel(offense).replace(/\s*offenses$/i, "");

  // Omit risk level clause when no valid bucket is available (e.g. no ORAS assessment).
  if (assessmentScoreBucketStart == null) {
    return (
      <>
        <span>{genderString.trim()}</span> with{" "}
        <span>{offenseDescriptor} convictions</span>
      </>
    );
  }

  const riskLevel =
    BUCKET_TO_RISK_LEVEL[assessmentScoreBucketStart] ?? "unknown risk";
  return (
    <>
      <span>{genderString.trim()}</span> with <span>{riskLevel} scores*</span>{" "}
      with <span>{offenseDescriptor} convictions</span>
    </>
  );
}

/**
 * Builds the footnote string for the Insights panel.
 * e.g. "*These rates are based on 1,234 records of male with moderate scores (0-7 for the ORAS-CST, ...)"
 */
export function buildInsightsFootnoteText(
  numRecords: number,
  gender: NonNullable<SARInsight>["gender"],
  bucket: number | null,
): string {
  const genderString = getDescriptionGender(gender).trim();
  if (bucket == null) {
    return `*These rates are based on ${numRecords.toLocaleString()} records of ${genderString}`;
  }
  const riskLevel = BUCKET_TO_RISK_LEVEL[bucket] ?? "unknown risk";
  const rangeFragments = ORAS_TOOL_KEYS.map((tool, i) => {
    const range = getOrasBucketScoreRange(bucket, tool);
    const shortName = getAssessmentTypeShortName(tool);
    const prefix = i === ORAS_TOOL_KEYS.length - 1 ? "or " : "";
    return `${prefix}${range} for the ${shortName}`;
  });
  return `*These rates are based on ${numRecords.toLocaleString()} records of ${genderString} with ${riskLevel} scores (${rangeFragments.join(", ")})`;
}

/**
 * Builds the Key Finding paragraph for the time-served section.
 * The most common sentence label, incarceration %, avg sentence length, and avg pct served are bolded.
 * e.g. "The most common sentence given for previous, similar cases was probation. Of the 23% of
 *       defendants sentenced to incarceration, the average sentence length was 8.6 years and on
 *       average individuals served 16% of their sentence in custody before being granted parole."
 * e.g. "The most common sentence given for previous, similar cases was probation." (no time-served data)
 */
export function buildKeyFindingText(
  dispositionData: NonNullable<SARInsight>["dispositionData"],
  avgSentenceLengthYears?: number | null,
  avgPctServed?: number | null,
): React.ReactNode {
  if (dispositionData.length === 0) return null;
  const mostCommon = dispositionData.reduce((best, d) =>
    d.percentage > best.percentage ? d : best,
  );

  const mostCommonLabel = getSentenceLengthBucketLabel(
    mostCommon.recommendationType,
    mostCommon.sentenceLengthBucketStart,
    mostCommon.sentenceLengthBucketEnd,
  ).toLowerCase();

  const baseText = (
    <>
      The most common sentence given for previous, similar cases was{" "}
      <strong>{mostCommonLabel}</strong>.
    </>
  );

  if (avgSentenceLengthYears == null || avgPctServed == null) {
    return baseText;
  }

  const incarcerationPct = convertDecimalToPercentage(
    dispositionData
      .filter((d) => !sentenceLengthLabelFilter(d))
      .reduce((sum, d) => sum + d.percentage, 0),
  );
  const pct = formatTimeServedPct(avgPctServed);

  return (
    <>
      {baseText} Of the <strong>{incarcerationPct}%</strong> of defendants
      sentenced to incarceration, the average sentence length was{" "}
      <strong>{avgSentenceLengthYears} years</strong> and on average individuals
      served <strong>{pct}%</strong> of their sentence in custody before being
      granted parole.
    </>
  );
}
