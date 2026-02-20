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
import moment from "moment";
import React from "react";

import { PriorTreatmentHistoryPresenter } from "../../../presenters/PriorTreatmentHistoryPresenter";
import { SkippableTextArea } from "../../shared/SkippableTextArea";
import { SectionTitle } from "../../shared/styles/SectionStyles";
import { TREATMENT_PROGRAM_CATEGORY_LABELS } from "./constants";
import {
  DOCPriorTreatmentCategory,
  DOCPriorTreatmentCategoryContainer,
  DOCPriorTreatmentCategoryContent,
  DOCPriorTreatmentCategoryHeader,
  DOCPriorTreatmentHistorySubheader,
  PriorTreatmentHistorySectionContainer,
  PriorTreatmentSection,
} from "./PriorTreatmentHistory.styles";
import { PriorTreatmentHistoryCard } from "./PriorTreatmentHistoryCard";
import { TreatmentProgramCategory } from "./types";

const MAX_DISPLAYED_HISTORIES = 2;

interface PriorTreatmentHistorySectionProps {
  presenter: PriorTreatmentHistoryPresenter;
}

export const PriorTreatmentHistorySection: React.FC<PriorTreatmentHistorySectionProps> =
  observer(function PriorTreatmentHistorySection({ presenter }) {
    const docHistoriesByCategory = presenter.DOCTreatmentHistoriesByCategory;
    const hasDOCHistories = Object.values(docHistoriesByCategory).some(
      (histories) => histories.length > 0,
    );

    return (
      <PriorTreatmentHistorySectionContainer>
        <PriorTreatmentSection>
          <SectionTitle>Prior Community Treatment History</SectionTitle>
          <PriorTreatmentHistoryCard presenter={presenter} />
          <SkippableTextArea
            label="Summary"
            value={presenter.SARData?.priorTreatmentHistorySummary ?? null}
            onChange={(value) =>
              presenter.updatePriorTreatmentHistorySummary(value)
            }
            onLocalChange={() => presenter.markAsEdited()}
            placeholder="Please enter a summary of prior treatment history"
            height="6.8125rem"
          />
        </PriorTreatmentSection>
        {hasDOCHistories && (
          <PriorTreatmentSection>
            <SectionTitle>
              Department of Corrections Program Completion History
            </SectionTitle>
            <DOCPriorTreatmentHistorySubheader>
              The treatments below are pulled from DOC records and are just for
              review. They will appear in the report along with any community
              treatments you add.
            </DOCPriorTreatmentHistorySubheader>
            <DOCPriorTreatmentCategoryContainer>
              {Object.entries(docHistoriesByCategory).map(
                ([category, histories]) => {
                  if (histories.length === 0) return null;
                  const labels =
                    TREATMENT_PROGRAM_CATEGORY_LABELS[
                      category as TreatmentProgramCategory
                    ];
                  const label =
                    histories.length === 1 ? labels.singular : labels.plural;
                  return (
                    <DOCPriorTreatmentCategory key={category}>
                      <DOCPriorTreatmentCategoryHeader>
                        {histories.length} {label}
                      </DOCPriorTreatmentCategoryHeader>
                      {histories
                        .slice(0, MAX_DISPLAYED_HISTORIES)
                        .map((history) => {
                          const completedDate = history.completedOn
                            ? moment(history.completedOn)
                                .utc()
                                .format("MM/DD/YY")
                            : null;
                          return (
                            <React.Fragment key={history.id}>
                              {completedDate && (
                                <DOCPriorTreatmentCategoryContent>
                                  {completedDate}
                                </DOCPriorTreatmentCategoryContent>
                              )}
                              <DOCPriorTreatmentCategoryContent>
                                {history.programName}
                              </DOCPriorTreatmentCategoryContent>
                            </React.Fragment>
                          );
                        })}
                      {histories.length > MAX_DISPLAYED_HISTORIES && (
                        <DOCPriorTreatmentCategoryContent>
                          + {histories.length - MAX_DISPLAYED_HISTORIES} more
                        </DOCPriorTreatmentCategoryContent>
                      )}
                    </DOCPriorTreatmentCategory>
                  );
                },
              )}
            </DOCPriorTreatmentCategoryContainer>
          </PriorTreatmentSection>
        )}
      </PriorTreatmentHistorySectionContainer>
    );
  });
