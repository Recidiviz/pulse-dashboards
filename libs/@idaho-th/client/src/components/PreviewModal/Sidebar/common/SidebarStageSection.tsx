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

import { Fragment } from "react";

import {
  ApplicationStage,
  ApplicationSubStage,
} from "~@idaho-th/client/interfaces/common";
import {
  APPLICATION_STAGE,
  DEFAULT_NEW_HOUSING_APPLICATION,
  STAGES_WITHOUT_SUBSTAGE,
} from "~@idaho-th/shared";

import { STAGE_LABELS, SUB_STAGE_LABELS } from "../../../../constants/common";
import CornerDownRightIcon from "../../../assets/tabler-icon-corner-down-right.svg?react";
import * as Styled from "../../PreviewModal.styles";

// DRAFT is a transient pre-submission state, not a workflow stage: draft
// applications never open this modal, so it must not appear in the progress
// bar.
const STAGE_ORDER: ApplicationStage[] = Object.values(APPLICATION_STAGE).filter(
  (stage) => stage !== APPLICATION_STAGE.DRAFT,
);

interface SidebarStageSectionProps {
  substageText?: string;
  stage: ApplicationStage | undefined;
  subStage: ApplicationSubStage | undefined;
}

/** Read-only stage progress: stages advance from the tab that owns each step. */
export const SidebarStageSection: React.FC<SidebarStageSectionProps> =
  function SidebarStageSection({ substageText, stage, subStage }) {
    const resolvedStage = stage ?? DEFAULT_NEW_HOUSING_APPLICATION.stage;
    const resolvedSubStage =
      subStage ?? DEFAULT_NEW_HOUSING_APPLICATION.subStage;
    const resolvedSubstageText =
      substageText ?? SUB_STAGE_LABELS[resolvedSubStage] ?? resolvedSubStage;
    const showSubStage =
      resolvedStage === APPLICATION_STAGE.CLOSED ||
      !STAGES_WITHOUT_SUBSTAGE.has(resolvedStage);
    const activeStageIndex = STAGE_ORDER.indexOf(resolvedStage);
    const isClosed = resolvedStage === APPLICATION_STAGE.CLOSED;

    return (
      <Styled.StageSection>
        <Styled.StageHeaderRow>
          <Styled.StageLabel>Stage</Styled.StageLabel>
        </Styled.StageHeaderRow>

        <Styled.StageIndicator>
          <Styled.StageProgressContainer>
            {STAGE_ORDER.map((stageId, index) => {
              let state: "completed" | "active" | "upcoming" = "upcoming";
              if (
                index < activeStageIndex ||
                (index === activeStageIndex && isClosed)
              ) {
                state = "completed";
              } else if (index === activeStageIndex) {
                state = "active";
              }

              return (
                <Fragment key={stageId}>
                  <Styled.StageStep>
                    <Styled.ProgressDot $state={state} />
                    <Styled.StageStepLabel $active={index === activeStageIndex}>
                      {STAGE_LABELS[stageId] ?? stageId}
                    </Styled.StageStepLabel>
                  </Styled.StageStep>
                  {index < STAGE_ORDER.length - 1 && <Styled.StageConnector />}
                </Fragment>
              );
            })}
          </Styled.StageProgressContainer>
          {showSubStage && (
            <Styled.SubstageRow>
              <Styled.SubstageIcon>
                <CornerDownRightIcon />
              </Styled.SubstageIcon>
              <Styled.SubstageText>{resolvedSubstageText}</Styled.SubstageText>
            </Styled.SubstageRow>
          )}
        </Styled.StageIndicator>
      </Styled.StageSection>
    );
  };
