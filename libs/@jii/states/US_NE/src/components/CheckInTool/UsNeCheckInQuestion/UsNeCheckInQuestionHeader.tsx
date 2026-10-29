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

import React from "react";

import { useUsNeTranslations } from "~@jii/translation";

import {
  AnswerHint,
  QuestionDescription,
  QuestionText,
} from "./UsNeCheckInQuestion.styles";

type CheckInQuestionHeaderProps = {
  copy: {
    question: string;
    description?: string;
  };
  isOptional: boolean;
  answerHint?: string;
};

export const UsNeCheckInQuestionHeader: React.FC<
  CheckInQuestionHeaderProps
> = ({
  copy: { question, description },
  isOptional,
  answerHint,
}: CheckInQuestionHeaderProps) => {
  const { t } = useUsNeTranslations();

  const optionalHint = t(($) => $.checkIn.questionPage.optional);
  const questionText = isOptional ? `${question} ${optionalHint}` : question;

  return (
    <>
      <QuestionText>{questionText}</QuestionText>
      {description !== undefined && (
        <QuestionDescription>{description}</QuestionDescription>
      )}
      {answerHint !== undefined && <AnswerHint>{answerHint}</AnswerHint>}
    </>
  );
};
