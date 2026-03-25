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

import { Charge } from "../../datastores/types";
import {
  formatDisplayDate,
  formatInlineClassification,
  formatJudgeAndDivision,
} from "../../utils/utils";
import { FIELD_ROW_GAP } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

interface ReportChargeProps {
  charge: Charge;
  index: number;
}

export const ReportCharge: React.FC<ReportChargeProps> = ({
  charge,
  index,
}) => {
  const judgeAndDivision = formatJudgeAndDivision(charge);

  return (
    <>
      <Styled.ReportChargeHeader>
        Offense {index + 1}
        {charge.moCode ? ` — MoCode: ${charge.moCode}` : ""}
      </Styled.ReportChargeHeader>
      <Styled.ReportChargeBody>
        <Styled.ReportChargeColumns>
          <Styled.ReportChargeLeftColumn gap={FIELD_ROW_GAP}>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Offense:</Styled.Label>
              <Styled.Value>
                {charge.offense || "—"}
                {formatInlineClassification(charge)}
              </Styled.Value>
            </Styled.RowFlexContainer>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Cause Number:</Styled.Label>
              <Styled.Value>{charge.causeNum || "—"}</Styled.Value>
            </Styled.RowFlexContainer>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>County:</Styled.Label>
              <Styled.Value>{charge.county || "—"}</Styled.Value>
            </Styled.RowFlexContainer>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Judge / Division:</Styled.Label>
              <Styled.Value>{judgeAndDivision || "—"}</Styled.Value>
            </Styled.RowFlexContainer>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Defense Attorney:</Styled.Label>
              <Styled.Value>{charge.defenseAttorney || "—"}</Styled.Value>
            </Styled.RowFlexContainer>
          </Styled.ReportChargeLeftColumn>
          <Styled.ReportChargeRightColumn gap={FIELD_ROW_GAP}>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Plea Agreement:</Styled.Label>
              <Styled.Value>{charge.pleaAgreement || "—"}</Styled.Value>
            </Styled.RowFlexContainer>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Date of Plea:</Styled.Label>
              <Styled.Value>{formatDisplayDate(charge.pleaDate)}</Styled.Value>
            </Styled.RowFlexContainer>
            <Styled.RowFlexContainer gap={FIELD_ROW_GAP}>
              <Styled.Label>Date of Sentencing:</Styled.Label>
              <Styled.Value>
                {formatDisplayDate(charge.sentencingDate)}
              </Styled.Value>
            </Styled.RowFlexContainer>
          </Styled.ReportChargeRightColumn>
        </Styled.ReportChargeColumns>
      </Styled.ReportChargeBody>
    </>
  );
};
