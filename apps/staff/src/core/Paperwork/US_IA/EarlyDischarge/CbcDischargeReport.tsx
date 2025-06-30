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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import { FormPage } from "./constants";
import {
  FormUsIaEarlyDischargeInput,
  FormUsIaEarlyDischargeTextArea,
} from "./FormComponents";

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
  border-top: 1px solid black;
  border-bottom: 1px solid black;
  margin-top: ${rem(14)};
  width: 100%;
`;

function ClientDetails() {
  return (
    <ClientDetailsTable>
      <colgroup>
        <col style={{ width: "22%" }} />
        <col style={{ width: "78%" }} />
      </colgroup>
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
        <tr>
          <td />
          <td />
        </tr>
      </tbody>
    </ClientDetailsTable>
  );
}

const ChargeDetailsTable = styled.table`
  margin-top: 0.5rem;
  width: 100%;
  table-layout: fixed;

  &:last-child {
    border-bottom: 1px solid black;
  }

  & thead {
    line-height: 112%;
  }

  & span {
    padding: ${rem(spacing.xxs)};
  }

  & textarea {
    width: 90%;
    font-family: Arial, sans-serif;
  }
`;

const CHARGE_DETAILS_TABLE_COL_WIDTHS = [21, 23, 15, 27, 14];

function ChargeTableCol({ colNumbers }: { colNumbers: number[] }) {
  let width = 0;
  colNumbers.forEach((colNumber) => {
    width += CHARGE_DETAILS_TABLE_COL_WIDTHS[colNumber];
  });
  return <col style={{ width: `${width}%` }} />;
}

function ChargeTable({
  form,
  chargeNumber,
}: {
  form: UsIaEarlyDischargeForm;
  chargeNumber: number;
}) {
  const { formData } = form;

  const chargeExternalId = formData[`chargeExternalId${chargeNumber}`];
  const penaltyIds = [];

  for (let i = 0; i < (formData.numberOfPenalties ?? 0); i++) {
    if (formData[`penaltyChargeExternalId${i}`] === chargeExternalId) {
      penaltyIds.push(i);
    }
  }

  return (
    <div>
      <ChargeDetailsTable>
        <colgroup>
          <ChargeTableCol colNumbers={[0]} />
          <ChargeTableCol colNumbers={[1]} />
          <ChargeTableCol colNumbers={[2]} />
          <ChargeTableCol colNumbers={[3]} />
          <ChargeTableCol colNumbers={[4]} />
        </colgroup>
        <thead>
          <tr>
            <th>Jurisdiction</th>
            <th>Cause Number</th>
            <th>Charge Count</th>
            <th>Class</th>
            <th>TDD</th>
          </tr>
          <tr>
            <th>Offense Description</th>
            <th />
            <th />
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <FormUsIaEarlyDischargeInput
                name={`jurisdiction${chargeNumber}`}
              />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput
                name={`causeNumber${chargeNumber}`}
              />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput name={`counts${chargeNumber}`} />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput
                name={`classificationTypeRawText${chargeNumber}`}
              />
            </td>
            <td>
              <FormUsIaEarlyDischargeTextArea name={`tdd${chargeNumber}`} />
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <FormUsIaEarlyDischargeTextArea
                name={`description${chargeNumber}`}
              />
            </td>
          </tr>
        </tbody>
      </ChargeDetailsTable>
      <ChargeDetailsTable>
        <colgroup>
          <ChargeTableCol colNumbers={[0, 1]} />
          <ChargeTableCol colNumbers={[2, 3, 4]} />
        </colgroup>
        <thead>
          <tr>
            <th>Supervision Status</th>
            <th>Start Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <FormUsIaEarlyDischargeInput name="supervisionType" />
            </td>
            <td>
              <FormUsIaEarlyDischargeInput name="supervisionStartDate" />
            </td>
          </tr>
        </tbody>
      </ChargeDetailsTable>
      <ChargeDetailsTable>
        <colgroup>
          <col style={{ width: "17%" }} />
          <col style={{ width: "27%" }} />
          <ChargeTableCol colNumbers={[2]} />
          <ChargeTableCol colNumbers={[3, 4]} />
        </colgroup>
        <thead>
          <tr>
            <th>Sentence Date</th>
            <th>Penalty Type</th>
            <th>Penalty Value</th>
            <th>Penalty Modifier</th>
          </tr>
        </thead>
        <tbody>
          {penaltyIds.map((penaltyId) => (
            <tr key={penaltyId}>
              <td>
                <FormUsIaEarlyDischargeInput
                  name={`sentenceDate${penaltyId}`}
                />
              </td>
              <td>
                <FormUsIaEarlyDischargeInput
                  name={`sentencePenaltyType${penaltyId}`}
                />
              </td>
              <td>
                <FormUsIaEarlyDischargeInput
                  name={`penaltyValue${penaltyId}`}
                />
              </td>
              <td>
                <FormUsIaEarlyDischargeTextArea
                  name={`sentencePenaltyModifier${penaltyId}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </ChargeDetailsTable>
    </div>
  );
}

const ProgressAndRecommendationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${rem(30)};
`;

const SectionHeader = styled.div`
  margin-top: ${rem(6)};
  font-weight: 600;
`;

function ProgressAndRecommendations() {
  return (
    <ProgressAndRecommendationsContainer>
      <SectionHeader>
        Progress of Supervision/Restitution Status/Recommendations:
      </SectionHeader>
      <div>TODO: Add statuses</div>
    </ProgressAndRecommendationsContainer>
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
            Distribution: Judge Attorney , File // Parolee, File
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

export const CbcDischargeReport = observer(function CbcDischargeReport() {
  const form = useOpportunityFormContext() as UsIaEarlyDischargeForm;

  const {
    formData: { numberOfCharges },
  } = form;

  return (
    <PrintablePageMargin stretchable>
      <PrintablePage stretchable>
        <FormPage>
          <FormHeader />
          <ClientDetails />
          {[...Array(numberOfCharges).keys()].map((i) => (
            <ChargeTable form={form} chargeNumber={i} key={i} />
          ))}
          <ProgressAndRecommendations />
          <SubmissionAndSignature />
          <Footer />
        </FormPage>
      </PrintablePage>
    </PrintablePageMargin>
  );
});
