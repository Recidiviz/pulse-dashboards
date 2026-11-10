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

import {
  BodyM1,
  BodyS1,
  borderRadius,
  palette,
  spacing,
} from "../../../../styles";

export const PanelRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const PanelBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[5]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const EmptyStateContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[3]};
  justify-content: center;
  width: 100%;
`;

export const EmptyStateIconWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 2.125rem;
  justify-content: center;
  width: 2.125rem;

  & svg {
    height: 2.125rem;
    width: 2.125rem;

    path {
      stroke: ${palette.foreground.tertiary};
    }
  }
`;

export const EmptyStateText = styled(BodyS1)`
  color: ${palette.foreground.primary};
  max-width: 15.4375rem;
  text-align: center;
`;

export const ApprovalsRow = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  min-height: 1.5rem;
  width: 100%;
`;

export const ApprovalsLabel = styled(BodyM1)`
  color: ${palette.foreground.primary};
  flex: 1;
`;

export type ApprovalsBadgeVariant = "warning" | "success" | "attention";

const badgeBackground: Record<ApprovalsBadgeVariant, string> = {
  attention: palette.background.attentionLight,
  success: palette.background.brandLight,
  warning: palette.background.warningLight,
};

const badgeColor: Record<ApprovalsBadgeVariant, string> = {
  attention: palette.foreground.attention,
  success: palette.foreground.brand,
  warning: palette.foreground.warning,
};

export const ApprovalsBadge = styled.div<{
  $variant: ApprovalsBadgeVariant;
}>`
  align-items: center;
  background: ${({ $variant }) => badgeBackground[$variant]};
  border-radius: ${borderRadius[8]};
  display: flex;
  flex-direction: row;
  flex: none;
  height: 1.5rem;
  justify-content: flex-end;
  padding: 0 ${spacing[2]};
`;

export const ApprovalsBadgeText = styled(BodyS1)<{
  $variant: ApprovalsBadgeVariant;
}>`
  color: ${({ $variant }) => badgeColor[$variant]};
  white-space: nowrap;
`;

export const Divider = styled.hr`
  align-self: stretch;
  border: none;
  border-top: 0.0625rem solid ${palette.border.subtle};
  flex: none;
  margin: 0;
  width: 100%;
`;
