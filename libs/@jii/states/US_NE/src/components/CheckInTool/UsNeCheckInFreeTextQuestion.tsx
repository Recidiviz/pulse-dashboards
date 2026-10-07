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

import { checkInQuestionConfig, CheckInQuestionId } from "~@jii/configs";
import { useUsNeTranslations } from "~@jii/translation";

import { useResidentGivenNames } from "./hooks/useResidentGivenNames";
import {
  OptionalHint,
  QuestionText,
  TextEntry,
} from "./UsNeCheckInQuestion.styles";

export const UsNeCheckInFreeTextQuestion = ({
  id,
}: {
  id: CheckInQuestionId;
}) => {
  const { t } = useUsNeTranslations();
  const isOptional = !!checkInQuestionConfig[id].optional;

  const questionCopy = t(($) => $.checkIn.questions[id], {
    returnObjects: true,
    name: useResidentGivenNames(),
  });

  return (
    <>
      <QuestionText>{questionCopy.question}</QuestionText>
      {isOptional && (
        <OptionalHint>{t(($) => $.checkIn.questionPage.optional)}</OptionalHint>
      )}
      <TextEntry />
    </>
  );
};
