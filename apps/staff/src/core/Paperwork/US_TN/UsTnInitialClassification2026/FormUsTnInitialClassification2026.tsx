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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { Opportunity } from "../../../../WorkflowsStore";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage } from "../../styles";
import {
  Item,
  ScoredAssessmentQuestion,
} from "../common/ScoredAssessmentQuestion";
import { assessmentQuestions } from "./assessmentQuestions";
import { BoldWeight, FormFont } from "./styles";
import { TotalScore } from "./TotalScore";

const FormPage = styled.div`
  ${FormFont}
  display: flex;
  height: 100%;
  flex-direction: column;
  font-size: ${rem(10)};
  color: black;
  background-color: white;
  padding: 3rem 4.25rem;

  & textarea {
    min-height: 3.5rem;
  }

  ${Item} {
    margin: 0.5rem 0;
  }
`;

const Header = styled.h1`
  ${FormFont}
  ${BoldWeight}
  text-align: center;
  font-size: ${rem(10)};
  width: 100%;
  letter-spacing: -0.01rem;
`;

export const FormUsTnInitialClassification2026 = observer(
  function FormUsTnInitialClassification2026({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);

    return (
      <FormContainer
        heading="Form heading"
        agencyName="TDOC"
        onClickDownload={async () => alert("Download clicked")}
        opportunity={opportunity}
        downloadButtonLabel="Download as .DOCX"
      >
        <FormViewer formRef={formRef}>
          <PrintablePage landscape>
            <FormPage>
              <Header>TENNESSEE CLASSIFICATION INSTRUMENT: DIAGNOSTIC</Header>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[0]}
                questionNumber={1}
              />
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[1]}
                questionNumber={2}
              />
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[2]}
                questionNumber={3}
              />
              {/* Note: I'm leaving this commented-out code just for this   */}
              {/*       commit so I can move over the supporting components */}
              {/*       in the next commit or two. */}
              {/*<MultichoiceScore questionNumber={1} {...QUESTIONS[0]}>*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List convictions:"}*/}
              {/*    name={"q1Convictions"}*/}
              {/*  />*/}
              {/*</MultichoiceScore>*/}
              {/*<MultichoiceScore questionNumber={2} {...QUESTIONS[1]}>*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List offenses:"}*/}
              {/*    name={"q2Offenses"}*/}
              {/*  />*/}
              {/*</MultichoiceScore>*/}
              {/*<MultichoiceScore questionNumber={3} {...QUESTIONS[2]}>*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List disciplinaries:"}*/}
              {/*    name={"q3Disciplinaries"}*/}
              {/*  />*/}
              {/*</MultichoiceScore>*/}
            </FormPage>
          </PrintablePage>
          <PrintablePage landscape>
            <FormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[3]}
                questionNumber={4}
              />
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[4]}
                questionNumber={5}
              />
              {/*<MultichoiceScore questionNumber={4} {...QUESTIONS[3]}>*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List disciplinaries:"}*/}
              {/*    name={"q4Disciplinaries"}*/}
              {/*  />*/}
              {/*</MultichoiceScore>*/}
              {/*<MultichoiceScore questionNumber={5} {...QUESTIONS[4]}>*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List disciplinaries:"}*/}
              {/*    name={"q5Disciplinaries"}*/}
              {/*  />*/}
              {/*  <YesNoQuestion question="3+ Violent Class A or B disciplinaries in Previous Six Months" />*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List disciplinaries:"}*/}
              {/*    name={"q5aDisciplinaries"}*/}
              {/*  />*/}
              {/*  <YesNoQuestion question="Homicide Disciplinary" />*/}
              {/*  <TextboxWithHeader*/}
              {/*    header={"List disciplinaries:"}*/}
              {/*    name={"q5bDisciplinaries"}*/}
              {/*  />*/}
              {/*</MultichoiceScore>*/}
            </FormPage>
          </PrintablePage>
          <PrintablePage landscape>
            <FormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[5]}
                questionNumber={6}
              />
              <TotalScore score={17} />
            </FormPage>
          </PrintablePage>
        </FormViewer>
      </FormContainer>
    );
  },
);
