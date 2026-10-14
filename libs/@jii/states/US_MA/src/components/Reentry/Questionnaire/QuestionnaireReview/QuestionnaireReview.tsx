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

import Markdown from "markdown-to-jsx";
import { useState } from "react";

import { useUsMaTranslations } from "~@jii/translation";
import { Button, Icon } from "~design-system";

import { Callout } from "../../Callout/Callout";
import { QuestionnaireFooter } from "../QuestionnaireFooter/QuestionnaireFooter";
import { QuestionnaireReviewEntry, SaveOptions } from "../types";
import {
  ChangeLink,
  Description,
  Entry,
  EntryAnswer,
  EntryAnswerRow,
  EntryList,
  EntryQuestion,
  EntryText,
  Heading,
  UpdatedBadge,
  Wrapper,
} from "./QuestionnaireReview.styles";

type ReviewBaseProps = {
  entries: QuestionnaireReviewEntry[];
  isSaving?: boolean;
};

type SubmitReviewProps = ReviewBaseProps & {
  isEditing?: false;
  onBack: () => void;
  onSubmit: (options?: SaveOptions) => void;
};

type EditReviewProps = ReviewBaseProps & {
  isEditing: true;
  savedBanner?: { onDismiss: () => void; onGoToChecklist: () => void };
};

export type QuestionnaireReviewProps = SubmitReviewProps | EditReviewProps;

export const QuestionnaireReview = (props: QuestionnaireReviewProps) => {
  const { entries, isEditing } = props;
  const { t } = useUsMaTranslations();
  const [hasSubmitError, setHasSubmitError] = useState(false);

  const savedBanner = isEditing ? props.savedBanner : undefined;
  const submitError = hasSubmitError ? (
    <Markdown options={{ forceInline: true }}>
      {t(($) => $.reentry.questionnaire.review.submitError)}
    </Markdown>
  ) : undefined;

  const handleSubmit = (onSubmit: SubmitReviewProps["onSubmit"]) => {
    setHasSubmitError(false);
    onSubmit({ onSaveError: () => setHasSubmitError(true) });
  };

  return (
    <Wrapper>
      {savedBanner && (
        <Callout
          tone="success"
          icon={<Icon kind="Success" size={24} />}
          description={t(
            ($) => $.reentry.questionnaire.review.savedBanner.message,
          )}
          action={
            <Button kind="link" onClick={savedBanner.onGoToChecklist}>
              {t(($) => $.reentry.questionnaire.review.savedBanner.cta)}
            </Button>
          }
          dismiss={{
            label: t(($) => $.reentry.questionnaire.review.savedBanner.dismiss),
            onClick: savedBanner.onDismiss,
          }}
        />
      )}
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
              <EntryAnswerRow>
                <EntryAnswer>{entry.answerText}</EntryAnswer>
                {entry.isUpdated && (
                  <UpdatedBadge>
                    {t(($) => $.reentry.questionnaire.review.answerUpdated)}
                  </UpdatedBadge>
                )}
              </EntryAnswerRow>
            </EntryText>
            <ChangeLink kind="link" onClick={entry.onEdit}>
              {t(($) => $.reentry.questionnaire.review.change)}
            </ChangeLink>
          </Entry>
        ))}
      </EntryList>

      {!isEditing && (
        <QuestionnaireFooter onBack={props.onBack} error={submitError}>
          <Button
            kind="primary"
            onClick={() => handleSubmit(props.onSubmit)}
            disabled={props.isSaving}
            aria-busy={props.isSaving}
          >
            {props.isSaving
              ? t(($) => $.reentry.questionnaire.review.submitting)
              : t(($) => $.reentry.questionnaire.review.submit)}
          </Button>
        </QuestionnaireFooter>
      )}
    </Wrapper>
  );
};
