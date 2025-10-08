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

import { FullWidthBanner, usePageTitle } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";

import { Disclaimer } from "../Disclaimer/Disclaimer";
import { useEGTDataContext } from "../EGTDataContext/context";
import { SkeletonThemeProvider } from "../SkeletonThemeProvider";
import { ActivityChart, ActivityChartSkeleton } from "./ActivityChart";
import { DatesSection } from "./DatesSection";
import { DatesSectionSkeleton } from "./DatesSection";
import { EmptyState } from "./EmptyState";
import { MonthlyReportHomepageCard } from "./MonthlyReport/MonthlyReportHomepageCard";
import { MonthlyReportHomepageCardSkeleton } from "./MonthlyReport/MonthlyReportHomepageCardSkeleton";
import { TotalTimeEarnedSection } from "./TotalTimeEarnedSection/TotalTimeEarnedSection";
import { TotalTimeEarnedSectionSkeleton } from "./TotalTimeEarnedSection/TotalTimeEarnedSectionSkeleton";

export const Homepage = observer(function Homepage() {
  const { data } = useEGTDataContext();
  const { t } = useUsMaTranslations();

  usePageTitle(t(($) => $.home.pageTitle));

  return (
    <div>
      <FullWidthBanner>{t(($) => $.lastUpdated, data)}</FullWidthBanner>
      {data.isEgtDisabled ? (
        <>
          <EmptyState />
          <SkeletonThemeProvider className="skeleton-mode">
            <DatesSectionSkeleton />
            <ActivityChartSkeleton />
            <MonthlyReportHomepageCardSkeleton />
            <TotalTimeEarnedSectionSkeleton />
          </SkeletonThemeProvider>
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
