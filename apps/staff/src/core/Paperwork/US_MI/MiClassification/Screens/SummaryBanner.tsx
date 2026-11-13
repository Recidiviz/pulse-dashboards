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

import {
  calculateUsMiClassificationLevels,
  US_MI_MAX_TOTAL_SCORE,
  usMiLevelBreakdowns,
} from "~datatypes";
import { Icon, palette } from "~design-system";

import { UsMiInitialClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import {
  BannerContent,
  BannerRow,
  ClassificationText,
  FinalBannerHeader,
  FinalBannerHeaderLabel,
  FinalLevelCell,
  FinalLevelGrid,
  InlineArrow,
  LevelChange,
  LevelColumn,
  LevelDividers,
  LevelSummary,
  PointerContainer,
  PointerRow,
  PointRange,
  PointsBySection,
  SectionDivider,
  SectionRow,
  TopBanner,
  TotalRow,
  UpChevron,
} from "./OverrideStyle";

function calculateDividers(total: number, range: string): number {
  const minMax = range.split("-");
  return ((Number(minMax[1]) - Number(minMax[0])) / total) * 100;
}

export const SummaryBanner = observer(function SummaryBanner({
  final,
}: {
  final?: boolean;
}) {
  const form = useOpportunityFormContext() as
    | UsMiInitialClassificationForm
    | UsMiReviewClassificationForm;

  const { derivedData, subsections, displayCustodyLevel, formData } = form;

  const { totalScore, subscores } = derivedData;

  const {
    calculatedLevelIndex,
    calculatedLevel,
    trueLevel,
    actualLevel,
    levelChange,
  } = calculateUsMiClassificationLevels({
    totalScore,
    override1_2Selection: formData.override1_2Selection,
    override2_2Selection: formData.override2_2Selection,
    currentLevel: displayCustodyLevel,
  });
  const totalScoreString = `${totalScore} pts - ${calculatedLevel}`;
  const pointerPosition = (totalScore / US_MI_MAX_TOTAL_SCORE) * 100;

  return (
    <TopBanner id="top-banner" $final={final}>
      {final && (
        <FinalBannerHeader>
          <Icon kind="Success" size={20} color={palette.white} />
          <FinalBannerHeaderLabel>Final Classification</FinalBannerHeaderLabel>
        </FinalBannerHeader>
      )}
      <BannerContent>
        <BannerRow>
          {final ? (
            <FinalLevelGrid>
              <FinalLevelCell>Current Security Level</FinalLevelCell>
              <FinalLevelCell $value>{displayCustodyLevel}</FinalLevelCell>
              <FinalLevelCell>Calculated Security Level</FinalLevelCell>
              <FinalLevelCell $value>{calculatedLevel}</FinalLevelCell>
              <FinalLevelCell>True Security Level</FinalLevelCell>
              <FinalLevelCell $value>{trueLevel}</FinalLevelCell>
              <FinalLevelCell $placement>Actual Placement Level</FinalLevelCell>
              <FinalLevelCell $value $placement>
                {actualLevel}
                {levelChange === "DECREASE" && (
                  <LevelChange>
                    <Icon kind="DownChevron" size={10} />
                    <div>Downgrade from {displayCustodyLevel}</div>
                  </LevelChange>
                )}
                {levelChange === "INCREASE" && (
                  <LevelChange>
                    <UpChevron kind="DownChevron" size={10} />
                    <div>Increase from {displayCustodyLevel}</div>
                  </LevelChange>
                )}
              </FinalLevelCell>
            </FinalLevelGrid>
          ) : (
            <LevelSummary>
              <LevelColumn>
                <ClassificationText $fontSize={14}>
                  CURRENT LEVEL
                </ClassificationText>
                <ClassificationText
                  $color={palette.text.primary}
                  $fontSize={22}
                >
                  {displayCustodyLevel}
                </ClassificationText>
              </LevelColumn>
              <InlineArrow kind="Arrow" size={14} />
              <LevelColumn>
                <ClassificationText $fontSize={14}>
                  CALCULATED LEVEL
                </ClassificationText>
                <ClassificationText
                  $color={palette.text.primary}
                  $fontSize={26}
                >
                  {calculatedLevel}
                </ClassificationText>
              </LevelColumn>
            </LevelSummary>
          )}
          <PointsBySection id="points-by-section">
            <ClassificationText $fontSize={13} $fontWeight={600}>
              POINTS BY SECTION
            </ClassificationText>
            {subsections.map((subsection, index) => {
              return (
                <SectionRow key={subsection}>
                  <ClassificationText $fontSize={14}>
                    {subsection}
                  </ClassificationText>
                  <div>{subscores[index]}</div>
                </SectionRow>
              );
            })}
            <SectionDivider />
            <TotalRow>
              <ClassificationText $color={palette.text.primary}>
                Total Points
              </ClassificationText>
              <ClassificationText $color={palette.text.primary}>
                {totalScore}
              </ClassificationText>
            </TotalRow>
          </PointsBySection>
        </BannerRow>
        <SectionDivider />
        <div>Point ranges</div>
        <PointerContainer>
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
            // if start do we want to allocate more
            $width={Math.min(pointerPosition, 100)}
          >
            <Icon kind="DownChevron" color={palette.pine1} size={10} />
          </PointerRow>
        </PointerContainer>
        <PointRange id="point-range">
          {usMiLevelBreakdowns.map((level, index) => {
            const width = calculateDividers(US_MI_MAX_TOTAL_SCORE, level.range);
            return (
              <LevelDividers
                key={level.title}
                $width={width}
                $current={calculatedLevelIndex === index}
              >
                <div>{level.title}</div>
                <ClassificationText
                  $color={
                    calculatedLevelIndex !== index
                      ? palette.slate80
                      : palette.marble5
                  }
                  $fontSize={14}
                >
                  {level.range}
                </ClassificationText>
              </LevelDividers>
            );
          })}
        </PointRange>
      </BannerContent>
    </TopBanner>
  );
});
