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
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { BackLink, CopyWrapper } from "~@jii/common-ui";
import { usePageTitle } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { getMonthlyReportPageSlug } from "../../models/UsMaEGTMonthlyReport";
import { useEGTDataContext } from "../EGTDataContext/context";
import { MonthlyReportSelector } from "../MonthlyReportSelector/MonthlyReportSelector";
import { Achievements } from "./Achievements";
import { ActivityTable } from "./ActivityTable";
import { CreditsByTypeCard } from "./CreditsByTypeCard";
import { MonthlyReportSectionHeading } from "./styles";

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;

  h1 {
    margin: 0;
  }
`;

export const MonthlyReport = observer(function MonthlyReport() {
  const { monthlyReports } = useEGTDataContext();
  const { t } = useUsMaTranslations();

  const { reportDate, personPseudoId, stateSlug } = useTypedParams(
    State.Resident.EGT.MonthlyReport,
  );

  const navigate = useNavigate();

  const report = monthlyReports.find(
    (report) => report.pageSlug === reportDate,
  );

  if (!report) {
    throw new Error();
  }

  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
    achievements,
    reportStartDate,
  } = report;

  const { credits, pageTitle, browserPageTitle } = t(
    ($) => $.individualMonthlyReport,
    {
      reportStartDate,
      returnObjects: true,
    },
  );

  usePageTitle(browserPageTitle);

  return (
    <>
      <BackLink
        {...{
          children: t(($) => $.homeLink),
          to: State.Resident.EGT.buildPath(useTypedParams(State.Resident)),
        }}
      />
      <HeaderRow>
        <CopyWrapper>{`# ${pageTitle}`}</CopyWrapper>
        <MonthlyReportSelector
          selectedReport={report}
          onChange={(value) => {
            navigate(
              State.Resident.EGT.MonthlyReport.buildPath({
                stateSlug,
                personPseudoId,
                reportDate: `${getMonthlyReportPageSlug(value)}`,
              }),
            );
          }}
        />
      </HeaderRow>
      {achievements.length > 0 && <Achievements report={report} />}
      <MonthlyReportSectionHeading>
        {credits.sectionTitle}
      </MonthlyReportSectionHeading>
      <CreditsByTypeCard
        credits={{
          totalEGTCreditDays,
          totalBoostCreditDays,
          totalCompletionCreditDays,
        }}
        marginTopBottom={rem(spacing.lg)}
      />
      {report.creditActivity.length > 0 && <ActivityTable report={report} />}
    </>
  );
});
