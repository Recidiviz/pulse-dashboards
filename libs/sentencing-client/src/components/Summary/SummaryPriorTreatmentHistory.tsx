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

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { formatBooleanDisplay, formatDisplayDate } from "../../utils/utils";
import {
  DOC_INCARCERATION_DESCRIPTION,
  MAX_DOC_HISTORIES_PER_CATEGORY,
  TREATMENT_PROGRAM_CATEGORY_LABELS,
} from "../OffenderAssessment/PriorTreatmentHistory/constants";
import { MissingBadge } from "./MissingBadge";
import * as Styled from "./Summary.styles";

const SummaryOrMissing: React.FC<{
  summary: string | null | undefined;
  labeled?: boolean;
}> = ({ summary, labeled = false }) => {
  if (summary) return <div>{summary}</div>;
  if (labeled)
    return (
      <Styled.InlineRow>
        Summary: <MissingBadge />
      </Styled.InlineRow>
    );
  return <MissingBadge />;
};

interface SummaryPriorTreatmentHistoryProps {
  presenter: SARDetailsPresenter;
}

export const SummaryPriorTreatmentHistory: React.FC<SummaryPriorTreatmentHistoryProps> =
  observer(function SummaryPriorTreatmentHistory({ presenter }) {
    const sarData = presenter.SARData;
    const declined = presenter.defendantDeclinedToParticipate;
    const priorTreatmentHistories =
      presenter.priorTreatmentHistory.priorTreatmentHistories;
    const docCategoryEntries =
      presenter.priorTreatmentHistory.DOCTreatmentHistoriesByCategoryEntries;

    const docCategoryContent = (
      <Styled.CategoryRow>
        {docCategoryEntries.map(([category, histories]) => {
          const labels = TREATMENT_PROGRAM_CATEGORY_LABELS[category];
          const label =
            histories.length === 1 ? labels.singular : labels.plural;
          const displayed = histories.slice(0, MAX_DOC_HISTORIES_PER_CATEGORY);
          const remaining = histories.length - displayed.length;
          return (
            <Styled.CategoryColumn key={category}>
              <Styled.CategoryColumnHeader>{label}</Styled.CategoryColumnHeader>
              {displayed.map((history) => (
                <React.Fragment key={history.id}>
                  {history.completedOn && (
                    <div>{formatDisplayDate(history.completedOn)}</div>
                  )}
                  <div>{history.programName}</div>
                </React.Fragment>
              ))}
              {remaining > 0 && (
                <Styled.MoreText>and {remaining} more</Styled.MoreText>
              )}
            </Styled.CategoryColumn>
          );
        })}
      </Styled.CategoryRow>
    );

    if (declined) {
      return (
        <Styled.SectionCard>
          <Styled.SectionTitle>Prior Treatment History</Styled.SectionTitle>
          <Styled.DetailContainer>
            {docCategoryEntries.length > 0 ? (
              <Styled.DetailSubsection>
                <Styled.SubsectionTitle>
                  Department of Corrections Incarceration Program Completion
                  History
                </Styled.SubsectionTitle>
                <Styled.SectionBody>
                  <div>{DOC_INCARCERATION_DESCRIPTION}</div>
                  {docCategoryContent}
                </Styled.SectionBody>
              </Styled.DetailSubsection>
            ) : (
              <Styled.SectionBody>
                No incarceration program completion history on file.
              </Styled.SectionBody>
            )}
          </Styled.DetailContainer>
        </Styled.SectionCard>
      );
    }

    return (
      <Styled.SectionCard>
        <Styled.SectionTitle>Prior Treatment History</Styled.SectionTitle>
        <Styled.DetailContainer>
          <Styled.DetailSubsection>
            <Styled.SubsectionTitle>
              Community Treatments and Programming
            </Styled.SubsectionTitle>
            <Styled.SectionBody>
              <SummaryOrMissing
                summary={sarData?.priorTreatmentHistorySummary}
                labeled
              />
              {priorTreatmentHistories.length > 0 && (
                <Styled.AssessmentTable>
                  <Styled.TableHeaderRow>
                    <Styled.TableHeaderCell>
                      Year Completed
                    </Styled.TableHeaderCell>
                    <Styled.TableHeaderCell>Program</Styled.TableHeaderCell>
                    <Styled.TableHeaderCell>
                      Verified by Report Author
                    </Styled.TableHeaderCell>
                  </Styled.TableHeaderRow>
                  {priorTreatmentHistories.map((history) => (
                    <Styled.TableDataRow key={history.id}>
                      <Styled.TableDataCell>
                        {history.yearCompleted ?? "—"}
                      </Styled.TableDataCell>
                      <Styled.TableDataCell>
                        {history.programName ?? "—"}
                      </Styled.TableDataCell>
                      <Styled.TableDataCell>
                        {formatBooleanDisplay(history.verifiedByReportAuthor)}
                      </Styled.TableDataCell>
                    </Styled.TableDataRow>
                  ))}
                </Styled.AssessmentTable>
              )}
            </Styled.SectionBody>
          </Styled.DetailSubsection>

          {docCategoryEntries.length > 0 && (
            <Styled.DetailSubsection>
              <Styled.SubsectionTitle>
                Department of Corrections Incarceration Program Completion
                History
              </Styled.SubsectionTitle>
              <Styled.SectionBody>
                <div>{DOC_INCARCERATION_DESCRIPTION}</div>
                {docCategoryContent}
              </Styled.SectionBody>
            </Styled.DetailSubsection>
          )}
        </Styled.DetailContainer>
      </Styled.SectionCard>
    );
  });
