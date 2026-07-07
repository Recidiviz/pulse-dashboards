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

// Pure ports of derivations that live only as MobX getters on the presenters.
// The PDF template renders from a raw `SAR` with no presenter available (the
// staff "Download Report" button fetches getSAR on click), so these are plain
// functions of `sar`. Everything else the template needs already exists as a
// standalone exported helper and is imported directly at the call site.

import type { SAR, SARInsight } from "../../../api";
import {
  calculateAgeAtDate,
  convertDecimalToPercentage,
  formatDisplayDate,
  titleCase,
} from "../../../utils/utils";
import {
  getSentenceLengthBucketLabel,
  sentenceLengthLabelFilter,
} from "../../CaseDetails/components/charts/common/utils";
import {
  NeedsToBeAddressed,
  OTHER_OPTION,
  ProtectiveFactors,
} from "../../constants";
import { mapEnumKeysToDisplay } from "../../KeyConsiderations/utils";
import type { RiskLevelKey } from "../../OffenderAssessment/constants";
import {
  MAX_DOC_HISTORIES_PER_CATEGORY,
  TREATMENT_PROGRAM_CATEGORY_LABELS,
} from "../../OffenderAssessment/PriorTreatmentHistory/constants";
import { TreatmentProgramCategory } from "../../OffenderAssessment/PriorTreatmentHistory/types";
import {
  getDomainsForAssessmentType,
  ORASDomainRiskLevelField,
} from "../../OffenderAssessment/utils";

/**
 * Minimal shape of the per-section skip flags the report reads from the raw
 * SAR's JSON `metadata` field. The full type lives un-exported on
 * `SARDetailsPresenter`; the PDF has no presenter, so it reads these flags off
 * `sar.metadata` directly, exactly as `SARDetailsPresenter.isSectionSkipped`.
 */
interface SARMetadataShape {
  sections?: {
    victimImpactStatement?: { skipped?: boolean };
    defendantStatement?: { skipped?: boolean };
    recommendation?: { skipped?: boolean };
    keyConsiderations?: {
      areasOfNeed?: { skipped?: boolean };
      mitigatingFactors?: { skipped?: boolean };
    };
  };
}

type SkippableSection =
  | "victimImpactStatement"
  | "defendantStatement"
  | "recommendation";

const sarSections = (sar: SAR): SARMetadataShape["sections"] =>
  (sar.metadata as SARMetadataShape | null | undefined)?.sections;

/** Whether a top-level section was explicitly skipped; mirrors
 * `presenter.isSectionSkipped`. */
export const sectionSkipped = (sar: SAR, section: SkippableSection): boolean =>
  sarSections(sar)?.[section]?.skipped === true;

/** Whether Areas of Need was skipped; mirrors `presenter.needsSkipped`. */
export const needsSkipped = (sar: SAR): boolean =>
  sarSections(sar)?.keyConsiderations?.areasOfNeed?.skipped === true;

/** Whether Mitigating Factors was skipped; mirrors `presenter.factorsSkipped`. */
export const factorsSkipped = (sar: SAR): boolean =>
  sarSections(sar)?.keyConsiderations?.mitigatingFactors?.skipped === true;

/** Reads a domain's risk-level field off the raw SAR, narrowed to a key. */
const riskLevelOf = (
  sar: SAR,
  field: ORASDomainRiskLevelField | undefined,
): RiskLevelKey | null => {
  if (!field) return null;
  const value = sar[field];
  return value === "LOW" || value === "MODERATE" || value === "HIGH"
    ? value
    : null;
};

/** Client's age as of the ORAS assessment date; mirrors
 * `OffenderAssessmentPresenter.ageAtAssessment`. */
export const ageAtAssessment = (sar: SAR): number | null => {
  const birthDate = sar.client?.birthDate;
  if (!birthDate || !sar.assessmentDate) return null;
  return calculateAgeAtDate(birthDate, sar.assessmentDate);
};

/**
 * Groups the assessment's ORAS domains by their risk level for the Risk Profile
 * Summary three-column chip table. Mirrors `presenter.riskProfileCardData`.
 */
export const riskProfileGroups = (sar: SAR): Record<RiskLevelKey, string[]> => {
  const grouped: Record<RiskLevelKey, string[]> = {
    HIGH: [],
    MODERATE: [],
    LOW: [],
  };
  for (const domain of getDomainsForAssessmentType(sar.assessmentType)) {
    const level = riskLevelOf(sar, domain.riskLevelField);
    if (level) grouped[level].push(domain.title);
  }
  return grouped;
};

/** Display labels for Areas of Need; mirrors `presenter.needsDisplayItems`
 * (returns [] when the section was skipped). */
export const needsDisplayItems = (sar: SAR): string[] => {
  if (needsSkipped(sar)) return [];
  const items = mapEnumKeysToDisplay(
    NeedsToBeAddressed,
    sar.needsToBeAddressed,
  ).filter((item) => item !== OTHER_OPTION);
  if (sar.otherNeedToBeAddressed) items.push(sar.otherNeedToBeAddressed);
  return items;
};

/** Display labels for Mitigating Factors; mirrors `presenter.factorsDisplayItems`
 * (returns [] when the section was skipped). */
export const factorsDisplayItems = (sar: SAR): string[] => {
  if (factorsSkipped(sar)) return [];
  const items = mapEnumKeysToDisplay(
    ProtectiveFactors,
    sar.mitigatingFactors,
  ).filter((item) => item !== OTHER_OPTION);
  if (sar.otherMitigatingFactor) items.push(sar.otherMitigatingFactor);
  return items;
};

/** Title-cased, comma-joined race string; mirrors
 * `presenter.formattedRaceOrEthnicity` (strips underscores before casing, so
 * "AMERICAN_INDIAN" → "American Indian"). */
export const formattedRace = (sar: SAR): string => {
  const races = sar.client?.raceOrEthnicity;
  if (!races || races.length === 0) return "Unknown";
  return races
    .map((race) =>
      race
        .trim()
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .map((word) => titleCase(word))
        .join(" "),
    )
    .join(", ");
};

export interface DocTreatmentGroup {
  /** Count + label, e.g. "3 Cognitive Programs". */
  title: string;
  entries: Array<{ date: string; name: string }>;
}

/**
 * DOC incarceration-program histories filtered to on/before the SAR due date,
 * grouped by category with a count+label title and capped per category.
 * Mirrors `PriorTreatmentHistoryPresenter.DOCTreatmentHistoriesByCategory` +
 * `filteredDOCTreatmentHistories`.
 */
export const docTreatmentGroups = (sar: SAR): DocTreatmentGroup[] => {
  const dueDate = sar.dueDate;
  const histories = (sar.client?.DOCTreatmentHistories ?? [])
    .filter((h) => {
      if (!h.completedOn) return false;
      if (!dueDate) return true;
      return new Date(h.completedOn) <= new Date(dueDate);
    })
    .sort(
      (a, b) =>
        new Date(b.completedOn as Date).getTime() -
        new Date(a.completedOn as Date).getTime(),
    );

  const grouped = new Map<TreatmentProgramCategory, typeof histories>();
  for (const h of histories) {
    if (!h.programCategory) continue;
    const existing = grouped.get(h.programCategory) ?? [];
    grouped.set(h.programCategory, [...existing, h]);
  }

  return [...grouped.entries()].map(([category, rows]) => {
    const labels = TREATMENT_PROGRAM_CATEGORY_LABELS[category];
    const title = `${rows.length} ${rows.length === 1 ? labels.singular : labels.plural}`;
    return {
      title,
      entries: rows.slice(0, MAX_DOC_HISTORIES_PER_CATEGORY).map((h) => ({
        date: formatDisplayDate(h.completedOn),
        name: h.programName ?? "—",
      })),
    };
  });
};

/** Splits a recommendation free-text field into trimmed, non-empty paragraphs. */
export const splitParagraphs = (text?: string | null): string[] =>
  text ? text.split("\n").filter((line) => line.trim()) : [];

// --- Historical Outcome (insight) derivations ----------------------------

/** Sentence-type sort order for the donut/legend; mirrors presenter constant. */
const DISPOSITION_TYPE_ORDER: Record<string, number> = {
  Deferred_prosecution: 0,
  Probation: 1,
  Treatment_in_prison: 2,
  Suspended: 3,
};

export interface SentenceDistributionRow {
  label: string;
  pct: number;
  recommendationType: string | null;
}

/** Donut/legend rows from insight disposition data, sorted + percentage-ized. */
export const sentenceDistributionRows = (
  insight: NonNullable<SARInsight>,
): SentenceDistributionRow[] =>
  [...insight.dispositionData]
    .sort(
      (a, b) =>
        (DISPOSITION_TYPE_ORDER[a.recommendationType ?? ""] ?? 4) -
        (DISPOSITION_TYPE_ORDER[b.recommendationType ?? ""] ?? 4),
    )
    .map((d) => ({
      label: getSentenceLengthBucketLabel(
        d.recommendationType,
        d.sentenceLengthBucketStart,
        d.sentenceLengthBucketEnd,
      ),
      pct: convertDecimalToPercentage(d.percentage),
      recommendationType: d.recommendationType,
    }));

/**
 * Plain-string Key Finding sentence. The DOM report's `buildKeyFindingText`
 * returns JSX with <strong> (DOM-only); react-pdf needs a string, so this
 * ports the same logic without inline bolding.
 */
export const keyFindingText = (
  insight: NonNullable<SARInsight>,
): string | null => {
  const { dispositionData, avgPctServed } = insight;
  if (dispositionData.length === 0) return null;
  const mostCommon = dispositionData.reduce((best, d) =>
    d.percentage > best.percentage ? d : best,
  );
  const mostCommonLabel = getSentenceLengthBucketLabel(
    mostCommon.recommendationType,
    mostCommon.sentenceLengthBucketStart,
    mostCommon.sentenceLengthBucketEnd,
  ).toLowerCase();

  const base = `The most common sentence given for previous, similar cases was ${mostCommonLabel}.`;
  if (avgPctServed == null) return base;

  // Incarceration buckets are the non-flat ones (a real sentence-length range),
  // matching the DOM report's `!sentenceLengthLabelFilter(d)`.
  const incarcerationPct = dispositionData
    .filter((d) => !sentenceLengthLabelFilter(d))
    .reduce((sum, d) => sum + convertDecimalToPercentage(d.percentage), 0);
  const served = Math.round(avgPctServed * 10) / 10;
  return `${base} Of the ${incarcerationPct}% of defendants sentenced to incarceration, on average individuals served ${served}% of their sentence in custody before being granted parole.`;
};

// --- Signature derivations ------------------------------------------------

export interface SignatureData {
  signature: string | null;
  title: string | null;
  lastSignedAt: Date | null;
}

/**
 * True when a signature is fully in place. Mirrors the DOM report's
 * `isSignatureComplete` (ReportSignature.tsx); re-implemented here so the
 * react-pdf import graph stays free of that styled-components module.
 */
export const isSignatureComplete = (
  data: SignatureData,
): data is { signature: string; title: string; lastSignedAt: Date } =>
  !!data.signature && !!data.title && !!data.lastSignedAt;

/** Officer signature projection; mirrors `presenter.officerSignatureData`. */
export const officerSignatureData = (sar: SAR): SignatureData => ({
  signature: sar.officerSignature ?? null,
  title: sar.officerTitle ?? null,
  lastSignedAt: sar.officerLastSignedAt ?? null,
});

/** Supervisor signature projection; mirrors `presenter.supervisorSignatureData`. */
export const supervisorSignatureData = (sar: SAR): SignatureData => ({
  signature: sar.supervisorSignature ?? null,
  title: sar.supervisorTitle ?? null,
  lastSignedAt: sar.supervisorLastSignedAt ?? null,
});
