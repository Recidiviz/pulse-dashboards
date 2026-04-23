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

import { ReportBlock } from "./ReportBlock";
import * as Styled from "./SentencingAssessmentReport.styles";

const SignatureColumn: React.FC<{
  title: string;
  children?: React.ReactNode;
}> = ({ title, children }) => (
  <Styled.SignatureColumn>
    <Styled.SignatureLine />
    <Styled.SignatureRoleLabel>{title}</Styled.SignatureRoleLabel>
    <Styled.SignatureFieldRow>
      <Styled.SignatureFieldLabel>Printed Name:</Styled.SignatureFieldLabel>
      <Styled.SignatureFieldBlank />
    </Styled.SignatureFieldRow>
    <Styled.SignatureFieldRow>
      <Styled.SignatureFieldLabel>Date:</Styled.SignatureFieldLabel>
      <Styled.SignatureFieldBlank />
    </Styled.SignatureFieldRow>
    {children}
  </Styled.SignatureColumn>
);

export const ReportSignature: React.FC = () => (
  <ReportBlock>
    <Styled.SignatureContainer>
      <Styled.SignatureSubmittedText>
        Respectfully submitted,
      </Styled.SignatureSubmittedText>
      <Styled.SignatureColumnsRow>
        <SignatureColumn title="Probation & Parole Officer">
          <Styled.SignatureFieldLabel>
            Date Created: {moment().format("M/D/YY")}
          </Styled.SignatureFieldLabel>
        </SignatureColumn>
        <SignatureColumn title="Unit Supervisor" />
      </Styled.SignatureColumnsRow>
    </Styled.SignatureContainer>
  </ReportBlock>
);
