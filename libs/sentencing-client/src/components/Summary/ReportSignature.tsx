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

export interface SignatureData {
  signature: string | null;
  title: string | null;
  lastSignedAt: Date | null;
}

export function isSignatureComplete(
  data: SignatureData,
): data is { signature: string; title: string; lastSignedAt: Date } {
  return !!data.signature && !!data.title && !!data.lastSignedAt;
}

const SignatureBlock: React.FC<{
  data: SignatureData;
  defaultTitle: string;
}> = ({ data, defaultTitle }) => {
  if (isSignatureComplete(data)) {
    return (
      <Styled.SignedSignatureColumn>
        <Styled.SignatureLine />
        <Styled.SignatureRoleLabel>
          /s/ {data.signature}
        </Styled.SignatureRoleLabel>
        <Styled.SignatureRoleLabel>{data.title}</Styled.SignatureRoleLabel>
        <Styled.SignatureRoleLabel>
          Date: {moment(data.lastSignedAt).utc().format("M/D/YY")}
        </Styled.SignatureRoleLabel>
      </Styled.SignedSignatureColumn>
    );
  }

  return (
    <Styled.SignatureColumn>
      <Styled.SignatureLine />
      <Styled.SignatureRoleLabel>{defaultTitle}</Styled.SignatureRoleLabel>
      <Styled.SignatureFieldRow>
        <Styled.SignatureFieldLabel>Printed Name:</Styled.SignatureFieldLabel>
        <Styled.SignatureFieldBlank />
      </Styled.SignatureFieldRow>
      <Styled.SignatureFieldRow>
        <Styled.SignatureFieldLabel>Date:</Styled.SignatureFieldLabel>
        <Styled.SignatureFieldBlank />
      </Styled.SignatureFieldRow>
    </Styled.SignatureColumn>
  );
};

interface ReportSignatureProps {
  officerSignature: SignatureData;
  supervisorSignature: SignatureData;
}

export const ReportSignature: React.FC<ReportSignatureProps> = ({
  officerSignature,
  supervisorSignature,
}) => (
  <ReportBlock>
    <Styled.SignatureContainer>
      <Styled.SignatureSubmittedText>
        Respectfully submitted,
      </Styled.SignatureSubmittedText>
      <Styled.SignatureColumnsRow>
        <SignatureBlock
          data={officerSignature}
          defaultTitle="Probation & Parole Officer"
        />
        <SignatureBlock
          data={supervisorSignature}
          defaultTitle="Unit Supervisor"
        />
      </Styled.SignatureColumnsRow>
      <Styled.SignatureFieldLabel>
        Date Created: {moment().format("M/D/YY")}
      </Styled.SignatureFieldLabel>
    </Styled.SignatureContainer>
  </ReportBlock>
);
