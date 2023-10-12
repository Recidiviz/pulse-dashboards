// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import styled from "styled-components/macro";

import { templateValuesForFormData } from "../../../WorkflowsUsTnReclassForm";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import FormInput from "./FormInput";
import FormRadioButton from "./FormRadioButton";
import FormTextarea from "./FormTextarea";
import { Label } from "./styles";

const Container = styled.div`
  font-family: monospace;

  textarea {
    width: 100%;
  }
`;

const Headline = styled.div`
  text-align: center;
`;

const Row = styled.div<{ indented?: boolean; grouped?: boolean }>`
  display: flex;
  justify-content: space-between;
  width: 95%;
  margin-left: ${({ indented }) => (indented ? "2em" : 0)};

  label {
    ${({ grouped }) => (grouped ? "margin-bottom: 0;" : null)}
  }
`;

const Item = styled.div`
  display: flex;
  gap: 1em;
`;

const SigBlock = styled.div`
  margin-top: 5em;
  border-top: 0.5px solid black;
  flex-grow: 1;
  margin-right: 2em;
  margin-bottom: 1em;
`;

const CoverSheet: React.FC = () => {
  const { formData } = useOpportunityFormContext();

  return (
    <Container>
      <Headline>TENNESSEE DEPARTMENT OF CORRECTION</Headline>
      <Headline>OFFENDER CLASSIFICATION SUMMARY</Headline>
      <Row grouped>
        <Label>
          TOMIS ID: <FormInput name="omsId" />
        </Label>
      </Row>
      <Row grouped>
        <Label>
          Offender Name: <FormInput name="residentFullName" />
        </Label>
      </Row>
      <Row>
        <Label>
          Institution Name: <FormInput name="institutionName" />
        </Label>
      </Row>
      <Row>
        <Label>Classification Type: CLASSIFICATION</Label>
        <Label>
          CAF Date: <FormInput name="date" />
        </Label>
      </Row>
      <Row>
        <Item>
          Status at time of hearing:
          <FormRadioButton
            name="statusAtHearing"
            targetValue="GEN"
            label="Gen. Pop."
          />
          <FormRadioButton name="statusAtHearing" targetValue="AS" label="AS" />
          <FormRadioButton name="statusAtHearing" targetValue="PC" label="PC" />
          <Label>
            Other:{" "}
            <FormInput
              name="statusAtHearing"
              hideValue={["GEN", "AS", "PC"].includes(formData.statusAtHearing)}
            />
          </Label>
        </Item>
      </Row>
      <Row>
        <Item>
          Incompatibles:
          <FormRadioButton name="hasIncompatibles" targetValue label="Yes" />
          <FormRadioButton
            name="hasIncompatibles"
            targetValue={false}
            label="No"
          />
        </Item>
        <Item>Inmate agrees to waive 48 hr. hearing notice: __</Item>
      </Row>
      {formData.hasIncompatibles && (
        <Row>
          <Label>
            Incompatibles: <FormInput name="incompatiblesList" width="100%" />
          </Label>
        </Row>
      )}
      <Row>
        <Label>
          Scored CAF Range:
          {templateValuesForFormData(formData).totalText.toUpperCase()}
        </Label>
        <Label>
          Current Custody Level: <FormInput name="currentCustodyLevel" />
        </Label>
      </Row>
      <Row>Panel&apos;s Majority Recommendation:</Row>
      <Row indented>
        <Label>
          Facility Assignment:
          <FormInput name="recommendationFacilityAssignment" />
        </Label>
        <Item>
          Transfer:
          <FormRadioButton
            name="recommendationTransfer"
            targetValue
            label="Yes"
          />
          <FormRadioButton
            name="recommendationTransfer"
            targetValue={false}
            label="No"
          />
          Explain below:
        </Item>
      </Row>
      <Row indented>
        <Label>
          Custody Level: <FormInput name="recommendationCustodyLevel" />
        </Label>
      </Row>
      <Row indented>
        <Label>
          Override Type: <FormInput name="recommendationOverrideType" />
        </Label>
      </Row>
      <Row indented>
        <Label htmlFor="recommendationJustification">
          Justification, Program Recommendations, and Summary:
        </Label>
      </Row>
      <FormTextarea name="recommendationJustification" minRows={4} />
      <Row>
        <Item>
          Updated Photo Needed:
          <FormRadioButton name="updatedPhotoNeeded" targetValue label="Yes" />
          <FormRadioButton
            name="updatedPhotoNeeded"
            targetValue={false}
            label="No"
          />
        </Item>
      </Row>
      <Row>
        Offender Signature: _______________________
        <Label>
          Appeal:
          <FormRadioButton name="inmateAppeal" targetValue label="Yes" />
          <FormRadioButton name="inmateAppeal" targetValue={false} label="No" />
        </Label>
        If Yes, provide appeal & copy to Inmate
      </Row>
      <Row>
        <Item>Panel Member Signatures:</Item>
        <Item>Date: ___________</Item>
      </Row>
      <Row>
        <SigBlock>Chairperson</SigBlock>
        <SigBlock>Treatment Member</SigBlock>
        <SigBlock>Security Member</SigBlock>
      </Row>
      <Row>
        <Label htmlFor="disagreementReasons">
          If panel member disagrees with majority recommend, state specific
          reasons:
        </Label>
      </Row>
      <FormTextarea name="disagreementReasons" minRows={4} />
      <Row style={{ marginTop: "1em" }}>Approving Authority:</Row>
      <Row>
        <SigBlock>Signature</SigBlock>
        <SigBlock>Date</SigBlock>
        <Item style={{ marginTop: "4em" }}>Approve ___ Deny ___</Item>
      </Row>
      <Row>
        <Label htmlFor="denialReasons">If denied, reasons include:</Label>
      </Row>
      <FormTextarea name="denialReasons" minRows={4} />
    </Container>
  );
};

export default CoverSheet;
