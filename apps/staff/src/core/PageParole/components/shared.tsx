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
