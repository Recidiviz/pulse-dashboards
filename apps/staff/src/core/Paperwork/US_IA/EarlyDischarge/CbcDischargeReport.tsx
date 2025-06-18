// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { PrintablePage, PrintablePageMargin } from "../../styles";
import { FormPage } from "./constants";
import { FormUsIaEarlyDischargeInput } from "./FormComponents";

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: ${rem(56)};
`;

const DocRow = styled.div`
  font-size: ${rem(12)};
`;

const ReportNameRow = styled.div`
  font-size: ${rem(11.5)};
`;

function FormHeader() {
  return (
    <HeaderContainer>
      <DocRow>DEPARTMENT OF CORRECTIONS</DocRow>
      <ReportNameRow>CBC DISCHARGE REPORT</ReportNameRow>
    </HeaderContainer>
  );
}

const ClientDetailsTable = styled.table`
  margin-top: ${rem(14)};
  width: fit-content;
`;

function ClientDetails() {
  return (
    <ClientDetailsTable>
      <tbody>
        <tr>
          <td>Date:</td>
          <td>
            <FormUsIaEarlyDischargeInput name="todaysDate" />
          </td>
        </tr>
        <tr>
          <td>ICON #:</td>
          <td>
            <FormUsIaEarlyDischargeInput name="iconNumber" />
          </td>
        </tr>
        <tr>
          <td>NAME:</td>
          <td>
            <FormUsIaEarlyDischargeInput name="clientFullName" />
          </td>
        </tr>
        <tr>
          <td>CITIZENSHIP STATUS:</td>
          <td>
            <FormUsIaEarlyDischargeInput name="usCitizenshipStatus" />
          </td>
        </tr>
      </tbody>
    </ClientDetailsTable>
  );
}

const ChargeDetailsTable = styled.table`
  margin-top: ${rem(12)};
  width: 92%;
  table-layout: fixed;

  & thead {
    line-height: 112%;
  }

  & span {
    padding: ${rem(spacing.xxs)};
  }
`;

function ChargeTable() {
  return (
    <ChargeDetailsTable>
      <thead>
        <tr>
          <th>Jurisdiction Cause Number Offense Description </th>
          <th>Charge Count Class TDD</th>
          <th>Supervision Status Start Date</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <FormUsIaEarlyDischargeInput name="jurisdiction" />
            <FormUsIaEarlyDischargeInput name="causeNumber" />
            {/* TODO: make the description input multi-line */}
            <FormUsIaEarlyDischargeInput name="description" />
          </td>
          <td>
            <FormUsIaEarlyDischargeInput name="counts" />
            <FormUsIaEarlyDischargeInput name="statute" />
          </td>
          <td>
            <FormUsIaEarlyDischargeInput name="supervisionType" />
            <FormUsIaEarlyDischargeInput name="supervisionStartDate" />
          </td>
        </tr>
      </tbody>
    </ChargeDetailsTable>
  );
}

const SentenceInformationContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${rem(30)};
`;

const SectionHeader = styled.div`
  margin-top: ${rem(6)};
  font-weight: 600;
`;

function SentenceAndProgressInformation() {
  return (
    <SentenceInformationContainer>
      <SectionHeader>
        Sentence Date Penalty Type Penalty Value Penalty Modifier
      </SectionHeader>
      <div>
        SENTENCE_DATE <FormUsIaEarlyDischargeInput name="sentencePenaltyType" />{" "}
        <FormUsIaEarlyDischargeInput name="penaltyDays" />,
        <FormUsIaEarlyDischargeInput name="penaltyMonths" />,
        <FormUsIaEarlyDischargeInput name="penaltyYears" />{" "}
        <FormUsIaEarlyDischargeInput name="sentencePenaltyModifier" />
        <SectionHeader>
          Progress of Supervision/Restitution Status/Recommendations:
        </SectionHeader>
        <div>TODO: Add statuses</div>
      </div>
    </SentenceInformationContainer>
  );
}

const SubmissionAndSignatureTable = styled.table`
  width: 80%;
  margin-top: ${rem(30)};
`;

function SubmissionAndSignature() {
  return (
    <SubmissionAndSignatureTable>
      <colgroup>
        <col style={{ width: "50%" }} />
        <col style={{ width: "50%" }} />
      </colgroup>
      <thead>
        <tr>
          <td>Respectfully submitted,</td>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <br />
            <br />
            Signature will go here
            <br />
            <br />
            <FormUsIaEarlyDischargeInput name="officerFullName" />
            <FormUsIaEarlyDischargeInput name="staffTitle" />
            <FormUsIaEarlyDischargeInput name="workUnit" />
          </td>
          <td>
            Region/Work Unit: <FormUsIaEarlyDischargeInput name="workUnit" />
            Distribution: Judge{" "}
            <FormUsIaEarlyDischargeInput name="judgeFullName" />, County
            Attorney <FormUsIaEarlyDischargeInput name="prosecutingAttorneys" />
            , File // Parolee, File{" "}
            <FormUsIaEarlyDischargeInput name="officerFullName" />{" "}
            <FormUsIaEarlyDischargeInput name="staffTitle" />
          </td>
        </tr>
      </tbody>
    </SubmissionAndSignatureTable>
  );
}

const FooterContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
`;

const FooterText = styled.div`
  color: #757575;
  font-size: ${rem(9)};
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterText>
        0000000 - <FormUsIaEarlyDischargeInput name="clientFullName" /> Page 1
        of 1 <FormUsIaEarlyDischargeInput name="todaysDate" />
      </FooterText>
    </FooterContainer>
  );
}

export const CbcDischargeReport = () => {
  return (
    <PrintablePageMargin>
      <PrintablePage>
        <FormPage>
          <FormHeader />
          <ClientDetails />
          <ChargeTable />
          <SentenceAndProgressInformation />
          <SubmissionAndSignature />
          <Footer />
        </FormPage>
      </PrintablePage>
    </PrintablePageMargin>
  );
};
