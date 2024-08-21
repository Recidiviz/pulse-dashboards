// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import styled from "styled-components/macro";

import {
  FormColGroup,
  FormEDSectionLabel,
  FormEDSeparator,
} from "./FormComponents";

const LongformSection = styled.div``;

const DeclarationSection = styled.div`
  line-height: 1.3;

  & > div {
    margin-top: 2rem;
  }
`;

const DisabledTextInput = styled.div`
  color: rgb(117, 117, 117);
`;

const SignatureContainer = styled.table`
  margin-top: 1rem;
  border: none;
  width: 100%;
`;

const FilingSection = styled.div`
  font-style: italic;
  line-height: 2;
  margin-top: 1rem;
`;

const SectionLabel = styled(FormEDSectionLabel)`
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  &:first-child {
    margin-top: 1rem;
  }
`;

type SignatureRowProps = {
  signatureOf: string;
};

const SignatureRow = ({
  signatureOf,
}: SignatureRowProps): React.ReactElement => {
  return (
    <SignatureContainer>
      <FormColGroup widths={[22, 24, 48, 6]} />
      <tbody>
        <tr>
          <td>
            <FormEDSeparator />
          </td>
          <td />
          <td>
            <FormEDSeparator />
          </td>
          <td />
        </tr>
        <tr>
          <td>Date</td>
          <td />
          <td>Signature of {signatureOf}</td>
        </tr>
      </tbody>
    </SignatureContainer>
  );
};

export const FormStaticContent: React.FC = () => {
  return (
    <>
      <LongformSection>
        <SectionLabel>Response to Case Planning:</SectionLabel>
        <DisabledTextInput>Fill out in Word</DisabledTextInput>
        <SectionLabel>Request Narrative:</SectionLabel>
        <DisabledTextInput>Fill out in Word</DisabledTextInput>
        <SectionLabel>Attachments:</SectionLabel>
        <DisabledTextInput>Fill out in Word</DisabledTextInput>
      </LongformSection>
      <FormEDSeparator />
      <DeclarationSection>
        <div>
          I declare under penalty of perjury pursuant to the law of the State of
          Idaho that the foregoing is true and correct.
        </div>
        <SignatureRow signatureOf="Probation & Parole Officer" />
        <div>Approved:</div>
        <SignatureRow signatureOf="IDOC District Manager/Designee" />
      </DeclarationSection>
      <FilingSection>
        <div>Filed with the Court and copies provided to:</div>
        <div>Defendant/Defense Counsel</div>
        <div>Prosecutor</div>
        <div>Judge (Courtesy Copy)</div>
      </FilingSection>
    </>
  );
};
