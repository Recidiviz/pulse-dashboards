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

import { Card, CardValue } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { useUsArTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import {
  Fill,
  ProgressFooter,
  ProgressLabel,
  Track,
} from "./EdovoProgressCard.styles";
import { EdovoProgressCardPresenter } from "./EdovoProgressCardPresenter";

const ManagedComponent: FC<{ presenter: EdovoProgressCardPresenter }> =
  observer(function EdovoProgressCard({ presenter }) {
    const { t } = useUsArTranslations();
    const { edovoTotalHours, edovoCarryInHours } = presenter.progress;
    const { hasCarryInHours, progressWidth } = presenter;

    return (
      <Card>
        <ProgressLabel>
          <div>
            <CardValue>{edovoTotalHours}</CardValue>
            {t(($) => $.programs.onMyTablet.progressBar.hoursCompleted)}
          </div>
          <div>{t(($) => $.programs.onMyTablet.progressBar.scale)}</div>
        </ProgressLabel>
        <Track>
          <Fill $width={progressWidth} />
        </Track>
        <ProgressFooter>
          {hasCarryInHours &&
            t(($) => $.programs.onMyTablet.progressBar.carriedIn, {
              count: edovoCarryInHours,
            })}
        </ProgressFooter>
      </Card>
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
