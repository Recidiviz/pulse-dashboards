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

import {
  CONTINUATION_HEADER_CLASS,
  NO_SPLIT_CLASS,
  PAGE_START_CLASS,
} from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

/**
 * Generic keep-together primitive.
 *
 * - `splittable`: when false (default), adds `sar-no-split` so the PDF
 *   generator snaps cuts to this block's boundary rather than splitting it.
 * - `pageStart`: adds `sar-page-start` so the PDF generator forces a cut
 *   immediately before this element, making it always open at the top of a page.
 *   Can be combined with `splittable` when the element's own content may span
 *   multiple pages.
 */
interface ReportBlockProps {
  splittable?: boolean;
  pageStart?: boolean;
  children: React.ReactNode;
}

export const ReportBlock: React.FC<ReportBlockProps> = ({
  splittable,
  pageStart,
  children,
}) => {
  const classes = [
    !splittable ? NO_SPLIT_CLASS : null,
    pageStart ? PAGE_START_CLASS : null,
  ]
    .filter(Boolean)
    .join(" ");

  return splittable ? (
    <div className={classes || undefined}>{children}</div>
  ) : (
    <Styled.ReportBlockContainer className={classes}>
      {children}
    </Styled.ReportBlockContainer>
  );
};

// A ReportBlock with a titled section header, matching the SAR document style.
interface SentencingAssessmentReportSectionProps {
  title: string;
  note?: string;
  splittable?: boolean;
  pageStart?: boolean;
  /**
   * When provided, a second no-split block is rendered immediately after the
   * primary block, with the heading "{title} Continued..." auto-derived from
   * the `title` prop. The PDF generator suppresses this heading when both
   * blocks land on the same page — it only appears when a page break separates
   * them. This makes split-section continuation behavior plug-and-play: pass
   * the overflow content here and the heading text takes care of itself.
   */
  continuationContent?: React.ReactNode;
  children: React.ReactNode;
}

export const SentencingAssessmentReportSection: React.FC<
  SentencingAssessmentReportSectionProps
> = ({ title, note, splittable, pageStart, continuationContent, children }) => (
  <>
    <ReportBlock splittable={splittable} pageStart={pageStart}>
      <Styled.SectionTitleContainer>
        <Styled.SectionTitle>{title}</Styled.SectionTitle>
        {note && <Styled.SectionTitleNote>{note}</Styled.SectionTitleNote>}
      </Styled.SectionTitleContainer>
      {children}
    </ReportBlock>
    {continuationContent && (
      <ReportBlock>
        <div className={CONTINUATION_HEADER_CLASS}>
          <Styled.SectionTitleContainer>
            <Styled.SectionTitle>{title} Continued...</Styled.SectionTitle>
          </Styled.SectionTitleContainer>
        </div>
        {continuationContent}
      </ReportBlock>
    )}
  </>
);
