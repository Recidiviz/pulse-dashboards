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

import { typography } from "@recidiviz/design-system";
import { Property } from "csstype";
import styled from "styled-components";

import { palette } from "~design-system";

import { customPalette } from "../styles/palette";
import {
  BLOCK_GAP,
  CHARGE_COLUMN_PADDING,
} from "./SentencingAssessmentReport.constants";

// Table-based layout so <thead> and <tfoot> repeat on every printed page.
export const ReportTable = styled.table`
  width: 926px;
  color: ${customPalette.black};
  border-collapse: collapse;
`;

export const HeaderCell = styled.td`
  padding: 0;
`;

export const FooterCell = styled.td`
  padding: 0;
`;

export const Header = styled.div`
  ${typography.Sans12}
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 63px 50px 20px;
  font-style: normal;
`;

export const HeaderContainers = styled.div`
  display: flex;
  flex-direction: column;
`;

export const DOCHeader = styled(HeaderContainers)`
  font-weight: 600;
  letter-spacing: -0.12px;
`;

export const DateTimeHeader = styled(HeaderContainers)`
  font-weight: 500;
  letter-spacing: -0.115px;
`;

export const Footer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  border-top: 1.513px solid ${palette.slate30};
`;

export const FooterMessage = styled.div`
  ${typography.Sans12}
  font-weight: 500;
  line-height: 150%;
  padding: 10px 50px;
`;

export const PageContent = styled.div`
  padding: 0 50px 60px;
  display: flex;
  gap: ${BLOCK_GAP}px;
  flex-direction: column;
`;

export const SectionTitleContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-style: normal;
  flex-direction: row;
  border-bottom: 2px solid ${customPalette.black};
  margin-bottom: 15px;
  padding-bottom: 2px;
`;

export const SectionTitle = styled.h3`
  ${typography.Sans14}
  font-weight: 700;
  line-height: 120%; /* 16.8px */
  text-transform: uppercase;
`;

export const SectionTitleNote = styled.div`
  ${typography.Sans12}
  font-weight: 500;
  line-height: 150%;
`;

export const ColumnFlexContainer = styled.div<{ gap?: number; flex?: string }>`
  display: flex;
  flex-direction: column;
  flex: ${({ flex }) => flex ?? "1 1 auto"};
  ${({ gap }) => gap !== undefined && `gap: ${gap}px;`}
`;

export const RowFlexContainer = styled.div<{
  gap?: number;
  justifyContent?: Property.JustifyContent;
  alignItems?: Property.AlignItems;
}>`
  display: flex;
  flex-direction: row;
  align-items: ${({ alignItems }) => alignItems ?? "baseline"};
  justify-content: ${({ justifyContent }) => justifyContent ?? "flex-start"};
  ${({ gap }) => gap !== undefined && `gap: ${gap}px;`}
`;

export const Label = styled.div`
  ${typography.Sans14}
  font-weight: 700;
  line-height: 120%; /* 16.8px */
  flex-shrink: 0;
  letter-spacing: -0.14px;
  white-space: nowrap;
`;

export const Value = styled.div`
  ${typography.Sans14}
  font-weight: 500;
  line-height: 150%; /* 21px */
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
`;

export const ReportChip = styled.div`
  padding: 6.052px 12.105px;
  justify-content: center;
  align-items: center;
  border-radius: 6.052px;
  border: 0.757px solid ${customPalette.black};
`;

export const ReportBlockContainer = styled.div`
  @media print {
    break-inside: avoid;
  }
`;

/** Row container for the charge card two-column layout. */
export const ReportChargeColumns = styled(RowFlexContainer)`
  width: 100%;
`;

/** Left column of the charge card — always at least 50% wide so the right
 *  column starts at the midpoint; capped at 65% so long offense names wrap. */
export const ReportChargeLeftColumn = styled(ColumnFlexContainer)`
  min-width: 50%;
  max-width: 60%;
  padding-left: ${CHARGE_COLUMN_PADDING}px;
`;

/** Right column of the charge card — content-sized, never smushed. */
export const ReportChargeRightColumn = styled(ColumnFlexContainer)`
  min-width: 0;
  padding-left: ${CHARGE_COLUMN_PADDING}px;
`;

export const ReportChargeHeader = styled.div`
  background: ${palette.slate05};
  display: flex;
  padding: 5px;
  align-items: center;
  align-self: stretch;
  ${typography.Sans12}
  font-weight: 500;
  line-height: 150%;
`;

export const ReportChargeBody = styled(ColumnFlexContainer).attrs({ gap: 15 })`
  border: 1px solid ${palette.slate05};
  padding: 15px 10px 10px 0;
`;

/** Row displaying key case metadata (defendant, judge/division, case number). */
export const CaseInformationRow = styled(RowFlexContainer)`
  border-radius: 4px;
  border: 0.5px solid ${customPalette.black};
  align-items: flex-start;
  align-self: stretch;
`;

export const CaseInformationColumn = styled(ColumnFlexContainer)`
  border-left: 0.5px solid ${customPalette.black};
  padding: 10px 16px;

  &:first-child {
    border-left: none;
  }
`;

export const CaseInformationLabel = styled.div`
  color: ${customPalette.black};
  font-size: 9px;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.09px;
`;

export const CaseInformationValue = styled.div`
  color: ${customPalette.black};
  font-size: 20px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: -0.4px;
`;

// ─── Risk Profile Summary Card ────────────────────────────────────────────────

/** Card header with title on left, metadata on right. */
export const ReportCardHeader = styled.div`
  ${typography.Sans12}
  font-weight: 500;
  line-height: 150%;
  background: ${palette.slate05};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
`;

export const RiskLevelColumnsContainer = styled.div`
  display: flex;
  padding-top: 10px;
`;

export const RiskLevelColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
`;

export const RiskLevelColumnHeader = styled.div<{
  $bgColor: string;
  $textColor: string;
}>`
  ${typography.Sans12}
  font-weight: 600;
  line-height: 1;
  display: flex;
  height: 19px;
  padding: 0 8px;
  align-items: center;
  border-radius: 100px;
  align-self: flex-start;
  background: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
`;

export const RiskLevelDomainItem = styled.div`
  ${typography.Sans12}
  font-weight: 500;
  line-height: 150%;
`;
