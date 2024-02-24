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

import React from "react";
import styled from "styled-components/macro";

import { UsTnAnnualReclassificationReviewForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnAnnualReclassificationReviewForm";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import FormInput from "./FormInput";

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
  // display: flex;
  // justify-content: space-between;
  width: 95%;
  margin-left: ${({ indented }) => (indented ? "2em" : 0)};
  margin-top: ${({ grouped }) => (grouped ? 0 : "5em")};
`;

const SigBlock = styled.div`
  margin-top: 5em;
  border-bottom: 0.5px solid black;
  width: 20em;
`;

const HearingNotice: React.FC = () => {
  const { formData } =
    useOpportunityFormContext() as UsTnAnnualReclassificationReviewForm;

  return (
    <Container>
      <Headline>TENNESSEE DEPARTMENT OF CORRECTION</Headline>
      <Headline>CLASSIFICATION HEARING NOTICE</Headline>
      <Row>
        TOMIS ID: {formData.omsId} {formData.residentFullName}
      </Row>
      <Row grouped>CAF Date: {formData.date}</Row>
      <Row>
        This is to inform you that your classification hearing will be held on{" "}
        <FormInput name="hearingDate" placeholder="hearing date" /> at{" "}
        <FormInput name="hearingLocation" placeholder="hearing location" />.
      </Row>
      <Row>Classification Date:</Row>
      <Row grouped>Classification Type: CL CLASSIFICATION</Row>
      <SigBlock>x</SigBlock>
    </Container>
  );
};

export default HearingNotice;
