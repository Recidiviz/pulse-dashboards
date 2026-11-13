// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import React, { useEffect, useState } from "react";

import { Button } from "~design-system";
import { pluralizeWord } from "~utils";

import { UsMiInitialClassificationForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { ClassificationQuestion } from "./MultipleChoiceQuestion";
import { UsMiClassificationOverrides } from "./Screens/OverrideScreen";
import { UsMiClassificationPreviewScreen } from "./Screens/PreviewScreen";
import {
  ClassificationForm,
  CurrentLevelLabel,
  CurrentLevelValue,
  FlexColumn,
  FormFooter,
  FormTitle,
  FullWidthHr,
  LeftFooter,
  LevelBadge,
  RemainingFields,
  SaveStatus,
  ScoreSection,
  ScoreSupportingText,
  ScoringNote,
  SectionHeading,
  SectionTitle,
  StatusBadge,
  StickyHeader,
  SubHeading,
  TotalScore,
  VerticalHr,
} from "./Styles";

export type FormStages = "FORM" | "OVERRIDE" | "PREVIEW";

export const FormUsMiClassification = observer(
  function FormUsMiClassification() {
    const formRef = React.useRef<HTMLDivElement>(null);
    const form = useOpportunityFormContext() as
      | UsMiInitialClassificationForm
      | UsMiReviewClassificationForm;

    const {
      displayCustodyLevel,
      questionList,
      derivedData,
      formTitle,
      remainingFields,
    } = form;

    const [stage, setStage] = useState<FormStages>("FORM");

    const [headerVisible, isHeaderVisible] = useState(true);

    useEffect(() => {
      const handleScroll = () => {
        if (window.scrollY > 80) {
          isHeaderVisible(false);
        } else {
          isHeaderVisible(true);
        }
      };

      window.addEventListener("scroll", handleScroll);

      // Clean up event listener on component unmount
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);

    const changePage = (direction: FormStages) => {
      setStage(direction);
      window.scrollTo(0, 0);
    };

    let questionNumber = 0;
    return (
      <>
        <StickyHeader $headerVisible={headerVisible}>
          <div>
            <FormTitle>{formTitle}</FormTitle>
            <SubHeading $headerVisible={headerVisible}>
              Auto-filled fields are pulled from COMS. Review each and complete
              required fields.
            </SubHeading>
          </div>
          <StatusBadge $headerVisible={headerVisible}>
            <LevelBadge $headerVisible={headerVisible}>
              <CurrentLevelLabel>CURRENT LEVEL</CurrentLevelLabel>
              <CurrentLevelValue>{displayCustodyLevel}</CurrentLevelValue>
            </LevelBadge>
            <VerticalHr />
            <SaveStatus>
              {form.formIsReverting ? "Reverting..." : "All Changes Saved"}
            </SaveStatus>
            {stage === "FORM" && (
              <Button
                type="button"
                kind="secondary"
                onClick={() => {
                  form.revert();
                }}
              >
                Revert Edits
              </Button>
            )}
          </StatusBadge>
        </StickyHeader>

        {stage === "FORM" && (
          <ClassificationForm ref={formRef}>
            {questionList?.map((section, sectionIndex) => {
              const { subscores } = derivedData;
              return (
                <div key={section.title}>
                  <SectionHeading>
                    <SectionTitle>{section.title}</SectionTitle>
                    <div>Subtotal: {subscores && subscores[sectionIndex]}</div>
                  </SectionHeading>
                  {section.questions.map((question) => {
                    questionNumber += 1;
                    return (
                      <ClassificationQuestion
                        key={question.title}
                        questionSection={sectionIndex + 1}
                        question={question}
                        questionNumber={questionNumber}
                      />
                    );
                  })}
                </div>
              );
            })}
            <FullWidthHr />
            <FormFooter>
              <LeftFooter>
                <ScoreSection>
                  <ScoreSupportingText>
                    {remainingFields ? `SUBTOTAL SO FAR` : `TOTAL SCORE`}
                  </ScoreSupportingText>
                  <div>
                    <TotalScore>
                      {derivedData.totalScore.toFixed(1)}{" "}
                    </TotalScore>
                    <ScoreSupportingText>pts</ScoreSupportingText>
                  </div>
                </ScoreSection>
                {remainingFields ? (
                  <FlexColumn>
                    <RemainingFields $remaining={!!remainingFields}>
                      {`${remainingFields} required ${pluralizeWord({ term: "field", count: remainingFields })} remaining`}
                    </RemainingFields>
                    <ScoringNote>
                      The score and recommended level appear after you calculate
                    </ScoringNote>
                  </FlexColumn>
                ) : (
                  <RemainingFields $remaining={!!remainingFields}>
                    All required fields complete
                  </RemainingFields>
                )}
              </LeftFooter>

              <Button
                type="button"
                kind="primary"
                disabled={remainingFields > 0}
                onClick={() => changePage("OVERRIDE")}
              >
                Calculate Classification
              </Button>
            </FormFooter>
          </ClassificationForm>
        )}
        {stage === "OVERRIDE" && (
          <UsMiClassificationOverrides onChangeNavigation={changePage} />
        )}
        {stage === "PREVIEW" && (
          <UsMiClassificationPreviewScreen onChangeNavigation={changePage} />
        )}
      </>
    );
  },
);
