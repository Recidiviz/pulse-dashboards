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
import SignatureField from "./SignatureField";

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
      <div>
        <FormUsIaEarlyDischargeTextArea name="progressAndRecommendations" />
      </div>
    </ProgressAndRecommendationsContainer>
  );
}

const SubmissionAndSignatureTable = styled.table`
  width: 100%;
  margin-top: ${rem(30)};
`;

const SignatureCell = styled.td`
  border-bottom: 1px solid black;
  margin-right: 1rem;
`;

const SubmissionAndSignature = observer(function SubmissionAndSignature({
  form,
}: {
  form: UsIaEarlyDischargeForm;
}) {
  return (
    <SubmissionAndSignatureTable>
      <colgroup>
        <col style={{ width: "48%" }} />
        <col style={{ width: "4%" }} />
        <col style={{ width: "48%" }} />
      </colgroup>
      <thead>
        <tr>
          <td>Respectfully submitted,</td>
          <td />
          <td />
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <br />
          </td>
          <td />
          <td />
        </tr>
        <tr>
          <SignatureCell>
            <SignatureField
              form={form}
              signatureField="officerSignatureCbcForm"
              displaySignatureButton={form.currentUserIsSupervisingOfficer}
              additionalFieldsToSave={[
                "officerFullName",
                "staffTitle",
                "workUnit",
              ]}
              idField="officerSignatureIdCbcForm"
            />
          </SignatureCell>
          <td />
          <SignatureCell>
            <SignatureField
              form={form}
              signatureField="supervisorSignatureCbcForm"
              displaySignatureButton={form.currentUserCanSignCbcSupervisorField}
              additionalFieldsToSave={["supervisorFullName", "supervisorTitle"]}
              idField="supervisorSignatureIdCbcForm"
            />
          </SignatureCell>
        </tr>
        <tr>
          <td>
            <FormUsIaEarlyDischargeInput
              name="officerFullName"
              placeholder="Supervising Officer's Name"
            />
          </td>
          <td />
          <td>
            <FormUsIaEarlyDischargeInput
              name="supervisorFullName"
              placeholder="District Supervisor's Name"
            />
          </td>
        </tr>
        <tr>
          <td>
            <FormUsIaEarlyDischargeInput
              name="staffTitle"
              placeholder="Supervising Officer's Title"
            />
          </td>
          <td />
          <td>
            <FormUsIaEarlyDischargeInput
              name="supervisorTitle"
              placeholder="District Supervisor's Title"
            />
          </td>
        </tr>
        <tr>
          <td>
            <FormUsIaEarlyDischargeInput
              name="workUnit"
              placeholder="Supervising Officer's Unit"
            />
          </td>
          <td />
          <td />
        </tr>
        <tr>
          <td colSpan={3}>
            Region/Work Unit:{" "}
            <FormUsIaEarlyDischargeInput
              name="workUnit"
              placeholder="Supervising Officer's Unit"
            />
            <br />
            Distribution: Judge, County Attorney, File // Parolee, File
          </td>
        </tr>
      </tbody>
    </SubmissionAndSignatureTable>
  );
});

const FooterContainer = styled.div`
  margin-top: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FooterText = styled.div`
  font-size: ${rem(9)};
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterText>
        <FormUsIaEarlyDischargeInput name="iconNumber" /> -{" "}
        <FormUsIaEarlyDischargeInput name="clientFullName" /> Page 1 of 1{" "}
        <FormUsIaEarlyDischargeInput name="todaysDate" />
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
          <SubmissionAndSignature form={form} />
          <Footer />
        </FormPage>
      </PrintablePage>
    </PrintablePageMargin>
  );
});
