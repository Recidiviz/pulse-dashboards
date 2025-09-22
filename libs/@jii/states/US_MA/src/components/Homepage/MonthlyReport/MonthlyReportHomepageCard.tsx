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

import {
  Card,
  CopyWrapper,
  GoButton,
  HomepageSectionHeading,
  SlateCopy,
} from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useEGTDataContext } from "../../EGTDataContext/context";
import { CreditsByTypeCard } from "../../MonthlyReport/CreditsByTypeCard";
import { MonthlyReportSelector } from "../../MonthlyReportSelector/MonthlyReportSelector";
import { MonthlyReportPresenter } from "./MonthlyReportPresenter";

export const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.lg)};
  height: ${rem(24)};
  margin: ${rem(spacing.sm)} 0;
`;

export const ActivityList = styled.div`
  margin: ${rem(spacing.md)} 0;
`;

export const ActivityRowDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: ${rem(spacing.xs)} ${rem(spacing.xxs)};

  &:last-child {
    display: none;
  }
`;

const ManagedComponent: FC<{
  presenter: MonthlyReportPresenter;
}> = observer(function MonthlyReportHomepageCard({ presenter }) {
  const { t } = useUsMaTranslations();

  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
  } = presenter;

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.home.monthlyReport.sectionTitle)}
      </HomepageSectionHeading>
      <Card>
        <MonthlyReportSelector
          selectedReport={presenter.selectedMonthlyReport}
          onChange={presenter.setSelectedMonthYearStartDate}
        />
        <CreditsByTypeCard
          credits={{
            totalEGTCreditDays,
            totalBoostCreditDays,
            totalCompletionCreditDays,
          }}
          marginTopBottom={rem(spacing.md)}
        />
        <ActivityList>
          {presenter.creditActivity.map((activityRecord, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                <ActivityRow>
                  <CopyWrapper>{activityRecord.activity}</CopyWrapper>
                  <SlateCopy>
                    {t(($) => $.creditRatings[activityRecord.rating ?? "none"])}
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
          {t(($) => $.home.monthlyReport.individualReportLink, {
            reportDate: presenter.selectedMonthlyReport.reportStartDate,
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
