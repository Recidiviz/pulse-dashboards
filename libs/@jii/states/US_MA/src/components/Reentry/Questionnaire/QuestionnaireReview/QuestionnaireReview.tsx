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
import { Button } from "~design-system";

import { QuestionnaireFooter } from "../QuestionnaireFooter/QuestionnaireFooter";
import { QuestionnaireReviewEntry } from "../types";
import {
  ChangeLink,
  Description,
  Entry,
  EntryAnswer,
  EntryList,
  EntryQuestion,
  EntryText,
  Heading,
  Wrapper,
} from "./QuestionnaireReview.styles";

type ReviewBaseProps = {
  entries: QuestionnaireReviewEntry[];
};

type SubmitReviewProps = ReviewBaseProps & {
  isEditing?: false;
  onBack: () => void;
  onSubmit: () => void;
};

type EditReviewProps = ReviewBaseProps & {
  isEditing: true;
};

export type QuestionnaireReviewProps = SubmitReviewProps | EditReviewProps;

export const QuestionnaireReview = (props: QuestionnaireReviewProps) => {
  const { entries, isEditing } = props;
  const { t } = useUsMaTranslations();

  return (
    <Wrapper>
      <Heading>
        {isEditing
          ? t(($) => $.reentry.questionnaire.review.editHeading)
          : t(($) => $.reentry.questionnaire.review.heading)}
      </Heading>
      <Description>
        {isEditing
          ? t(($) => $.reentry.questionnaire.review.editDescription)
          : t(($) => $.reentry.questionnaire.review.description)}
      </Description>

      <EntryList>
        {entries.map((entry) => (
          <Entry key={entry.questionId}>
            <EntryText>
              <EntryQuestion>{entry.heading}</EntryQuestion>
              <EntryAnswer>{entry.answerText}</EntryAnswer>
            </EntryText>
            <ChangeLink kind="link" onClick={entry.onEdit}>
              {t(($) => $.reentry.questionnaire.review.change)}
            </ChangeLink>
          </Entry>
        ))}
      </EntryList>

      {!isEditing && (
        <QuestionnaireFooter onBack={props.onBack}>
          <Button kind="primary" onClick={props.onSubmit}>
            {t(($) => $.reentry.questionnaire.review.submit)}
          </Button>
        </QuestionnaireFooter>
      )}
    </Wrapper>
  );
};
