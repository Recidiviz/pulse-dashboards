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
import { FC, Fragment } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import {
  ActivityList,
  HomepageSectionHeading,
  RowDivider,
  SlateCopy,
} from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { EdovoProgressHistoryListPresenter } from "./EdovoProgressHistoryListPresenter";
import { EdovoProgressHistoryRow } from "./EdovoProgressHistoryRow";

const ManagedComponent: FC<{ presenter: EdovoProgressHistoryListPresenter }> =
  observer(function EdovoProgressHistoryList({ presenter }) {
    const { recentMonths } = presenter;
    const { t } = useUsArTranslations();
    const pathParams = useTypedParams(State.Resident);

    const policyUrl =
      State.Resident.UsArMoreInformation.EarnedReleaseCredits.buildPath(
        pathParams,
      );
    const extraHoursUrl = policyUrl + "#extraHours";

    if (recentMonths.length === 0) return null;

    return (
      <>
        <HomepageSectionHeading>
          {t(($) => $.programs.onMyTablet.history.heading)}
        </HomepageSectionHeading>
        <ActivityList>
          {recentMonths.map((activity) => (
            <Fragment key={activity.completionMonth.getTime()}>
              <EdovoProgressHistoryRow activity={activity} />
              <RowDivider />
            </Fragment>
          ))}
        </ActivityList>
        <SlateCopy options={{ forceBlock: true }}>
          {`${t(($) => $.programs.onMyTablet.history.explainer)} ${t(
            ($) => $.programs.onMyTablet.history.extraHoursLink,
            { extraHoursUrl },
          )}`}
        </SlateCopy>
      </>
    );
  });

function usePresenter() {
  const metadata = useResidentMetadata("US_AR");

  return new EdovoProgressHistoryListPresenter(metadata);
}

export const EdovoProgressHistoryList = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
