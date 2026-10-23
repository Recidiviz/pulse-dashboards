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

import { useUsMaTranslations } from "~@jii/translation";

import {
  Callout,
  CalloutDescription,
  CalloutHeading,
  Heading,
  InstructionsCard,
  InstructionsHeading,
  StartButton,
  StepItem,
  StepList,
  StepNumber,
  Wrapper,
} from "./QuestionnaireIntro.styles";

export type QuestionnaireIntroProps = {
  minQuestionCount: number;
  maxQuestionCount: number;
  onStart: () => void;
};

export const QuestionnaireIntro = ({
  minQuestionCount,
  maxQuestionCount,
  onStart,
}: QuestionnaireIntroProps) => {
  const { t } = useUsMaTranslations();

  const {
    heading,
    instructionsHeading,
    answerEachQuestion,
    saveProgress,
    resumeWhereLeftOff,
    afterHeading,
    afterDescription,
    cta,
  } = t(($) => $.reentry.questionnaire.intro, { returnObjects: true });
  // The count needs its own call to fill in min and max.
  const questionCount = t(($) => $.reentry.questionnaire.intro.questionCount, {
    min: minQuestionCount,
    max: maxQuestionCount,
  });

  const steps = [
    answerEachQuestion,
    saveProgress,
    resumeWhereLeftOff,
    questionCount,
  ];

  return (
    <Wrapper>
      <Heading>{heading}</Heading>
      <InstructionsCard>
        <InstructionsHeading>{instructionsHeading}</InstructionsHeading>
        <StepList>
          {steps.map((step, index) => (
            <StepItem key={step}>
              <StepNumber>{index + 1}</StepNumber>
              <span>{step}</span>
            </StepItem>
          ))}
        </StepList>
      </InstructionsCard>

      <Callout>
        <CalloutHeading>{afterHeading}</CalloutHeading>
        <CalloutDescription>{afterDescription}</CalloutDescription>
      </Callout>

      <StartButton kind="primary" onClick={onStart}>
        {cta}
      </StartButton>
    </Wrapper>
  );
};
