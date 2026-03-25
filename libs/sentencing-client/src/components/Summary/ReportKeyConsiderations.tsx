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

import React from "react";

import AreasOfNeedIcon from "../assets/areas-of-need-icon.svg?react";
import JusticeScaleIcon from "../assets/justice-scale-icon.svg?react";
import { SentencingAssessmentReportSection } from "./ReportBlock";
import {
  ICON_LABEL_GAP,
  SECTION_COLUMN_GAP,
} from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

const KeyConsiderationColumn: React.FC<{
  icon: React.ReactNode;
  label: string;
  items: string[];
}> = ({ icon, label, items }) => (
  <Styled.ColumnFlexContainer>
    <Styled.RowFlexContainer gap={ICON_LABEL_GAP} alignItems="flex-start">
      {icon}
      <Styled.ColumnFlexContainer gap={ICON_LABEL_GAP}>
        <Styled.Label>{label}</Styled.Label>
        {items.length > 0 ? (
          items.map((item) => <Styled.Value key={item}>{item}</Styled.Value>)
        ) : (
          <Styled.Value>None Listed</Styled.Value>
        )}
      </Styled.ColumnFlexContainer>
    </Styled.RowFlexContainer>
  </Styled.ColumnFlexContainer>
);

interface ReportKeyConsiderationsProps {
  needsDisplayItems: string[];
  factorsDisplayItems: string[];
}

export const ReportKeyConsiderations: React.FC<
  ReportKeyConsiderationsProps
> = ({ needsDisplayItems, factorsDisplayItems }) => (
  <SentencingAssessmentReportSection title="Key Considerations">
    <Styled.RowFlexContainer
      gap={SECTION_COLUMN_GAP}
      justifyContent="space-between"
    >
      <KeyConsiderationColumn
        icon={<AreasOfNeedIcon />}
        label="Areas of Need"
        items={needsDisplayItems}
      />
      <KeyConsiderationColumn
        icon={<JusticeScaleIcon />}
        label="Mitigating Risk Factors"
        items={factorsDisplayItems}
      />
    </Styled.RowFlexContainer>
  </SentencingAssessmentReportSection>
);
