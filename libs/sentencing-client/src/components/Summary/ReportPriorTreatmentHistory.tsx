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

import { observer } from "mobx-react-lite";
import React from "react";

import { PriorTreatmentHistoryPresenter } from "../../presenters/PriorTreatmentHistoryPresenter";
import { formatDisplayDate } from "../../utils/utils";
import { TREATMENT_PROGRAM_CATEGORY_LABELS } from "../OffenderAssessment/PriorTreatmentHistory/constants";
import {
  DOCTreatmentHistory,
  TreatmentProgramCategory,
} from "../OffenderAssessment/PriorTreatmentHistory/types";
import { ReportBlock } from "./ReportBlock";
import { ReportPriorTreatmentHistoryTable } from "./ReportHistoryTable";
import {
  BLOCK_GAP,
  CONTINUATION_HEADER_CLASS,
} from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

const SECTION_TITLE = "Prior Treatment and Programming History";
const CONTINUATION_TITLE = `${SECTION_TITLE} Continued...`;

const DOC_INCARCERATION_DESCRIPTION =
  "The defendant has participated in the following treatments/programs while previously incarcerated. Records limited to DOC-tracked programming only. This summary does not account for external, private, or non-DOC-affiliated services completed by the defendant.";

const COMMUNITY_TREATMENT_DESCRIPTION =
  "The defendant has shared that they participated in the following community based treatments/programs.";

const MAX_DISPLAYED_PER_CATEGORY = 5;

/** Renders a "Continued..." heading as the first child of a block. Hidden by the
 *  PDF generator when no page break precedes this block. */
const ContinuationHeader: React.FC = () => (
  <div className={CONTINUATION_HEADER_CLASS}>
    <Styled.SectionTitleContainer>
      <Styled.SectionTitle>{CONTINUATION_TITLE}</Styled.SectionTitle>
    </Styled.SectionTitleContainer>
  </div>
);

interface ReportPriorTreatmentHistoryProps {
  presenter: PriorTreatmentHistoryPresenter;
}

export const ReportPriorTreatmentHistory: React.FC<ReportPriorTreatmentHistoryProps> =
  observer(function ReportPriorTreatmentHistory({ presenter }) {
    const categorized = Object.entries(
      presenter.DOCTreatmentHistoriesByCategory,
    ).filter(
      (entry): entry is [TreatmentProgramCategory, DOCTreatmentHistory[]] =>
        entry[1] !== undefined,
    );
    const hasDOC = categorized.length > 0;
    const communityHistories = presenter.priorTreatmentHistories;
    const treatmentSummary = presenter.SARData?.priorTreatmentHistorySummary;
    const hasCommunity = communityHistories.length > 0 || !!treatmentSummary;

    if (!hasDOC && !hasCommunity) return null;

    // All blocks are flattened as direct siblings so measureContinuationHeaders
    // can find the preceding sar-no-split block via previousElementSibling.
    return (
      <Styled.ColumnFlexContainer gap={BLOCK_GAP / 2}>
        <ReportBlock>
          <Styled.SectionTitleContainer>
            <Styled.SectionTitle>{SECTION_TITLE}</Styled.SectionTitle>
          </Styled.SectionTitleContainer>
        </ReportBlock>

        {hasDOC && (
          <>
            <ReportBlock>
              <ContinuationHeader />
              <Styled.ReportSubsectionTitle>
                Department of Corrections Incarceration Program Completion
                History
              </Styled.ReportSubsectionTitle>
              <Styled.FreeTextContent>
                {DOC_INCARCERATION_DESCRIPTION}
              </Styled.FreeTextContent>
            </ReportBlock>
            <ReportBlock>
              <ContinuationHeader />
              <Styled.DOCCategoryBoxesContainer>
                {categorized.map(([category, histories]) => {
                  const labels = TREATMENT_PROGRAM_CATEGORY_LABELS[category];
                  const label =
                    histories.length === 1 ? labels.singular : labels.plural;
                  const visible = histories.slice(
                    0,
                    MAX_DISPLAYED_PER_CATEGORY,
                  );
                  const overflow =
                    histories.length - MAX_DISPLAYED_PER_CATEGORY;
                  return (
                    <Styled.DOCCategoryBox key={category}>
                      <Styled.DOCCategoryBoxHeader>
                        {histories.length} {label}
                      </Styled.DOCCategoryBoxHeader>
                      {visible.map((h) => (
                        <React.Fragment key={h.id}>
                          {h.completedOn && (
                            <Styled.DOCCategoryBoxItem>
                              {formatDisplayDate(h.completedOn)}
                            </Styled.DOCCategoryBoxItem>
                          )}
                          <Styled.DOCCategoryBoxItem>
                            {h.programName}
                          </Styled.DOCCategoryBoxItem>
                        </React.Fragment>
                      ))}
                      {overflow > 0 && (
                        <Styled.DOCCategoryBoxMore>
                          and {overflow} more
                        </Styled.DOCCategoryBoxMore>
                      )}
                    </Styled.DOCCategoryBox>
                  );
                })}
              </Styled.DOCCategoryBoxesContainer>
            </ReportBlock>
          </>
        )}

        {hasCommunity && (
          <ReportBlock>
            <ContinuationHeader />
            <Styled.ColumnFlexContainer gap={10}>
              <Styled.ReportSubsectionTitle>
                Community Treatments and Programming
              </Styled.ReportSubsectionTitle>
              {treatmentSummary && (
                <Styled.FreeTextContent>
                  {treatmentSummary}
                </Styled.FreeTextContent>
              )}
              {communityHistories.length > 0 && (
                <>
                  <Styled.FreeTextContent>
                    {COMMUNITY_TREATMENT_DESCRIPTION}
                  </Styled.FreeTextContent>
                  <ReportPriorTreatmentHistoryTable
                    priorTreatmentHistories={communityHistories}
                  />
                </>
              )}
            </Styled.ColumnFlexContainer>
          </ReportBlock>
        )}
      </Styled.ColumnFlexContainer>
    );
  });
