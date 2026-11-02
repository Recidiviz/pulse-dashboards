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
import { FC } from "react";

import { SlateCopy } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { useUsArTranslations } from "~@jii/translation";
import { Icon, palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import {
  CARRY_IN_COLOR,
  CheckCircle,
  CURRENT_MONTH_COLOR,
  Fill,
  HoursToGo,
  LegendSwatch,
  ProgressBarWrapper,
  ProgressCard,
  ProgressLabel,
  RightColumn,
  ScaleLabel,
  Track,
} from "./EdovoProgressCard.styles";
import { EdovoProgressCardPresenter } from "./EdovoProgressCardPresenter";

const ManagedComponent: FC<{ presenter: EdovoProgressCardPresenter }> =
  observer(function EdovoProgressCard({ presenter }) {
    const { t } = useUsArTranslations();
    const { edovoCarryInHours, edovoHoursToNextCpu, edovoIsCreditingMonth } =
      presenter.progress;

    const {
      currentMonthWidth,
      carryInWidth,
      totalHours,
      hasCarryInHours,
      completedKey,
    } = presenter;

    return (
      <ProgressCard>
        <ProgressLabel>
          <div>
            <SlateCopy>
              {t(($) => $.programs.onMyTablet.progressBar[completedKey], {
                hours: totalHours,
              })}
            </SlateCopy>
            {hasCarryInHours && (
              <div>
                <LegendSwatch />
                {t(($) => $.programs.onMyTablet.progressBar.carriedIn, {
                  count: edovoCarryInHours,
                })}
              </div>
            )}
          </div>
          <RightColumn>
            <HoursToGo>{edovoHoursToNextCpu}</HoursToGo>
            <div>
              {t(($) => $.programs.onMyTablet.progressBar.hoursToGo, {
                count: edovoHoursToNextCpu,
              })}
            </div>
          </RightColumn>
        </ProgressLabel>
        <ProgressBarWrapper>
          <Track>
            <Fill $width={carryInWidth} $color={CARRY_IN_COLOR} />
            <Fill $width={currentMonthWidth} $color={CURRENT_MONTH_COLOR} />
          </Track>
          {edovoIsCreditingMonth && (
            <CheckCircle>
              <Icon kind="Check" size={16} color={palette.pine1} />
            </CheckCircle>
          )}
        </ProgressBarWrapper>
        <ScaleLabel>
          {t(($) => $.programs.onMyTablet.progressBar.scale)}
        </ScaleLabel>
      </ProgressCard>
    );
  });

function usePresenter() {
  const metadata = useResidentMetadata("US_AR");

  return new EdovoProgressCardPresenter(metadata);
}

export const EdovoProgressCard = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
