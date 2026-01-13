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
import { rem } from "polished";
import React from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import {
  ActivityList,
  ActivityRow,
  HistoryBackButton,
  HomepageSectionHeading,
  RowDivider,
} from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { EGT } from "~@jii/paths";
import { withPresenterManager } from "~hydration-utils";

import { prefixNumberWithSign } from "../../utils";
import { useUsTnSingleResidentDataContext } from "../UsTnSingleResidentDataContext/context";
import { UsTnSingleMonthCreditReportPresenter } from "./UsTnSingleMonthCreditReportPresenter";

const Heading = styled(HomepageSectionHeading)`
  padding-top: ${rem(spacing.lg)};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

function CreditList({ creditEntries }: { creditEntries: [string, number][] }) {
  if (creditEntries.length === 0) {
    return <div>No credits currently on record for this month.</div>;
  }

  return (
    <ActivityList>
      {creditEntries.map(([creditType, creditDays]) => {
        return (
          <React.Fragment key={`${creditType}-${creditDays}`}>
            <RowDivider />
            <ActivityRow>
              <div>{creditType}</div>
              <div>{prefixNumberWithSign(creditDays)} days</div>
            </ActivityRow>
          </React.Fragment>
        );
      })}
    </ActivityList>
  );
}
function ManagedComponent({
  presenter,
}: {
  presenter: UsTnSingleMonthCreditReportPresenter;
}) {
  const { monthlyReport, totalMonthlyCredits, creditEntries, displayMonth } =
    presenter;

  if (!monthlyReport) {
    return <div>Missing credit report for {presenter.monthSlug}</div>;
  }

  return (
    <div>
      <HistoryBackButton />
      <Heading>
        <div>{displayMonth}</div>
        <div>{prefixNumberWithSign(totalMonthlyCredits)} days</div>
      </Heading>
      <CreditList creditEntries={creditEntries} />
    </div>
  );
}

function usePresenter() {
  const { resident } = useSingleResidentContext();
  const { reportDate } = useTypedParams(EGT.MonthlyReport);
  const { monthlyReports } = useUsTnSingleResidentDataContext();

  return new UsTnSingleMonthCreditReportPresenter(
    resident,
    reportDate,
    monthlyReports[reportDate],
  );
}

export const UsTnSingleMonthCreditReport = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: false,
});
