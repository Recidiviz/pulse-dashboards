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

import { deleteField } from "firebase/firestore";
import { observer } from "mobx-react-lite";

import { usMiOverrideQuestions, UsMiOverrideType } from "~datatypes";
import { Button, palette } from "~design-system";

import { UsMiInitialClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { FormStages } from "../FormUsMiClassification";
import { FormFooter, QuestionBox, QuestionStatusBadge } from "../Styles";
import {
  ClassificationText,
  OverrideContainer,
  OverrideDivider,
  OverrideSelect,
  OverridesTitle,
  SubHeader,
} from "./OverrideStyle";
import { SummaryBanner } from "./SummaryBanner";

const OverrideQuestion = observer(function OverrideQuestion({
  override,
  index,
}: {
  override: UsMiOverrideType;
  index: number;
}) {
  const overrideKey = `override${index}_1Selection`;
  const levelKey = `override${index}_2Selection`;
  const opportunityForm = useOpportunityFormContext();

  const savedOverride = opportunityForm.formData[overrideKey];
  const overrideInput = typeof savedOverride === "number" ? savedOverride : 0;
  const savedLevel = opportunityForm.formData[levelKey];
  const levelInput = typeof savedLevel === "number" ? savedLevel : 0;

  const levelDisabled = overrideInput === 0;
  const required = !levelDisabled && levelInput === 0;

  const updateOverride = (value: number) => {
    if (value === 0) {
      // Going back to "No override" also clears the level chosen for it
      opportunityForm.updateDraftData(levelKey, deleteField());
      opportunityForm.updateDraftData(overrideKey, deleteField());
      return;
    }
    opportunityForm.updateDraftData(overrideKey, value);
  };

  const updateLevel = (value: number) => {
    opportunityForm.updateDraftData(levelKey, value);
  };

  const levels = ["Select a level...", ...override.levels];

  return (
    <QuestionBox>
      <ClassificationText $color={palette.text.primary}>
        {override.title}
      </ClassificationText>
      <ClassificationText $padding="5px 0" $fontSize={15}>
        {override.description}
      </ClassificationText>
      <ClassificationText $color={palette.text.primary} $padding="5px 0">
        {override.reasonsTitle}
      </ClassificationText>
      <OverrideSelect
        value={override.reasons[overrideInput]}
        onChange={(e) => updateOverride(e.target.selectedIndex)}
      >
        {override.reasons.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </OverrideSelect>
      <OverrideDivider />
      <SubHeader id="sub-header">
        <ClassificationText $color={palette.text.primary}>
          {override.levelTitle}
        </ClassificationText>
        {required && (
          <QuestionStatusBadge $status="REQUIRED">REQUIRED</QuestionStatusBadge>
        )}
      </SubHeader>
      <ClassificationText $padding="5px 0" $fontSize={15}>
        {override.levelSubText}
      </ClassificationText>
      <OverrideSelect
        disabled={levelDisabled}
        value={levels[levelInput]}
        onChange={(e) => updateLevel(e.target.selectedIndex)}
      >
        {levels.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </OverrideSelect>
      {levelDisabled && (
        <ClassificationText as="span" $padding="5px 0">
          Available once a {override.reasonsTitle.toLowerCase()} is selected.
        </ClassificationText>
      )}
    </QuestionBox>
  );
});

export const UsMiClassificationOverrides = observer(
  function UsMiClassificationOverrides({
    onChangeNavigation,
  }: {
    onChangeNavigation: (page: FormStages) => void;
  }) {
    const form = useOpportunityFormContext() as
      | UsMiInitialClassificationForm
      | UsMiReviewClassificationForm;

    const { proceedToPreview } = form;

    return (
      <OverrideContainer>
        <SummaryBanner />
        <div>
          <OverridesTitle>Overrides</OverridesTitle>
          <ClassificationText $fontSize={15} $padding="0 0 5px">
            Both are optional. Leave “No override” selected to keep the
            calculated level.
          </ClassificationText>
          {usMiOverrideQuestions.map((override, index) => (
            <OverrideQuestion
              key={override.title}
              index={index + 1}
              override={override}
            />
          ))}
        </div>
        <FormFooter>
          <Button
            type="button"
            kind="secondary"
            onClick={() => onChangeNavigation("FORM")}
          >
            Back
          </Button>
          <Button
            type="button"
            kind="primary"
            disabled={!proceedToPreview}
            onClick={() => onChangeNavigation("PREVIEW")}
          >
            Continue to Summary
          </Button>
        </FormFooter>
      </OverrideContainer>
    );
  },
);
