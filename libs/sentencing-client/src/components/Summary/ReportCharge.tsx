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

import { FormCharge } from "../../datastores/types";
import {
  formatDisplayDate,
  formatInlineClassification,
  formatJudgeAndDivision,
} from "../../utils/utils";
import { CHARGE_FIELD_LABELS } from "../constants";
import { FIELD_ROW_GAP } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

/** Bold label followed inline by its value; long values wrap under the label. */
const ChargeField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <Styled.ReportChargeField>
    <Styled.ReportChargeFieldLabel>{label}</Styled.ReportChargeFieldLabel>{" "}
    {children}
  </Styled.ReportChargeField>
);

interface ReportChargeProps {
  charge: FormCharge;
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
        OFFENSE {index + 1}
        {charge.moCode ? ` — MoCode: ${charge.moCode}` : ""}
      </Styled.ReportChargeHeader>
      <Styled.ReportChargeBody>
        <Styled.ReportChargeColumns>
          <Styled.ReportChargeLeftColumn gap={FIELD_ROW_GAP}>
            <ChargeField label="Offense:">
              {charge.offense || "—"}
              {formatInlineClassification(charge)}
            </ChargeField>
            <ChargeField label="Cause Number:">
              {charge.causeNum || "—"}
            </ChargeField>
            <ChargeField label="County:">{charge.county || "—"}</ChargeField>
            <ChargeField label="Judge / Division:">
              {judgeAndDivision || "—"}
            </ChargeField>
            <ChargeField label={`${CHARGE_FIELD_LABELS.defenseAttorney}:`}>
              {charge.defenseAttorney || "—"}
            </ChargeField>
          </Styled.ReportChargeLeftColumn>
          <Styled.ReportChargeRightColumn gap={FIELD_ROW_GAP}>
            <ChargeField label={`${CHARGE_FIELD_LABELS.prosecutingAttorney}:`}>
              {charge.prosecutingAttorney || "—"}
            </ChargeField>
            <ChargeField label={`${CHARGE_FIELD_LABELS.pleaAgreement}:`}>
              {charge.pleaAgreement || "—"}
            </ChargeField>
            <ChargeField label={`${CHARGE_FIELD_LABELS.pleaDate}:`}>
              {formatDisplayDate(charge.pleaDate)}
            </ChargeField>
            <ChargeField label={`${CHARGE_FIELD_LABELS.sentencingDate}:`}>
              {formatDisplayDate(charge.sentencingDate)}
            </ChargeField>
          </Styled.ReportChargeRightColumn>
        </Styled.ReportChargeColumns>
      </Styled.ReportChargeBody>
    </>
  );
};
