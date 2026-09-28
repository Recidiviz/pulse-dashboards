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

import { observer } from "mobx-react-lite";
import styled from "styled-components";

import { usePageTitle } from "~@jii/common-ui";
import { LastUpdatedBanner } from "~@jii/layout";
import { ProgramsCtaSection } from "~@jii/program-catalog";
import { useUsMaTranslations } from "~@jii/translation";

import { Disclaimer } from "../Disclaimer/Disclaimer";
import { useEGTDataContext } from "../EGTDataContext/context";
import { ActivityChart, ActivityChartSkeleton } from "./ActivityChart";
import { DatesSection, DatesSectionSkeleton } from "./DatesSection";
import { EmptyState } from "./EmptyState";
import { MonthlyReportHomepageCard } from "./MonthlyReport/MonthlyReportHomepageCard";
import { MonthlyReportHomepageCardSkeleton } from "./MonthlyReport/MonthlyReportHomepageCardSkeleton";
import { SpanishLaunchBanner } from "./SpanishLaunchBanner";
import { TotalTimeEarnedSection } from "./TotalTimeEarnedSection/TotalTimeEarnedSection";
import { TotalTimeEarnedSectionSkeleton } from "./TotalTimeEarnedSection/TotalTimeEarnedSectionSkeleton";

// additional styles that aren't part of the default SkeletonTheme
const SkeletonMode = styled.div`
  filter: opacity(0.6);
`;

export const Homepage = observer(function Homepage() {
  const { data } = useEGTDataContext();
  const { t } = useUsMaTranslations();
  usePageTitle(t(($) => $.home.pageTitle));

  return (
    <div>
      <LastUpdatedBanner overrideCopy={t(($) => $.lastUpdated, data)} />
      <SpanishLaunchBanner />
      <ProgramsCtaSection stateCode="US_MA" />
      {data.isEgtDisabled ? (
        <>
          <EmptyState />
          <SkeletonMode>
            <DatesSectionSkeleton />
            <ActivityChartSkeleton />
            <MonthlyReportHomepageCardSkeleton />
            <TotalTimeEarnedSectionSkeleton />
          </SkeletonMode>
        </>
      ) : (
        <>
          <DatesSection />
          <ActivityChart />
          <MonthlyReportHomepageCard />
          <TotalTimeEarnedSection />
          <Disclaimer />
        </>
      )}
    </div>
  );
});
