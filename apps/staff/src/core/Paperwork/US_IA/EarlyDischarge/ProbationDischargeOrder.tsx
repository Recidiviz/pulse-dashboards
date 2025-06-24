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

import styled from "styled-components/macro";

import { Checkbox } from "../../FormCheckbox";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import { FormPage } from "./constants";
import {
  FormUsIaEarlyDischargeCheckbox,
  FormUsIaEarlyDischargeDropdown,
  FormUsIaEarlyDischargeInput,
} from "./FormComponents";

const MarginedFormPage = styled(FormPage)`
  margin: 2rem;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer = styled.div`
  margin-top: 1rem;
  text-align: center;
`;

function Header() {
  return (
    <HeaderContainer>
      IN THE IOWA DISTRICT COURT IN AND FOR{" "}
      <FormUsIaEarlyDischargeInput name="jurisdiction" /> COUNTY
    </HeaderContainer>
  );
}

const borderStyle = "1px solid black";

const CaseTable = styled.table`
  margin-top: 0.5rem;

  width: 100%;
  border-collapse: collapse;

  & td {
    padding-left: 0.25rem;
  }

  & tr:first-child {
    border-top: ${borderStyle};
  }

  & tr:last-child {
    border-bottom: ${borderStyle};
  }

  & td:nth-child(2) {
    border-right: ${borderStyle};
  }
`;

const BoldCell = styled.td`
  font-weight: 600;
`;

function CaseSummary() {
  return (
    <CaseTable>
      <colgroup>
        <col style={{ width: "28%" }} />
        <col style={{ width: "24%" }} />
        <col style={{ width: "48%" }} />
      </colgroup>
      <tbody>
        <tr>
          <td>The State of Iowa,</td>
          <td />
          <td />
        </tr>
        <tr>
          <td />
          <td>Plaintiff,</td>
          <td>Case No(s). $CASE_NUMBERS</td>
        </tr>
        <tr>
          <td>vs.</td>
          <td />
          <td />
        </tr>
        <tr>
          <td>
            <FormUsIaEarlyDischargeInput name="clientFullName" />
          </td>
          <td />
          <BoldCell>ORDER FOR DISCHARGE</BoldCell>
        </tr>
        <tr>
          <td>
            (<FormUsIaEarlyDischargeInput name="iconNumber" />)
          </td>
          <td />
          <BoldCell>FROM PROBATION</BoldCell>
        </tr>
        <tr>
          <td />
          <td>Defendant.</td>
          <td />
        </tr>
      </tbody>
    </CaseTable>
  );
}

const DischargeText = styled.div`
  margin-top: 1.25rem;
  margin-bottom: 0.25rem;
  line-height: 1.1;
`;

function DischargeOrder() {
  return (
    <DischargeText>
      Upon the recommendation of the Iowa Department of Corrections (IDOC), IT
      IS HEREBY ORDERED that the defendant is discharged from probation.
    </DischargeText>
  );
}

const CheckboxContainer = styled.div`
  margin-top: 1.5rem;
`;

const CheckboxRow = styled.div`
  margin-bottom: 1rem;

  display: flex;
  flex-direction: row;

  & input {
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }
`;

function Checkboxes() {
  return (
    <CheckboxContainer>
      <CheckboxRow style={{ marginBottom: "2rem" }}>
        <FormUsIaEarlyDischargeCheckbox name="hasCompletedProbation" />
        <div>
          The defendant was{" "}
          <FormUsIaEarlyDischargeDropdown
            name="probationCompletionStatus"
            menuItems={["Incarcerated", "Deceased", "Deported"]}
            style={{ display: "inline-block", minWidth: "5rem" }}
          />{" "}
          as of
          <FormUsIaEarlyDischargeInput name="probationCompletionDate" />
        </div>
      </CheckboxRow>
      <CheckboxRow>
        <FormUsIaEarlyDischargeCheckbox name="remainsFinanciallyLiable" />
        <div>
          The defendant remains liable to the Court and to IDOC for any unpaid
          financial obligations should they exist.
        </div>
      </CheckboxRow>
      <CheckboxRow>
        <FormUsIaEarlyDischargeCheckbox name="grantedDeferredJudgement" />
        <div>
          The defendant was granted a deferred judgement under Section 907.3. It
          is therefore further ordered that the file be expunged if and when all
          financial obligations to the Court are paid in full.
        </div>
      </CheckboxRow>
      <CheckboxRow style={{ paddingLeft: "1.25rem" }}>
        <FormUsIaEarlyDischargeCheckbox name="hasOtherProbationDischargeOrder" />
        <div>
          Other:{" "}
          <FormUsIaEarlyDischargeInput
            name="otherProbationDischargeOrderDetails"
            style={{ minWidth: "4rem" }}
          />
        </div>
      </CheckboxRow>
    </CheckboxContainer>
  );
}

const RestorationText = styled.div`
  line-height: 1.1;
  margin: 0 0.25rem;
`;

function RestorationOfRights() {
  return (
    <RestorationText>
      For information regarding his/her right to vote and hold public office in
      Iowa, please refer to the following link,{" "}
      <a
        href="https://governor.iowa.gov/services/voting-rights-restoration"
        target="_blank"
        rel="noreferrer"
      >
        https://governor.iowa.gov/services/voting-rights-restoration
      </a>
      , For information on the restoration of firearms rights and a pardon,
      please refer to the following link:{" "}
      <a
        href="https://governor.iowa.gov/services/voting-rights-restoration"
        target="_blank"
        rel="noreferrer"
      >
        https://governor.iowa.gov/services/pardons-commutations
      </a>{" "}
      <b>(Felony & Aggravated Misdemeanor Convictions ONLY).</b>
    </RestorationText>
  );
}

function MailACopy() {
  return (
    <CheckboxContainer>
      <br />
      <CheckboxRow>
        <Checkbox checked={true} readOnly />
        <div>Clerk shall mail a copy of this order to the defendant.</div>
      </CheckboxRow>
    </CheckboxContainer>
  );
}

export const ProbationDischargeOrder = () => {
  return (
    <PrintablePageMargin>
      <PrintablePage>
        <MarginedFormPage>
          <Header />
          <CaseSummary />
          <DischargeOrder />
          <Checkboxes />
          <RestorationOfRights />
          <MailACopy />
        </MarginedFormPage>
      </PrintablePage>
    </PrintablePageMargin>
  );
};
