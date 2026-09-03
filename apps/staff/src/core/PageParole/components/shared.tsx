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

import { spacing, typography } from "@recidiviz/design-system";
import { subYears } from "date-fns";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleConductRecord } from "~datatypes";
import { palette } from "~design-system";

import { SectionCard as BaseSectionCard } from "../../SectionCard";

// Styled primitives and formatters shared across two or more
// ParoleCaseProfile section components.

export const SectionCard = styled(BaseSectionCard)`
  overflow: hidden;
`;

/**
 * `new Date("yyyy-MM-dd")` parses the string as UTC midnight per spec, which
 * silently rolls back to the previous calendar day once formatted in any
 * timezone behind UTC (most of the US). Appending a local-time component
 * forces the same string to parse as local midnight instead.
 */
export const parseIsoDate = (dateString: string): Date =>
  new Date(`${dateString}T00:00:00`);

/**
 * Dates arrive as "yyyy-MM-dd" fixture strings, as Date objects built from
 * chart coordinates, or -- despite what semiotic's own types (and ours,
 * matching them) claim -- sometimes as a raw timestamp number from inside a
 * semiotic tooltip callback. Handle all three explicitly rather than trusting
 * the declared type, since only the `instanceof Date` check is actually safe.
 */
export const toSafeDate = (date: string | number | Date): Date => {
  if (date instanceof Date) return date;
  if (typeof date === "string") return parseIsoDate(date);
  return new Date(date);
};

export const formatDate = (date: string | number | Date) =>
  toSafeDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Returns `score` as a percentage of `maxScore`, or `0` if `maxScore` isn't
 * positive (guards against a malformed assessment rendering
 * `NaN%`/`Infinity%` instead of failing safely).
 */
export const safeScorePct = (score: number, maxScore: number): number =>
  maxScore > 0 ? (score / maxScore) * 100 : 0;

export const calculateAge = (dob: string): number => {
  const birthDate = parseIsoDate(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
};

export const FactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${rem(spacing.lg)};
`;

export const FactLabel = styled.div`
  color: ${palette.slate70};
  font-size: 13px;
  margin-bottom: 0.25rem;
`;

export const FactStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25em;
`;

// A row of up to 3 label/value FactStacks -- shared by CaseProfileSidebar's
// Personal/Hearing/Sentence Info rows and AssessmentsSidebarSection's
// Type/Date/Administered row.
//
// Each label/value pair wraps as a whole onto the next row once three no
// longer fit, rather than immediately wrapping its own label or value --
// only a pair that still doesn't fit even alone on its own row falls back
// to wrapping its text.
export const FactRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: 1rem;
  row-gap: 0.75rem;
`;

export const FactRowStack = styled(FactStack)`
  // Basis is each pair's own single-line content width, not a fixed
  // third, so the row fits as many pairs as their content allows -- a
  // fixed third would make a short pair (e.g. "Age") claim more room
  // than it needs and prematurely wrap a pair after it that would
  // otherwise still fit. Growing fills whatever room is left so pairs
  // stay evenly spaced when there's slack. Shrinking only ever kicks in
  // once a pair is already alone on its own row and still doesn't fit,
  // at which point it wraps its text (min-width stays at its default
  // auto, so it can't shrink -- and so wrap -- any sooner than that).
  flex: 1 1 max-content;
  overflow-wrap: break-word;
`;

export const StackedFacts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StackedFactRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;

  // FactLabel carries a bottom margin meant for label-above-value layouts;
  // drop it here so the rows sit an even 0.5rem apart.
  & > * {
    margin-bottom: 0;
  }
`;

// Spans two of FactGrid's three columns, for a fact whose value is too long
// to sit comfortably in a single column (e.g. a free-text narrative).
export const WideFactItem = styled.div`
  grid-column: span 2;
`;

// Vertically stacks a SectionCardBody's groups (a fact grid, a divider, a
// labeled subsection, ...) with consistent spacing via `gap`, rather than
// each group managing its own margin/padding against its neighbors.
export const SectionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Hr = styled.hr`
  border: none;
  border-top: 1px solid ${palette.slate10};
  margin: 0;
  width: 100%;
`;

export const SubsectionTitle = styled.div`
  ${typography.Sans16}
  font-weight: 600;
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.md)};
`;

/**
 * Years of conduct history the Institutional Conduct History section shows
 * inline when a tenant's config doesn't set its own window.
 */
export const DEFAULT_CONDUCT_HISTORY_YEARS = 1;

/**
 * Splits conduct records into those inside `visibleYears` and those older,
 * both sorted newest first.
 *
 * `visibleYears` is a count of calendar years, not a duration -- `subYears`
 * lands on the same calendar day N years back, so a record can't drift in or
 * out of the window as leap days accumulate.
 *
 * Both the section itself and any tenant-owned older-records slot (e.g.
 * US_CO's "See Older Disciplinaries" toggle) call this with the same
 * `visibleYears` off the tenant's config, so the two sets stay exactly
 * complementary -- no record shows up twice, none goes missing.
 */
export function partitionConductHistoryByRecency(
  conductHistory: Array<ParoleConductRecord>,
  visibleYears: number,
): {
  recentRecords: Array<ParoleConductRecord>;
  olderRecords: Array<ParoleConductRecord>;
} {
  const cutoff = subYears(new Date(), visibleYears);
  const isVisible = (record: ParoleConductRecord) =>
    parseIsoDate(record.date) >= cutoff;

  const sorted = [...conductHistory].sort(
    (a, b) => parseIsoDate(b.date).getTime() - parseIsoDate(a.date).getTime(),
  );
  return {
    recentRecords: sorted.filter(isVisible),
    olderRecords: sorted.filter((record) => !isVisible(record)),
  };
}

export const isParolePlanStale = (lastUpdated: string): boolean => {
  const updated = parseIsoDate(lastUpdated);
  const today = new Date();
  const daysDiff = Math.floor(
    (today.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysDiff > 90;
};

export const EmptyState = styled.div`
  color: ${palette.slate70};
  font-style: italic;
`;

const SAFE_DOCUMENT_URL_SCHEMES = ["http:", "https:"];

/**
 * Attachment/document URLs come from upstream case data, not a live HTTP
 * user input -- but rendering one directly as an <a href> with no scheme
 * check would still let a malformed or corrupted record (e.g. a
 * `javascript:` URL) execute on click. Document URLs are root-relative
 * paths (e.g. "/documents/foo.pdf"), so resolve against the current origin
 * rather than parsing as an absolute URL -- a relative path then inherits
 * the origin's http(s) scheme, while an absolute `javascript:`/`data:` URL
 * keeps its own (rejected) scheme.
 */
export const isSafeDocumentUrl = (url: string): boolean => {
  try {
    return SAFE_DOCUMENT_URL_SCHEMES.includes(
      new URL(url, window.location.origin).protocol,
    );
  } catch {
    return false;
  }
};

export const AlertBanner = styled.div<{
  $color?: string;
  $backgroundColor?: string;
  $textColor?: string;
  $fontWeight?: string;
  $alignItems?: string;
  $marginBottom?: string;
}>`
  background-color: ${({ $backgroundColor }) =>
    $backgroundColor ?? "rgba(255, 245, 245, 1)"};
  border-color: ${({ $color }) => $color ?? palette.logoRed};
  border-style: solid;
  border-width: 0 0 0 ${rem(spacing.xs)};
  padding: ${rem(spacing.md)};
  padding-left: ${rem(22)};
  display: flex;
  align-items: ${({ $alignItems }) => $alignItems ?? "stretch"};
  gap: ${rem(spacing.md)};
  margin-bottom: ${({ $marginBottom }) => $marginBottom ?? rem(spacing.md)};
  ${({ $textColor }) => $textColor && `color: ${$textColor};`}
  ${({ $fontWeight }) => $fontWeight && `font-weight: ${$fontWeight};`}
`;

export const AlertHeading = styled.div<{ $color?: string }>`
  font-weight: 700;
  color: ${({ $color }) => $color ?? palette.logoRed};
  margin-bottom: ${rem(4)};
`;

export const AlertBody = styled.div`
  color: ${palette.pine1};
`;

export const DocumentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const DocumentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & + & {
    padding-top: 1rem;
    border-top: 1px solid ${palette.slate10};
  }
`;

export const DocumentInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 0.25em;
`;

export const DocumentLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  color: ${palette.signal.links};
  font-weight: 600;
`;

// Anchor targets for CaseProfileSidebar's "jump to section" nav, keyed the
// same way on both ends so a rename can't silently desync the nav from the
// sections it scrolls to.
export const PAROLE_SECTION_IDS = {
  offenseHistory: "parole-section-offense-history",
  riskAssessment: "parole-section-risk-assessment",
  riskAndNeedsAssessment: "parole-section-risk-and-needs-assessment",
  programParticipation: "parole-section-program-participation",
  conductHistory: "parole-section-conduct-history",
  attachments: "parole-section-attachments",
  communitySupervisionPlan: "parole-section-community-supervision-plan",
  downloadReport: "parole-section-download-report",
} as const;

export const PAROLE_REPORT_CAPTURE_ID = "parole-report-capture";

export function scrollToSection(sectionId: string): void {
  document
    .getElementById(sectionId)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
