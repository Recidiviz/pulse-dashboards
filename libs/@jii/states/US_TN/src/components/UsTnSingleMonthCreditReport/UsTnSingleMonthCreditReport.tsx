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
import { Link } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import {
  ActivityList,
  ActivityRow,
  ActivityRowDivider,
  HomepageSectionHeading,
} from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { EGT, State } from "~@jii/paths";
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

function ManagedComponent({
  presenter,
}: {
  presenter: UsTnSingleMonthCreditReportPresenter;
}) {
  const { monthlyReport, totalMonthlyCredits, creditEntries, displayMonth } =
    presenter;

  const { stateSlug, personPseudoId } = useTypedParams(
    State.Resident.EGT.MonthlyReport,
  );

  if (!monthlyReport) {
    return <div>Missing credit report for {presenter.monthSlug}</div>;
  }

  return (
    <div>
      <Link
        to={State.Resident.buildPath({ stateSlug, personPseudoId })}
        style={{ textDecoration: "none" }}
      >
        Back
      </Link>
      <Heading>
        <div>{displayMonth}</div>
        <div>{prefixNumberWithSign(totalMonthlyCredits)} days</div>
      </Heading>
      <ActivityList>
        {creditEntries.map(([creditType, creditDays]) => {
          return (
            <React.Fragment key={`${creditType}-${creditDays}`}>
              <ActivityRowDivider />
              <ActivityRow>
                <div>{creditType}</div>
                <div>{prefixNumberWithSign(creditDays)} days</div>
              </ActivityRow>
            </React.Fragment>
          );
        })}
      </ActivityList>
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
