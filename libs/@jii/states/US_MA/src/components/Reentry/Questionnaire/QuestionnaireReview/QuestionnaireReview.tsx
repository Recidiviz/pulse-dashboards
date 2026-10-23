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

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedHash } from "react-router-typesafe-routes/dom";

import { useScrollToHash } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { Button, Icon } from "~design-system";

import { Callout } from "../../Callout/Callout";
import { QuestionnaireFooter } from "../QuestionnaireFooter/QuestionnaireFooter";
import { QuestionnaireReviewEntry, SaveErrorKind } from "../types";
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
  onSubmit: () => void;
  saveError?: SaveErrorKind;
};

type EditReviewProps = ReviewBaseProps & {
  isEditing: true;
  savedBanner?: { onDismiss: () => void; onGoToChecklist: () => void };
};

export type QuestionnaireReviewProps = SubmitReviewProps | EditReviewProps;

export const QuestionnaireReview = (props: QuestionnaireReviewProps) => {
  const { entries, isEditing } = props;
  const { t } = useUsMaTranslations();
  const navigate = useNavigate();

  // The question the URL hash points at, set by the checklist's "Change
  // answer" links.
  const questionIdFromHash = useTypedHash(
    State.Resident.UsMaReentry.Questionnaire,
  );
  const hashTargetRef = useRef<HTMLDivElement>(null);

  useScrollToHash();

  // Focuses the hash target's row so screen readers start there.
  useEffect(() => {
    if (!questionIdFromHash) return;
    hashTargetRef.current?.focus({ preventScroll: true });
  }, [questionIdFromHash]);

  const changeAnswer = (onEdit: () => void) => {
    // Clears the hash before editing, so the Review page doesn't scroll
    // back to and highlight that question afterward.
    navigate({ hash: "" }, { replace: true });
    onEdit();
  };

  const savedBanner = isEditing ? props.savedBanner : undefined;

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
        {entries.map((entry) => {
          const isHashTarget = entry.questionId === questionIdFromHash;

          return (
            <Entry
              key={entry.questionId}
              id={entry.questionId}
              ref={isHashTarget ? hashTargetRef : undefined}
              tabIndex={isHashTarget ? -1 : undefined}
              $isHashTarget={isHashTarget}
            >
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
              <ChangeLink
                kind="link"
                onClick={() => changeAnswer(entry.onEdit)}
              >
                {t(($) => $.reentry.questionnaire.review.change)}
              </ChangeLink>
            </Entry>
          );
        })}
      </EntryList>

      {!isEditing && (
        <QuestionnaireFooter onBack={props.onBack} saveError={props.saveError}>
          <Button
            kind="primary"
            onClick={props.onSubmit}
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
