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
import { FC, useState } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import {
  BottomSheet,
  Card,
  CardValue,
  HomepageSectionHeading,
  OverlayBody,
  OverlayHeading,
} from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { CompletedHoursBanner } from "./CompletedHoursBanner";
import {
  Fill,
  LearnMoreButton,
  ProgressFooter,
  ProgressLabel,
  Track,
} from "./EdovoProgressCard.styles";
import { EdovoProgressCardPresenter } from "./EdovoProgressCardPresenter";

const ManagedComponent: FC<{ presenter: EdovoProgressCardPresenter }> =
  observer(function EdovoProgressCard({ presenter }) {
    const { t } = useUsArTranslations();
    const { edovoTotalHours, edovoCarryInHours, edovoIsCreditingMonth } =
      presenter.progress;
    const { hasCarryInHours, progressWidth, totalHoursExceedsOneCredit } =
      presenter;
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const params = useTypedParams(State.Resident.UsArMoreInformation);
    const policyUrl =
      State.Resident.UsArMoreInformation.EarnedReleaseCredits.buildPath(params);

    return (
      <>
        <HomepageSectionHeading>
          {t(($) => $.programs.onMyTablet.progressBar.title)}
        </HomepageSectionHeading>
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
              })}{" "}
            <LearnMoreButton
              kind="link"
              onClick={() => {
                setIsOverlayOpen(true);
              }}
            >
              {t(($) => $.programs.onMyTablet.progressBar.learnMore)}
            </LearnMoreButton>
            <BottomSheet
              isOpen={isOverlayOpen}
              onRequestClose={() => setIsOverlayOpen(false)}
              ariaLabel={t(
                ($) => $.programs.onMyTablet.progressBar.overlay.heading,
              )}
            >
              <OverlayHeading>
                {t(($) => $.programs.onMyTablet.progressBar.overlay.heading)}
              </OverlayHeading>
              <OverlayBody>
                {t(($) => $.programs.onMyTablet.progressBar.overlay.body, {
                  policyUrl,
                })}
              </OverlayBody>
            </BottomSheet>
          </ProgressFooter>
        </Card>
        {edovoIsCreditingMonth && (
          <CompletedHoursBanner
            totalHoursExceedsOneCredit={totalHoursExceedsOneCredit}
          />
        )}
      </>
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
