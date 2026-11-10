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

import styled from "styled-components";

import { borderRadius, palette, spacing } from "../../../../../styles";

export const PendingResponseContainer = styled.div<{ $compact?: boolean }>`
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${({ $compact }) => ($compact ? spacing[2] : spacing[4])};
  width: 100%;
`;

export const SubmittedResponseContainer = styled(PendingResponseContainer)`
  border-radius: ${borderRadius[20]};
  border: 0.0625rem solid ${palette.border.subtle};
  padding: ${spacing[5]};
`;

export const SubmittedFootnote = styled.div`
  color: ${palette.foreground.secondary};
  width: 100%;
`;

export const ResponseActionsRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing[2]};
  width: 100%;
`;

export const ResponseMessageField = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const SubmittedMessageDisplay = styled.div`
  align-self: stretch;
  background: ${palette.background.secondary};
  border: 0.0625rem solid ${palette.border.subtle};
  border-radius: ${borderRadius[8]};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  min-height: 4rem;
  padding: ${spacing[3]};
  white-space: pre-wrap;
  width: 100%;
  word-break: break-word;
`;

export const SubmittedStatusRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

export const SubmittedStatusInfo = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`;

export const SubmittedStatusLabel = styled.div`
  color: ${palette.foreground.primary};
`;

export type SubmittedStatusBadgeVariant =
  | "success"
  | "homePlanSelected"
  | "info"
  | "attention"
  | "neutral";

export const SubmittedStatusBadge = styled.span<{
  $variant: SubmittedStatusBadgeVariant;
  $centered?: boolean;
}>`
  align-items: center;
  background: ${({ $variant }) => {
    switch ($variant) {
      case "success":
      case "homePlanSelected":
        return palette.background.brandLight;
      case "info":
        return palette.misc.catskillWhite;
      case "attention":
        return palette.background.attentionLight;
      default:
        return palette.background.secondary;
    }
  }};
  border-radius: ${borderRadius[8]};
  color: ${({ $variant }) => {
    switch ($variant) {
      case "success":
      case "homePlanSelected":
        return palette.foreground.brand;
      case "info":
        return palette.misc.seaBlue;
      case "attention":
        return palette.foreground.attention;
      default:
        return palette.foreground.primary;
    }
  }};
  display: inline-flex;
  height: 1.5rem;
  justify-content: ${({ $centered }) => ($centered ? "center" : "flex-end")};
  padding: 0 ${spacing[2]};
`;

export const SubmittedStatusBadgeText = styled.span`
  color: inherit;
`;

export const SubmittedTimestamp = styled.div`
  color: ${palette.foreground.secondary};
`;
