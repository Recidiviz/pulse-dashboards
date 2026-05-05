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
import {
  formatBooleanDisplay,
  formatDateRange,
  formatMonthYear,
} from "../../utils/utils";
import { RISK_LEVEL_KEYS, RISK_LEVELS } from "../OffenderAssessment/constants";
import {
  DRUG_HISTORY_COLUMNS,
  formatSubstanceName,
  FrequencyOfUseLabels,
  MethodOfUseLabels,
} from "../OffenderAssessment/SubstanceUse/constants";
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

interface SummaryOffenderAssessmentProps {
  presenter: SARDetailsPresenter;
}

export const SummaryOffenderAssessment: React.FC<SummaryOffenderAssessmentProps> =
  observer(function SummaryOffenderAssessment({ presenter }) {
    const sarData = presenter.SARData;
    const declined = presenter.defendantDeclinedToParticipate;
    const {
      domainsWithoutSubstanceUse,
      groupedByRisk,
      offenderAssessmentDisplay,
    } = presenter.offenderAssessment;
    const { fatherName, motherName, guardianName } = sarData?.client ?? {};

    if (declined) {
      return (
        <Styled.SectionCard>
          <Styled.SectionTitle>Offender Assessment</Styled.SectionTitle>
          <Styled.DetailContainer>
            <Styled.DetailSubsection>
              <Styled.SectionBody>
                <SummaryOrMissing summary={sarData?.defendantStatement} />
              </Styled.SectionBody>
            </Styled.DetailSubsection>
            <Styled.DetailSubsection>
              <Styled.SubsectionTitle>Criminal History</Styled.SubsectionTitle>
              <Styled.SectionBody>
                <SummaryOrMissing summary={sarData?.criminalHistorySummary} />
              </Styled.SectionBody>
            </Styled.DetailSubsection>
          </Styled.DetailContainer>
        </Styled.SectionCard>
      );
    }

    return (
      <Styled.SectionCard>
        <Styled.SectionTitle>Offender Assessment</Styled.SectionTitle>

        {offenderAssessmentDisplay && (
          <Styled.SectionBody>{offenderAssessmentDisplay}</Styled.SectionBody>
        )}

        <Styled.DetailContainer>
          <Styled.DetailSubsection>
            <Styled.SubsectionTitle>
              Substance Abuse History
            </Styled.SubsectionTitle>
            <Styled.SectionBody>
              <div>{sarData?.drugHistorySummary || "None listed"}</div>
              {sarData?.drugHistories && sarData.drugHistories.length > 0 && (
                <Styled.AssessmentTable>
                  <Styled.TableHeaderRow>
                    {DRUG_HISTORY_COLUMNS.map((col) => (
                      <Styled.TableHeaderCell key={col}>
                        {col}
                      </Styled.TableHeaderCell>
                    ))}
                  </Styled.TableHeaderRow>
                  {sarData.drugHistories.map((history) => (
                    <Styled.TableDataRow key={history.id}>
                      <Styled.TableDataCell>
                        {formatSubstanceName(
                          history.substance,
                          history.otherSubstanceName,
                        ) ?? "—"}
                      </Styled.TableDataCell>
                      <Styled.TableDataCell>
                        {history.ageOfRegularUse ?? "—"}
                      </Styled.TableDataCell>
                      <Styled.TableDataCell>
                        {history.lastUse
                          ? formatMonthYear(history.lastUse)
                          : "—"}
                      </Styled.TableDataCell>
                      <Styled.TableDataCell>
                        {history.heaviestUse
                          ? FrequencyOfUseLabels[history.heaviestUse]
                          : "—"}
                      </Styled.TableDataCell>
                      <Styled.TableDataCell>
                        {history.method
                          ? MethodOfUseLabels[history.method]
                          : "—"}
                      </Styled.TableDataCell>
                    </Styled.TableDataRow>
                  ))}
                </Styled.AssessmentTable>
              )}
            </Styled.SectionBody>
          </Styled.DetailSubsection>

          {presenter.offenderAssessment.hasOrasAssessment && (
            <Styled.DetailSubsection>
              <Styled.SubsectionTitle>
                Risk Category Summary
              </Styled.SubsectionTitle>
              <Styled.CategoryRow>
                {RISK_LEVEL_KEYS.map((level) => (
                  <Styled.CategoryColumn key={level}>
                    <Styled.CategoryColumnHeader>
                      Scored {RISK_LEVELS[level]}
                    </Styled.CategoryColumnHeader>
                    <div>{groupedByRisk[level].join(", ") || "—"}</div>
                  </Styled.CategoryColumn>
                ))}
              </Styled.CategoryRow>
            </Styled.DetailSubsection>
          )}

          {domainsWithoutSubstanceUse.map((domain) => {
            const summary =
              presenter.offenderAssessment.getDomainSummary(domain);
            return (
              <Styled.DetailSubsection key={domain.key}>
                <Styled.SubsectionTitle>{domain.title}</Styled.SubsectionTitle>
                <Styled.SectionBody>
                  <SummaryOrMissing
                    summary={summary}
                    labeled={
                      domain.key === "educationEmployment" ||
                      domain.key === "familySocialSupport"
                    }
                  />
                  {domain.key === "educationEmployment" && (
                    <>
                      <div>
                        Highest Level of Education:{" "}
                        {sarData?.levelOfEducation || <MissingBadge />}
                      </div>
                      <div>
                        Employed at Time of Offense:{" "}
                        {sarData?.employedAtOffense !== undefined ? (
                          formatBooleanDisplay(sarData.employedAtOffense)
                        ) : (
                          <MissingBadge />
                        )}
                      </div>
                      {sarData?.employmentHistories &&
                        sarData.employmentHistories.length > 0 && (
                          <Styled.AssessmentTable>
                            <Styled.TableHeaderRow>
                              <Styled.TableHeaderCell>
                                Name of Employer
                              </Styled.TableHeaderCell>
                              <Styled.TableHeaderCell>
                                Start/End Date
                              </Styled.TableHeaderCell>
                              <Styled.TableHeaderCell>
                                Verified by Report Author
                              </Styled.TableHeaderCell>
                            </Styled.TableHeaderRow>
                            {sarData.employmentHistories.map((history) => (
                              <Styled.TableDataRow key={history.id}>
                                <Styled.TableDataCell>
                                  {history.employerName || "—"}
                                </Styled.TableDataCell>
                                <Styled.TableDataCell>
                                  {formatDateRange(
                                    history.startDate,
                                    history.endDate,
                                  )}
                                </Styled.TableDataCell>
                                <Styled.TableDataCell>
                                  {formatBooleanDisplay(
                                    history.verifiedByReportAuthor,
                                  )}
                                </Styled.TableDataCell>
                              </Styled.TableDataRow>
                            ))}
                          </Styled.AssessmentTable>
                        )}
                    </>
                  )}
                  {domain.key === "familySocialSupport" && (
                    <Styled.AssessmentTable>
                      <Styled.FamilyFieldRow>
                        <Styled.FamilyFieldLabel>
                          Father:
                        </Styled.FamilyFieldLabel>
                        {fatherName || <MissingBadge />}
                      </Styled.FamilyFieldRow>
                      <Styled.FamilyFieldRow>
                        <Styled.FamilyFieldLabel>
                          Mother:
                        </Styled.FamilyFieldLabel>
                        {motherName || <MissingBadge />}
                      </Styled.FamilyFieldRow>
                      <Styled.FamilyFieldRow>
                        <Styled.FamilyFieldLabel>
                          Who Raised Offender:
                        </Styled.FamilyFieldLabel>
                        {guardianName || <MissingBadge />}
                      </Styled.FamilyFieldRow>
                    </Styled.AssessmentTable>
                  )}
                </Styled.SectionBody>
              </Styled.DetailSubsection>
            );
          })}
        </Styled.DetailContainer>
      </Styled.SectionCard>
    );
  });
