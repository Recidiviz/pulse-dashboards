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

import { ColumnDef } from "@tanstack/react-table";

import { getSubStageLabel } from "~@idaho-th/client/utils/applications";
import {
  APPLICATION_STAGE,
  ApplicationIntakeStatus,
  STAGES_WITHOUT_SUBSTAGE,
} from "~@idaho-th/shared";

import { STAGE_LABELS } from "../../../../constants/common";
import { HousingApplication } from "../../../../interfaces/common";
import CornerDownRightIcon from "../../../assets/tabler-icon-corner-down-right.svg?react";
import * as Styled from "../ApplicationsTable.styles";

export const stageColumn: ColumnDef<HousingApplication> = {
  id: "stage",
  accessorKey: "stage",
  enableSorting: true,
  header: "Stage",
  cell: ({ row }) => {
    const application = row.original;
    const isDraft = application.intakeStatus === ApplicationIntakeStatus.DRAFT;
    const stage = application.stage ?? "";
    const subStage = application.subStage;
    const releaseTaskProgress = application.releaseTaskProgress;
    const subStageLabel = getSubStageLabel({
      stage,
      subStage,
      releaseTaskProgress,
    });
    const showSubStage =
      !isDraft &&
      (stage === APPLICATION_STAGE.CLOSED ||
        !STAGES_WITHOUT_SUBSTAGE.has(stage)) &&
      subStageLabel.length > 0;
    return (
      <Styled.StageCell>
        <Styled.CellSlot>
          <Styled.StageContent>
            <Styled.StageTitle>
              {isDraft ? "Draft" : STAGE_LABELS[application.stage] ?? stage}
            </Styled.StageTitle>
            {showSubStage && (
              <Styled.StageSubstageRow>
                <Styled.StageSubstageIcon>
                  <CornerDownRightIcon />
                </Styled.StageSubstageIcon>
                <Styled.StageSubstageText>
                  {subStageLabel}
                </Styled.StageSubstageText>
              </Styled.StageSubstageRow>
            )}
          </Styled.StageContent>
        </Styled.CellSlot>
      </Styled.StageCell>
    );
  },
};
