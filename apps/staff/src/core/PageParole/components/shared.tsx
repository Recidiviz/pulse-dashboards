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
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

// Styled primitives and formatters shared across two or more
// ParoleCaseProfile section components.

// `new Date("yyyy-MM-dd")` parses the string as UTC midnight per spec, which
// silently rolls back to the previous calendar day once formatted in any
// timezone behind UTC (most of the US). Appending a local-time component
// forces the same string to parse as local midnight instead.
export const parseIsoDate = (dateString: string): Date =>
  new Date(`${dateString}T00:00:00`);

export const formatDate = (dateString: string) =>
  parseIsoDate(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

export const FactValue = styled.div`
  color: ${palette.pine1};
  font-weight: 600;
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

// Alert-style banner, parameterized so both parole-plan alerts (default red)
// and the victim-involved banner (overridden orange) can share it.
// $textColor/$fontWeight only apply when passed, so callers that color their
// own AlertHeading/AlertBody children aren't affected.
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
