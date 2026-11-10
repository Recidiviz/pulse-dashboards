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
import { buttonOutline } from "../../../common/StyledComponents";

/* ── Section shared ────────────────────────────────────── */

export const SectionTitle = styled(BodyM1)`
  color: ${palette.foreground.primary};
  font-weight: 500;
`;

export const SectionSubtitle = styled(BodyS1)`
  color: ${palette.misc.black};
  font-weight: 500;
`;

/* ── Approvals ─────────────────────────────────────────── */

export const ApprovalsSection = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  width: 100%;
`;

export const ApprovalsSummary = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  width: 100%;
`;

export const ApprovalsSummaryRow = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export const DecisionGroup = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

// Wraps rather than scrolls: the panel lives inside a resizable modal, so the
// chip rows have no fixed width to lay out against.
export const ChipRow = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[2]};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  width: 100%;
`;

export const ApprovalsSaveButton = styled.button<{ $active: boolean }>`
  ${buttonOutline}
  align-items: center;
  background: ${({ $active }) =>
    $active ? palette.background.brand : palette.background.disabled};
  border-radius: ${borderRadius.round};
  color: ${palette.foreground.onBrand};
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
  display: flex;
  flex: none;
  font-family: "Inter", Helvetica, sans-serif;
  font-size: 14px;
  font-weight: 600;
  gap: ${spacing[2]};
  height: 2rem;
  justify-content: center;
  letter-spacing: -0.28px;
  line-height: 1rem;
  padding: 0 ${spacing[3]};
  white-space: nowrap;
`;
