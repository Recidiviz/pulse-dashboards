// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { zip } from "lodash";
import React, { useContext } from "react";
import styled from "styled-components/macro";

import { FormViewerContext } from "../../FormViewer";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import SealPng from "../common/Seal.png";
import AssessmentQuestion from "./AssessmentQuestion";
import {
  AssessmentQuestionNumber,
  assessmentQuestionNumbers,
  assessmentQuestions,
  AssessmentQuestionSpec,
} from "./assessmentQuestions";
import AssessmentScore from "./AssessmentScore";
import FormInput from "./FormInput";
import { FormContainer } from "./styles";

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 1em;
`;

const Seal = styled.img.attrs({ src: SealPng, alt: "TN Seal" })`
  height: 3rem;
  width: 3rem;
  margin-right: 1rem;
`;

const Label = styled.label`
  display: flex;
  align-items: baseline;
`;

const ClassificationCustodyAssessment: React.FC = () => {
  const formViewerContext = useContext(FormViewerContext);

  const numberedQuestions = zip(
    assessmentQuestions,
    assessmentQuestionNumbers
  ) as [AssessmentQuestionSpec, AssessmentQuestionNumber][];

  const scheduleA = numberedQuestions.slice(0, 4);
  const scheduleB = numberedQuestions.slice(4);

  return (
    <>
      <PrintablePageMargin>
        <PrintablePage>
          <FormContainer {...formViewerContext} style={{ fontSize: "0.9em" }}>
            <Header>
              <Seal />
              <div>
                TENNESSEE DEPARTMENT OF CORRECTION <br />
                CLASSIFICATION CUSTODY ASSESSMENT <br />
                <Label>
                  INSTITUTION: <FormInput name="institutionName" />
                </Label>
              </div>
            </Header>
            <Header>
              <Label>
                Name:
                <FormInput name="residentFullName" />
              </Label>
              <Label>
                OMS ID:
                <FormInput name="omsId" />
              </Label>
            </Header>
            <ol>
              {scheduleA.map(([q, i]) => (
                <AssessmentQuestion q={q} i={i} key={i} />
              ))}
            </ol>
            <AssessmentScore />
          </FormContainer>
        </PrintablePage>
      </PrintablePageMargin>
      <PrintablePageMargin>
        <PrintablePage>
          <FormContainer {...formViewerContext} style={{ fontSize: "0.9em" }}>
            <ol>
              {scheduleB.map(([q, i]) => (
                <AssessmentQuestion q={q} i={i} key={i} />
              ))}
            </ol>
            <AssessmentScore />
          </FormContainer>
        </PrintablePage>
      </PrintablePageMargin>
    </>
  );
};

export default ClassificationCustodyAssessment;
