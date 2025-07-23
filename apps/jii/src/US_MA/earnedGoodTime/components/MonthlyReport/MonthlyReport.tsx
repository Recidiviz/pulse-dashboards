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

import { CopyWrapper } from "../../../../components/CopyWrapper/CopyWrapper";
import { usePageTitle } from "../../../../components/usePageTitle/usePageTitle";
import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { State } from "../../../../routes/routes";
import { getMonthlyReportPageSlug } from "../../models/UsMaEGTMonthlyReport";
import { BackLink } from "../BackLink/BackLink";
import { useEGTDataContext } from "../EGTDataContext/context";
import { reportSelectOptions } from "../Homepage/MonthlyReport/MonthlyReportPresenter";
import { MonthlyReportSelector } from "../Homepage/MonthlyReport/MonthlyReportSelector";
import { Achievements } from "./Achievements";
import { ActivityTable } from "./ActivityTable";
import { CreditsByDate } from "./CreditsByDate";
import { CreditsByTypeCard } from "./CreditsByTypeCard";
import { MonthlyReportSectionHeading } from "./styles";

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const MonthlyReport = observer(function MonthlyReport() {
  const { copy, monthlyReports } = useEGTDataContext();

  const { reportDate, personPseudoId, stateSlug } = useTypedParams(
    State.Resident.EGT.MonthlyReport,
  );

  const {
    individualMonthlyReport: {
      credits,
      pageTitle,
      browserPageTitle,
      achievements: achievementsCopy,
    },
  } = copy;

  const navigate = useNavigate();

  const report = monthlyReports.find(
    (report) => report.pageSlug === reportDate,
  );

  if (!report) {
    throw new Error();
  }

  usePageTitle(
    hydrateTemplate(browserPageTitle, {
      reportDisplayName: report.fullDisplayName,
    }),
  );

  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
    achievements,
  } = report;

  return (
    <>
      <BackLink
        {...{
          children: copy.homeLink,
          to: State.Resident.EGT.buildPath(useTypedParams(State.Resident)),
        }}
      />
      <HeaderRow>
        <CopyWrapper>{`# ${pageTitle}`}</CopyWrapper>
        <MonthlyReportSelector
          placeholder={report.displayName}
          options={reportSelectOptions(monthlyReports)}
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
      {achievements.length > 0 && (
        <Achievements copy={achievementsCopy} report={report} />
      )}
      <MonthlyReportSectionHeading>
        {hydrateTemplate(credits.sectionTitle, {
          monthDisplayName: report.monthDisplayName,
        })}
      </MonthlyReportSectionHeading>
      <CreditsByTypeCard
        copy={credits}
        credits={{
          totalEGTCreditDays,
          totalBoostCreditDays,
          totalCompletionCreditDays,
        }}
        marginTopBottom={rem(spacing.lg)}
      />
      {report.creditActivity.length > 0 && (
        <ActivityTable copy={copy} report={report} />
      )}
      <CreditsByDate copy={copy} report={report} />
    </>
  );
});
