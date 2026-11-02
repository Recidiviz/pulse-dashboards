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
import { rem } from "polished";

import { Button, Icon, palette } from "~design-system";

import {
  LevelBreakdowns,
  overrideQuestions,
  OverrideType,
  SecurityLevel,
  UsMiInitialClassificationForm,
} from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { FormStages } from "../FormUsMiClassification";
import { FormFooter, QuestionBox, QuestionStatusBadge } from "../Styles";
import {
  BannerRow,
  LevelColumn,
  LevelDividers,
  LevelSummary,
  OverrideContainer,
  OverrideSelect,
  OverridesTitle,
  OverrideText,
  PointerRow,
  PointRange,
  PointsBySection,
  SectionDivider,
  SectionRow,
  SubHeader,
  TopBanner,
  TotalRow,
} from "./OverrideStyle";

function calculateDividers(total: number, range: string): number {
  const minMax = range.split("-");
  return ((Number(minMax[1]) - Number(minMax[0])) / total) * 100;
}

const OverrideQuestion = observer(function OverrideQuestion({
  override,
  index,
}: {
  override: OverrideType;
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
      <OverrideText $color={palette.text.primary}>
        {override.title}
      </OverrideText>
      <OverrideText $padding="5px 0" $fontSize={15}>
        {override.description}
      </OverrideText>
      <OverrideText $color={palette.text.primary} $padding="5px 0">
        {override.reasonsTitle}
      </OverrideText>
      <OverrideSelect
        value={override.reasons[overrideInput]}
        onChange={(e) => updateOverride(e.target.selectedIndex)}
      >
        {override.reasons.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </OverrideSelect>
      <hr style={{ width: "100%", color: palette.slate70 }} />
      <SubHeader id="sub-header">
        <OverrideText $color={palette.text.primary}>
          {override.levelTitle}
        </OverrideText>
        {required && (
          <QuestionStatusBadge $status="REQUIRED">REQUIRED</QuestionStatusBadge>
        )}
      </SubHeader>
      <OverrideText $padding="5px 0" $fontSize={15}>
        {override.levelSubText}
      </OverrideText>
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
        <OverrideText as="span" $padding="5px 0">
          Available once a {override.reasonsTitle.toLowerCase()} is selected.
        </OverrideText>
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

    const { derivedData, subsections, displayCustodyLevel, proceedToPreview } =
      form;

    const { totalScore, subscores } = derivedData;

    // Checking only the lower bound rounds a score that falls between two
    // ranges down to the lower level, and anything above the last range
    // lands in the top level.
    const calculateLevel = () => {
      const index = LevelBreakdowns.findLastIndex(
        (level) => Number(level.range.split("-")[0]) <= totalScore,
      );
      return Math.max(index, 0);
    };

    const calculatedLevel = calculateLevel();
    const totalScoreString = `${totalScore} pts - ${SecurityLevel[calculatedLevel]}`;
    const pointerPosition = (totalScore / 60) * 100;

    return (
      <OverrideContainer>
        <TopBanner id="top-banner">
          <BannerRow>
            <LevelSummary>
              <LevelColumn>
                <OverrideText $fontSize={14}>CURRENT LEVEL</OverrideText>
                <OverrideText $color={palette.text.primary} $fontSize={22}>
                  {displayCustodyLevel}
                </OverrideText>
              </LevelColumn>
              <Icon kind="Arrow" size={14} style={{ display: "inline" }} />
              <LevelColumn>
                <OverrideText $fontSize={14}>CALCULATED LEVEL</OverrideText>
                <OverrideText $color={palette.text.primary} $fontSize={26}>
                  {SecurityLevel[calculatedLevel]}
                </OverrideText>
              </LevelColumn>
            </LevelSummary>
            <PointsBySection id="points-by-section">
              <OverrideText $fontSize={13} $fontWeight={600}>
                POINTS BY SECTION
              </OverrideText>
              {subsections.map((subsection, index) => {
                return (
                  <SectionRow key={subsection}>
                    <OverrideText $fontSize={14}>{subsection}</OverrideText>
                    <div>{subscores[index]}</div>
                  </SectionRow>
                );
              })}
              <SectionDivider />
              <TotalRow>
                <OverrideText $color={palette.text.primary} $fontWeight={600}>
                  Total Points
                </OverrideText>
                <div>{totalScore}</div>
              </TotalRow>
            </PointsBySection>
          </BannerRow>
          <SectionDivider />
          <div>Point ranges</div>
          <div style={{ width: "100%" }}>
            <PointerRow
              $width={Math.min(
                pointerPosition + totalScoreString.length / 2,
                100,
              )}
            >
              {totalScoreString}
            </PointerRow>
            <PointerRow
              id="pointer-hover"
              $width={Math.min(pointerPosition, 100)}
            >
              |
            </PointerRow>
          </div>
          <PointRange id="point-range">
            {LevelBreakdowns.map((level, index) => {
              const width = calculateDividers(60, level.range);
              return (
                <LevelDividers
                  key={level.title}
                  $width={width}
                  $current={calculatedLevel === index}
                >
                  <div>{level.title}</div>
                  <OverrideText
                    $color={
                      calculatedLevel !== index
                        ? palette.slate80
                        : palette.marble5
                    }
                    $fontSize={14}
                  >
                    {level.range}
                  </OverrideText>
                </LevelDividers>
              );
            })}
          </PointRange>
        </TopBanner>
        <div>
          <OverridesTitle>Overrides</OverridesTitle>
          <div style={{ fontSize: rem(15), marginBottom: "5px" }}>
            Both are optional. Leave “No override” selected to keep the
            calculated level.
          </div>
          {overrideQuestions.map((override, index) => (
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
          <Button type="button" kind="primary" disabled={!proceedToPreview}>
            Continue to Summary
          </Button>
        </FormFooter>
      </OverrideContainer>
    );
  },
);
