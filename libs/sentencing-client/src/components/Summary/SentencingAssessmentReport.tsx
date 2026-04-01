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

import moment from "moment";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { formatJudgeName } from "../../utils/utils";
import { SARSection } from "../SARDetails/constants";
import { ReportBlock, SentencingAssessmentReportSection } from "./ReportBlock";
import { ReportCharge } from "./ReportCharge";
import { ReportKeyConsiderations } from "./ReportKeyConsiderations";
import { ReportOffenderAssessment } from "./ReportOffenderAssessment";
import { ReportRequestedOf } from "./ReportRequestedOf";
import { BLOCK_GAP, CHIP_GAP } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

interface SentencingAssessmentReportProps {
  presenter: SARDetailsPresenter;
}

export const SentencingAssessmentReport: React.FC<
  SentencingAssessmentReportProps
> = ({ presenter }) => {
  const sarData = presenter.SARData;
  if (!sarData) return null;

  const { externalId, dateRequested, updatedAt, staff } = sarData;
  const charges = sarData.charges;
  const { needsDisplayItems, factorsDisplayItems } = presenter;

  const header = (
    <Styled.Header>
      <Styled.DOCHeader>
        <div> Missouri Department of Corrections </div>
        <div> Division of Probation and Parole </div>
        <div> Sentencing Assessment Report </div>
      </Styled.DOCHeader>
      <Styled.DateTimeHeader>
        <div>{moment().format("MMMM D, YYYY")}</div>
        <div>{moment().format("LTS")}</div>
      </Styled.DateTimeHeader>
    </Styled.Header>
  );

  const caseInformation = (
    <Styled.CaseInformationRow gap={5}>
      <Styled.CaseInformationColumn gap={5}>
        <Styled.CaseInformationLabel>Defendant</Styled.CaseInformationLabel>
        <Styled.CaseInformationValue>
          {presenter.formattedClientName}
        </Styled.CaseInformationValue>
      </Styled.CaseInformationColumn>
      <Styled.CaseInformationColumn gap={5}>
        <Styled.CaseInformationLabel>To</Styled.CaseInformationLabel>
        <Styled.CaseInformationValue>
          {sarData.requestingJudgeName
            ? `Honorable ${formatJudgeName(sarData.requestingJudgeName)}`
            : "—"}{" "}
          / {sarData.division}
        </Styled.CaseInformationValue>
      </Styled.CaseInformationColumn>
      <Styled.CaseInformationColumn gap={5}>
        <Styled.CaseInformationLabel>Case Number</Styled.CaseInformationLabel>
        <Styled.CaseInformationValue>
          #{sarData.externalId}
        </Styled.CaseInformationValue>
      </Styled.CaseInformationColumn>
    </Styled.CaseInformationRow>
  );

  const footer = (
    <Styled.Footer>
      <Styled.FooterMessage>
        Defendant: {presenter.formattedClientName} | Case: #{externalId}
      </Styled.FooterMessage>
      {/*
       * The &nbsp; maintains the element's line height so the footer height
       * measurement during PDF export is accurate. The PDF exporter injects
       * the correct page number before capturing each per-page footer image.
       */}
      <Styled.FooterMessage data-sar-page-number="true">
        &nbsp;
      </Styled.FooterMessage>
    </Styled.Footer>
  );

  const clientChips = (
    <Styled.RowFlexContainer gap={CHIP_GAP}>
      <Styled.ReportChip>Gender: {presenter.formattedGender}</Styled.ReportChip>
      <Styled.ReportChip>
        Race: {presenter.formattedRaceOrEthnicity}
      </Styled.ReportChip>
      <Styled.ReportChip>
        Date of Birth: {presenter.formattedBirthDate}
      </Styled.ReportChip>
    </Styled.RowFlexContainer>
  );

  return (
    <Styled.ReportTable>
      <thead>
        <tr>
          <Styled.HeaderCell>{header}</Styled.HeaderCell>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <Styled.FooterCell>{footer}</Styled.FooterCell>
        </tr>
      </tfoot>
      <tbody>
        <tr>
          <td>
            <Styled.PageContent>
              {caseInformation}
              <ReportRequestedOf
                dateRequested={dateRequested}
                updatedAt={updatedAt}
                staff={staff}
              />
              <SentencingAssessmentReportSection
                title="Offender / Court Information"
                splittable
              >
                <Styled.ColumnFlexContainer gap={BLOCK_GAP}>
                  {clientChips}
                  {charges.map((charge, i) => (
                    <ReportBlock key={charge.id}>
                      <ReportCharge charge={charge} index={i} />
                    </ReportBlock>
                  ))}
                </Styled.ColumnFlexContainer>
              </SentencingAssessmentReportSection>
              <ReportKeyConsiderations
                needsDisplayItems={needsDisplayItems}
                factorsDisplayItems={factorsDisplayItems}
                riskProfileCardData={presenter.riskProfileCardData}
              />
              {sarData.defendantStatement &&
                !presenter.defendantStatementSkipped && (
                  <SentencingAssessmentReportSection
                    title={SARSection.DEFENDANTS_VERSION}
                  >
                    <Styled.FreeTextContent>
                      {sarData.defendantStatement}
                    </Styled.FreeTextContent>
                  </SentencingAssessmentReportSection>
                )}
              {sarData.victimImpactStatement &&
                !presenter.victimImpactStatementSkipped && (
                  <SentencingAssessmentReportSection
                    title={SARSection.VICTIM_IMPACT}
                  >
                    <Styled.FreeTextContent>
                      {sarData.victimImpactStatement}
                    </Styled.FreeTextContent>
                  </SentencingAssessmentReportSection>
                )}
              {sarData.assessmentType && (
                <ReportOffenderAssessment sarData={sarData} />
              )}
            </Styled.PageContent>
          </td>
        </tr>
      </tbody>
    </Styled.ReportTable>
  );
};
