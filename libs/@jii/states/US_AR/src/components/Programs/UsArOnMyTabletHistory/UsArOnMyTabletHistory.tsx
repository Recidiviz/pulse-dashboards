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
import { rem } from "polished";
import { FC, Fragment } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import {
  ActivityList,
  ActivityRow,
  BackLink,
  HomepageSectionHeading,
  RowDivider,
} from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";
import { spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { EdovoProgressHistoryRow } from "../EdovoProgressHistoryList/EdovoProgressHistoryRow";
import { UsArOnMyTabletHistoryPresenter } from "./UsArOnMyTabletHistoryPresenter";

const StyledList = styled(ActivityList)`
  margin-top: ${rem(spacing.xl)};
`;

const StyledRow = styled(ActivityRow)`
  margin-bottom: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
`;

const Year = styled.div`
  font-weight: 600;
  font-size: 1.25rem;
`;

const Heading = styled(HomepageSectionHeading)`
  padding-top: ${rem(spacing.lg)};
`;

const ManagedComponent: FC<{ presenter: UsArOnMyTabletHistoryPresenter }> =
  observer(function UsArOnMyTabletHistory({ presenter }) {
    const { groupedMonthsByYear, orderedYears } = presenter;
    const { t } = useUsArTranslations();
    const pathParams = useTypedParams(State.Resident);

    return (
      <section>
        <BackLink
          to={State.Resident.ProgramCatalog.OnMyTablet.buildPath(pathParams)}
        >
          {t(($) => $.moreInformation.backLink.onMyTablet)}
        </BackLink>
        <Heading>{t(($) => $.programs.onMyTablet.history.heading)}</Heading>
        {orderedYears.map((year) => (
          <StyledList key={year}>
            <StyledRow>
              <Year>{year}</Year>
            </StyledRow>
            {groupedMonthsByYear[year].map((activity) => (
              <Fragment key={activity.completionMonth.getTime()}>
                <EdovoProgressHistoryRow activity={activity} />
                <RowDivider />
              </Fragment>
            ))}
          </StyledList>
        ))}
      </section>
    );
  });

function usePresenter() {
  const metadata = useResidentMetadata("US_AR");

  return new UsArOnMyTabletHistoryPresenter(metadata);
}

export const UsArOnMyTabletHistory = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
