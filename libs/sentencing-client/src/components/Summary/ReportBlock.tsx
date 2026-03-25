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

import { NO_SPLIT_CLASS } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

// Generic keep-together primitive. `splittable` controls whether this block
// can be split across PDF pages; non-splittable blocks carry the `sar-no-split`
// class so the PDF generator can snap page cuts to their boundaries.
interface ReportBlockProps {
  splittable?: boolean;
  children: React.ReactNode;
}

export const ReportBlock: React.FC<ReportBlockProps> = ({
  splittable,
  children,
}) =>
  splittable ? (
    <div>{children}</div>
  ) : (
    <Styled.ReportBlockContainer className={NO_SPLIT_CLASS}>
      {children}
    </Styled.ReportBlockContainer>
  );

// A ReportBlock with a titled section header, matching the SAR document style.
interface SentencingAssessmentReportSectionProps {
  title: string;
  note?: string;
  splittable?: boolean;
  children: React.ReactNode;
}

export const SentencingAssessmentReportSection: React.FC<
  SentencingAssessmentReportSectionProps
> = ({ title, note, splittable, children }) => (
  <ReportBlock splittable={splittable}>
    <Styled.SectionTitleContainer>
      <Styled.SectionTitle>{title}</Styled.SectionTitle>
      {note && <Styled.SectionTitleNote>{note}</Styled.SectionTitleNote>}
    </Styled.SectionTitleContainer>
    {children}
  </ReportBlock>
);
