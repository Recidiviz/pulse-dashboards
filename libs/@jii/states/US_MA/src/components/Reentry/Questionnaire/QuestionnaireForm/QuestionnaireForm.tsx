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
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from "~design-system";

import { QuestionnaireFooter } from "../QuestionnaireFooter/QuestionnaireFooter";
import { QuestionAnswerValue, QuestionDisplay, SaveOptions } from "../types";
import {
  Heading,
  NextButton,
  OptionCard,
  OptionsList,
  SaveHint,
  SelectionHint,
  WhyWeAsk,
  WhyWeAskLabel,
  WhyWeAskText,
  Wrapper,
} from "./QuestionnaireForm.styles";

export type QuestionnaireFormProps = {
  question: QuestionDisplay;
  value: QuestionAnswerValue | undefined;
  onChange: (value: QuestionAnswerValue) => void;
  onNext: (options?: SaveOptions) => void;
  onBack?: () => void;
  canGoNext: boolean;
  isSaving?: boolean;
  // Set when editing a completed profile via "Change" on Review.
  editing?: {
    onCancel: () => void;
    // Last question in the edited branch - Next becomes a save.
    isLastQuestionBeforeReview: boolean;
  };
};

export const QuestionnaireForm = ({
  question,
  value,
  onChange,
  onNext,
  onBack,
  canGoNext,
  isSaving,
  editing,
}: QuestionnaireFormProps) => {
  const { t } = useUsMaTranslations();
  const [hasSaveError, setHasSaveError] = useState(false);

  const isSaveAndUpdate = !!editing?.isLastQuestionBeforeReview;
  const nextLabel = t(($) => $.reentry.questionnaire.form.next);
  const primaryLabel = isSaveAndUpdate
    ? t(($) => $.reentry.questionnaire.form.saveAndUpdate)
    : nextLabel;
  const buttonLabel = isSaving
    ? t(($) => $.reentry.questionnaire.form.saving)
    : primaryLabel;
  const saveErrorMessage = isSaveAndUpdate
    ? t(($) => $.reentry.questionnaire.form.saveAndUpdateError)
    : t(($) => $.reentry.questionnaire.form.saveError);
  const saveError = hasSaveError ? (
    <Markdown options={{ forceInline: true }}>{saveErrorMessage}</Markdown>
  ) : undefined;

  const handleNext = () => {
    setHasSaveError(false);
    onNext({ onSaveError: () => setHasSaveError(true) });
  };

  const isCheckbox = question.format === "CHECKBOX";
  const selected = value ?? [];

  const OptionControl = isCheckbox ? Checkbox : Radio;
  const options = (
    <OptionsList>
      {question.options.map((option) => (
        <OptionCard
          key={option.value}
          $selected={selected.includes(option.value)}
        >
          <OptionControl value={option.value}>{option.label}</OptionControl>
        </OptionCard>
      ))}
    </OptionsList>
  );

  return (
    <Wrapper>
      <Heading>{question.heading}</Heading>
      {question.whyWeAsk && (
        <WhyWeAsk>
          <WhyWeAskLabel>
            {t(($) => $.reentry.questionnaire.form.whyWeAskLabel)}
          </WhyWeAskLabel>
          <WhyWeAskText>{question.whyWeAsk}</WhyWeAskText>
        </WhyWeAsk>
      )}
      <SelectionHint>
        {isCheckbox
          ? t(($) => $.reentry.questionnaire.form.multiSelectHint)
          : t(($) => $.reentry.questionnaire.form.singleSelectHint)}
      </SelectionHint>

      {isCheckbox ? (
        <CheckboxGroup
          value={selected}
          onChange={onChange}
          ariaLabel={question.heading}
        >
          {options}
        </CheckboxGroup>
      ) : (
        <RadioGroup
          value={selected[0]}
          onChange={(radioValue) => onChange([radioValue])}
          ariaLabel={question.heading}
        >
          {options}
        </RadioGroup>
      )}

      <QuestionnaireFooter
        onBack={onBack}
        onCancel={editing?.onCancel}
        error={saveError}
      >
        {!editing && (
          <SaveHint>
            {t(($) => $.reentry.questionnaire.form.saveHint)}{" "}
            <strong>{nextLabel}</strong>
          </SaveHint>
        )}
        <NextButton
          kind="primary"
          onClick={handleNext}
          disabled={!canGoNext || isSaving}
          aria-busy={isSaving}
        >
          {buttonLabel}
        </NextButton>
      </QuestionnaireFooter>
    </Wrapper>
  );
};
