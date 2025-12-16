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
import { UsTnInitialClassification2026Form } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnInitialClassification2026Form";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import {
  Item,
  LeftColumn,
  ScoredAssessmentQuestion,
  SubItem,
} from "../common/ScoredAssessmentQuestion";
import { assessmentQuestions } from "./assessmentQuestions";
import { BoldWeight, FormFont } from "./styles";
import { TextAreaContainer, TextboxWithHeader } from "./TextboxWithHeader";
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

  ${LeftColumn} {
    width: 100%;
  }

  ${Item} {
    margin: 0.5rem 0;
    ${SubItem} {
      margin-left: 0.5rem;
    }
  }
`;

const DoubleNotes = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  ${TextAreaContainer} {
    min-height: unset;
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
    const { derivedData } =
      useOpportunityFormContext() as UsTnInitialClassification2026Form;

    return (
      <FormContainer
        heading="Form heading"
        agencyName="TDOC"
        onClickDownload={async () => alert("Download clicked")}
        opportunity={opportunity}
        downloadButtonLabel="Download as .DOCX"
      >
        <FormViewer formRef={formRef}>
          <PrintablePage landscape stretchable>
            <FormPage>
              <Header>TENNESSEE CLASSIFICATION INSTRUMENT: DIAGNOSTIC</Header>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[0]}
                questionNumber={1}
              >
                <DoubleNotes>
                  <TextboxWithHeader
                    header={
                      "List prior violent felony convictions (TDOC) in Last 60 Months (imposed date, charge):"
                    }
                    name={"q1aNotes"}
                  />
                  <TextboxWithHeader
                    header={
                      "List prior ISC or Diversion convictions in  the Last 60 Months - Please confirm if they are violent felony convictions (imposed date, charge):"
                    }
                    name={"q1bNotes"}
                  />
                </DoubleNotes>
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[1]}
                questionNumber={2}
              >
                <TextboxWithHeader
                  header={"List current offenses:"}
                  name={"q2Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[2]}
                questionNumber={3}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q3Notes"}
                />
              </ScoredAssessmentQuestion>
            </FormPage>
          </PrintablePage>
          <PrintablePage landscape stretchable>
            <FormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[3]}
                questionNumber={4}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q4Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[4]}
                questionNumber={5}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q5Notes"}
                />
              </ScoredAssessmentQuestion>
            </FormPage>
          </PrintablePage>
          <PrintablePage landscape>
            <FormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[5]}
                questionNumber={6}
              />
              <TotalScore score={derivedData.totalScore} />
            </FormPage>
          </PrintablePage>
        </FormViewer>
      </FormContainer>
    );
  },
);
