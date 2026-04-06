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
  ICON_LABEL_GAP,
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

  & > *:first-child {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > *:last-child {
    flex-shrink: 0;
  }
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

export const FreeTextContent = styled.div`
  ${typography.Sans14}
  font-weight: 500;
  line-height: 150%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
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
  padding: 8px 10px;

  & > span:first-child {
    text-transform: uppercase;
  }
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
  ${typography.Sans14}
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.14px;
  display: flex;
  height: 19px;
  padding: 0 8px;
  align-items: center;
  justify-content: center;
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

// ─── Offender Risk Assessment ─────────────────────────────────────────────────

/** Row container for the 3 indicator boxes + risk level chip. */
export const RiskLevelIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  /* align-self: flex-start on RiskLevelColumnHeader is needed in the column-direction
     summary card to prevent width-stretching, but overrides centering in this row
     context — reset it here so the chip centers with the boxes. */
  & > *:last-child {
    align-self: center;
    margin-left: 4px;
  }
`;

/** Single 10×10 filled/empty box in the risk level indicator. */
export const RiskLevelBox = styled.div<{ $filled: boolean }>`
  width: 10px;
  height: 10px;
  border: 0.556px solid ${customPalette.black};
  background: ${({ $filled }) =>
    $filled ? customPalette.black : palette.white};
`;

/** Body area of a domain subsection — stacks summary text, extra fields, and table. */
export const ReportDomainSectionBody = styled(ColumnFlexContainer).attrs({
  gap: 10,
})`
  padding: 10px;
`;

// ─── History Table ────────────────────────────────────────────────────────────

export const ReportHistoryTableContainer = styled(ColumnFlexContainer)`
  border: 1px solid ${customPalette.black};
`;

export const ReportHistoryTableHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  border-bottom: 1px solid ${customPalette.black};
  ${typography.Sans12}
  font-weight: 500;
`;

export const ReportHistoryTableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  border-bottom: 1px solid ${customPalette.white.white2};
`;

export const ReportHistoryTableCell = styled.div`
  flex: 1;
  ${typography.Sans12}
  font-weight: 500;
`;

export const ReportHistoryTableFootnote = styled.div`
  ${typography.Sans12}
  color: ${customPalette.black};
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.12px;
  align-self: stretch;
  margin-top: 15px;
`;

// ─── Prior Treatment and Programming History ──────────────────────────────────

/** Bold subheading within a section — no border, used for DOC and community subsections. */
export const ReportSubsectionTitle = styled.h4`
  ${typography.Sans14}
  font-weight: 700;
  line-height: 120%;
  letter-spacing: -0.14px;
  margin-bottom: 6px;
`;

/** Flex row of DOC category boxes — wraps if there are more than ~3 categories. */
export const DOCCategoryBoxesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
`;

/** Individual gray category box — grows equally within the row, capped at 30%
 *  so a single box doesn't span the full width. */
export const DOCCategoryBox = styled.div`
  flex: 1 1 0;
  min-width: 180px;
  max-width: 30%;
  display: flex;
  flex-direction: column;
  background: ${palette.slate05};
  padding: 12px 14px;
`;

/** "N Institutional Treatments" heading inside a DOC category box. */
export const DOCCategoryBoxHeader = styled.div`
  ${typography.Sans16}
  font-weight: 600;
  line-height: 150%;
  margin-bottom: 8px;
`;

/** Date or program name row inside a DOC category box. */
export const DOCCategoryBoxItem = styled.div`
  ${typography.Sans12}
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.12px;
`;

/** "and N more" overflow indicator — italic. */
export const DOCCategoryBoxMore = styled.div`
  ${typography.Sans12}
  font-style: italic;
  font-weight: 500;
  line-height: 150%;
  margin-top: 4px;
`;

// ─── Recommendation and Supervision Plan ──────────────────────────────────────

/** Outer gray container for a strategy block (Community or Institutional). */
export const StrategyBox = styled.div`
  display: flex;
  padding: 30px;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  align-self: stretch;
  border-radius: 4px;
  background: ${palette.slate05};
`;

/** "Community Strategies" / "Institutional Strategies" centered heading. */
export const StrategyTitle = styled.h4`
  ${typography.Sans16}
  font-size: 19px;
  font-weight: 600;
  line-height: 24px;
  text-align: center;
  margin: 0;
`;

/** Nested box inside Community Strategies for the Home Plan subsection. */
export const HomePlanBox = styled.div`
  display: flex;
  padding: 16px 16px 30px 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  align-self: stretch;
  border-radius: 4px;
  border: 2px solid ${customPalette.black};
`;

/** Icon + "Home Plan" title row. */
export const HomePlanTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${ICON_LABEL_GAP}px;
`;

/** "Home Plan" heading inside the nested Home Plan box. */
export const HomePlanTitle = styled.h5`
  ${typography.Sans14}
  font-weight: 700;
  line-height: 120%;
  letter-spacing: -0.14px;
  color: ${customPalette.black};
  margin: 0;
`;
