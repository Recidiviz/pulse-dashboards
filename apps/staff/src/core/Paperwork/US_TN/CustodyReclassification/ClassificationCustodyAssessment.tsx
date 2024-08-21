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

// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
import { zip } from "lodash";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import styled from "styled-components/macro";

import { UsTnReclassificationReviewForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassificationReviewForm";
import { FormViewerContext } from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
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
import CoverSheet from "./CoverSheet";
import FormInput from "./FormInput";
import HeaderFields from "./HeaderFields";
import HearingNotice from "./HearingNotice";
import { FormContainer, Label } from "./styles";

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

const ClassificationCustodyAssessment: React.FC = () => {
  const formViewerContext = useContext(FormViewerContext);
  const form = useOpportunityFormContext() as UsTnReclassificationReviewForm;

  const numberedQuestions = zip(
    assessmentQuestions,
    assessmentQuestionNumbers,
  ) as [AssessmentQuestionSpec, AssessmentQuestionNumber][];

  const scheduleA = numberedQuestions.slice(0, 4);
  const scheduleB = numberedQuestions.slice(4);

  const {
    scheduleAScore,
    scheduleAText,
    totalScore,
    totalText,
    scheduleBSkipped,
  } = form.derivedData;

  return (
    <>
      <PrintablePageMargin>
        <PrintablePage>
          <FormContainer {...formViewerContext}>
            <CoverSheet />
          </FormContainer>
        </PrintablePage>
      </PrintablePageMargin>
      <PrintablePageMargin stretchable>
        <PrintablePage stretchable>
          <FormContainer {...formViewerContext}>
            <Header>
              <Seal />
              <div>
                TENNESSEE DEPARTMENT OF CORRECTION <br />
                CLASSIFICATION CUSTODY ASSESSMENT <br />
                <Label>
                  INSTITUTION:{" "}
                  <FormInput
                    style={{ borderBottom: "0.5px solid black" }}
                    name="institutionName"
                  />
                </Label>
              </div>
            </Header>
            <HeaderFields />
            <div>
              {scheduleA.map(([q, i]) => (
                <AssessmentQuestion
                  questionSpec={q}
                  questionNumber={i}
                  key={i}
                />
              ))}
            </div>
            <AssessmentScore
              score={scheduleAScore}
              scoreText={scheduleAText}
              title="SCHEDULE A SCALE (SUM OF ITEMS 1 THROUGH 4)"
              levels={[
                { text: "Close", min: 10, max: 14 },
                { text: "Maximum", min: 15 },
                { text: "Complete Schedule B", max: 9 },
              ]}
            />
          </FormContainer>
        </PrintablePage>
      </PrintablePageMargin>
      <PrintablePageMargin stretchable>
        <PrintablePage stretchable>
          <FormContainer {...formViewerContext}>
            <div>
              {scheduleB.map(([q, i]) => (
                <AssessmentQuestion
                  questionSpec={q}
                  questionNumber={i}
                  key={i}
                  disabled={scheduleBSkipped}
                />
              ))}
            </div>
            <AssessmentScore
              title="CUSTODY LEVEL SCALE FOR TOTAL A+B (CAF SCORE)"
              score={totalScore}
              scoreText={totalText}
              levels={[
                { text: "Close", min: 17 },
                { text: "Medium", min: 7, max: 16 },
                { text: "Minimum", max: 6 },
              ]}
            />
          </FormContainer>
        </PrintablePage>
      </PrintablePageMargin>
      <PrintablePageMargin>
        <PrintablePage>
          <FormContainer {...formViewerContext}>
            <HearingNotice />
          </FormContainer>
        </PrintablePage>
      </PrintablePageMargin>
    </>
  );
};

export default observer(ClassificationCustodyAssessment);
