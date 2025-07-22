// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { Card } from "../../../../../common/components/Card";
import { GoButton } from "../../../../../components/ButtonLink/GoButton";
import { CopyWrapper } from "../../../../../components/CopyWrapper/CopyWrapper";
import { hydrateTemplate } from "../../../../../configs/hydrateTemplate";
import { State } from "../../../../../routes/routes";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { CreditsByTypeCard } from "../../MonthlyReport/CreditsByTypeCard";
import { SectionHeading } from "../styles";
import { SlateCopy } from "../styles";
import { MonthlyReportPresenter } from "./MonthlyReportPresenter";
import { MonthlyReportSelector } from "./MonthlyReportSelector";

const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.lg)};
  height: ${rem(24)};
  margin: ${rem(spacing.sm)} 0;
`;

const ActivityList = styled.div`
  margin: ${rem(spacing.md)} 0;
`;

const ActivityRowDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: ${rem(spacing.xs)} ${rem(spacing.xxs)};

  &:last-child {
    display: none;
  }
`;

const ManagedComponent: FC<{
  presenter: MonthlyReportPresenter;
}> = observer(function MonthlyReportHomepageCard({ presenter }) {
  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
  } = presenter;

  return (
    <section>
      <SectionHeading>{presenter.homepageCopy.sectionTitle}</SectionHeading>
      <Card>
        <MonthlyReportSelector
          placeholder={presenter.selectPlaceholder}
          options={presenter.sortedSelectOptions}
          onChange={presenter.setSelectedMonthYearStartDate}
        />
        <CreditsByTypeCard
          copy={presenter.homepageCopy}
          credits={{
            totalEGTCreditDays,
            totalBoostCreditDays,
            totalCompletionCreditDays,
          }}
          marginTopBottom={rem(spacing.md)}
        />
        <ActivityList>
          {presenter.creditActivity.map((activity, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                <ActivityRow>
                  <CopyWrapper>{activity.activity}</CopyWrapper>
                  <SlateCopy>
                    {presenter.ratingDisplayName(activity.rating)}
                  </SlateCopy>
                </ActivityRow>
                <ActivityRowDivider />
              </React.Fragment>
            );
          })}
        </ActivityList>
        <GoButton
          to={State.Resident.EGT.$.MonthlyReport.buildRelativePath({
            reportDate: `${presenter.selectedMonthlyReport.pageSlug}`,
          })}
        >
          {hydrateTemplate(presenter.homepageCopy.individualReportLink, {
            monthDisplayName: presenter.selectedMonthlyReport.monthDisplayName,
          })}
        </GoButton>
      </Card>
    </section>
  );
});

function usePresenter() {
  const { copy, monthlyReports } = useEGTDataContext();

  return new MonthlyReportPresenter(monthlyReports, copy);
}

export const MonthlyReportHomepageCard = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
