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

import { rem } from "polished";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import {
  ActivityList,
  ActivityRow,
  ActivityRowDivider,
  HistoryBackButton,
  HomepageSectionHeading,
} from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { prefixNumberWithSign } from "../../utils";
import { useUsTnSingleResidentDataContext } from "../UsTnSingleResidentDataContext/context";
import { UsTnAllMonthCreditReportPresenter } from "./UsTnAllMonthCreditReportPresenter";

const Heading = styled(HomepageSectionHeading)`
  padding-top: ${rem(spacing.lg)};
`;

const StyledList = styled(ActivityList)`
  margin-top: ${rem(spacing.xl)};
`;

const StyledRow = styled(ActivityRow)`
  margin-bottom: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
  }
`;

const Year = styled.div`
  font-weight: 600;
  font-size: 1.25rem;
`;

function ManagedComponent({
  presenter,
}: {
  presenter: UsTnAllMonthCreditReportPresenter;
}) {
  const { groupedReportsByYear, orderedYears } = presenter;

  const { stateSlug, personPseudoId } = useTypedParams(
    State.Resident.EGT.AllMonths,
  );

  return (
    <section>
      <HistoryBackButton />
      <Heading>Monthly Sentence Credits</Heading>
      {orderedYears.map((year) => (
        <StyledList key={year}>
          <StyledRow>
            <Year>{year}</Year>
            <div />
          </StyledRow>
          {groupedReportsByYear[year].map((report) => (
            <Fragment key={report.monthSlug}>
              <ActivityRowDivider />

              <Link
                to={State.Resident.EGT.MonthlyReport.buildPath({
                  stateSlug,
                  personPseudoId,
                  reportDate: report.monthSlug,
                })}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <StyledRow>
                  <div>{report.formattedMonth}</div>
                  <div>{prefixNumberWithSign(report.totalCredits)} days</div>
                </StyledRow>
              </Link>
            </Fragment>
          ))}
        </StyledList>
      ))}
    </section>
  );
}

function usePresenter() {
  const { resident } = useSingleResidentContext();
  const { monthlyReports } = useUsTnSingleResidentDataContext();

  return new UsTnAllMonthCreditReportPresenter(resident, monthlyReports);
}

export const UsTnAllMonthsCreditReport = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: false,
});
