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

import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

import { SectionCard, SectionCardBody } from "../../SectionCard";

export const TypesenseCard = styled(SectionCard)`
  border-radius: ${rem(8)};
  overflow: hidden;
`;

export const TypesenseSectionContainer = styled.div`
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  margin-bottom: ${rem(60)};
`;

export const CardsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${rem(16)};
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

export const StatusDot = styled.div<{ $color: string }>`
  width: ${rem(16)};
  height: ${rem(16)};
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const StatusLabel = styled.span<{ $color: string }>`
  font-size: ${rem(16)};
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

export const CardBody = styled(SectionCardBody)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const StatusCardColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${rem(spacing.lg)};
`;

export const InfoBadge = styled.div`
  width: 100%;
  min-width: 0;
  background: ${palette.slate10};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
`;

export const InfoBadgeLabel = styled.span`
  ${typography.Sans14}
  font-weight: 600;
  color: ${palette.slate};
`;

export const InfoBadgeDetail = styled.span`
  ${typography.Sans12}
  color: ${palette.slate};
  overflow-wrap: anywhere;
  word-break: break-word;
`;

export const ErrorMessage = styled.span`
  display: block;
  align-self: stretch;
  contain: inline-size;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

export const ErrorTitle = styled.span`
  font-size: ${rem(16)};
  font-weight: 600;
  color: ${palette.signal.error};
`;

export const TableWrap = styled.div`
  width: 100%;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  overflow: hidden;
  margin-bottom: ${rem(spacing.sm)};
`;

export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const ColHeader = styled.th<{ $right?: boolean }>`
  ${typography.Sans12}
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${palette.slate10};
  padding: ${rem(5)} ${rem(spacing.sm)};
  color: ${palette.slate};
  border-bottom: 1px solid ${palette.slate20};
  text-align: ${({ $right }) => ($right ? "right" : "left")};
  white-space: nowrap;
`;

export const NameCell = styled.td`
  ${typography.Sans12}
  padding: ${rem(6)} ${rem(spacing.sm)};
  border-bottom: 1px solid ${palette.slate10};
  max-width: ${rem(140)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NumCell = styled.td`
  ${typography.Sans12}
  color: ${palette.slate60};
  padding: ${rem(6)} ${rem(spacing.sm)};
  text-align: right;
  border-bottom: 1px solid ${palette.slate10};
`;

export const EmptyCell = styled.td`
  ${typography.Sans12}
  text-align: center;
  font-style: italic;
  color: ${palette.slate60};
  padding: ${rem(18)} ${rem(spacing.sm)};
`;

export const CenteredRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
