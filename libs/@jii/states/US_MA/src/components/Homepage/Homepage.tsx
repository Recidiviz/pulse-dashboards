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
import { useSingleResidentContext } from "~@jii/data";
import { LastUpdatedBanner } from "~@jii/layout";
import { ProgramsCtaSection } from "~@jii/program-catalog";
import { SentenceDates } from "~@jii/sentence-dates";
import { useUsMaTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { Disclaimer } from "../Disclaimer/Disclaimer";
import { useEGTDataContext } from "../EGTDataContext/context";
import { CardsWrapperOverride } from "../SentenceDatesOverrides/CardsWrapperOverride";
import { DateCardBodyWrapperOverride } from "../SentenceDatesOverrides/DateCardBodyWrapperOverride";
import { ActivityChart, ActivityChartSkeleton } from "./ActivityChart";
import { DatesSection, DatesSectionSkeleton } from "./DatesSection";
import { EmptyState } from "./EmptyState";
import { MonthlyReportHomepageCard } from "./MonthlyReport/MonthlyReportHomepageCard";
import { MonthlyReportHomepageCardSkeleton } from "./MonthlyReport/MonthlyReportHomepageCardSkeleton";
import { ResidentHomepagePresenter } from "./ResidentHomepagePresenter";
import { SpanishLaunchBanner } from "./SpanishLaunchBanner";
import { TotalTimeEarnedSection } from "./TotalTimeEarnedSection/TotalTimeEarnedSection";
import { TotalTimeEarnedSectionSkeleton } from "./TotalTimeEarnedSection/TotalTimeEarnedSectionSkeleton";

// additional styles that aren't part of the default SkeletonTheme
const SkeletonMode = styled.div`
  filter: opacity(0.6);
`;

const ManagedComponent: React.FC<{ presenter: ResidentHomepagePresenter }> =
  observer(function Homepage({ presenter }) {
    const { t } = useUsMaTranslations();
    const { residentFlags } = useSingleResidentContext();
    usePageTitle(t(($) => $.home.pageTitle));

    return (
      <div>
        <LastUpdatedBanner
          overrideCopy={t(($) => $.lastUpdated, {
            lastUpdatedDate: presenter.lastUpdatedDate,
          })}
        />
        <SpanishLaunchBanner />
        <ProgramsCtaSection stateCode="US_MA" />
        {presenter.isEgtDisabled ? (
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
            {/* TODO(JII2-47): remove the flag check and DatesSection once usMaSentenceDatesV1 is on for all of US_MA */}
            {residentFlags.usMaSentenceDatesV1 ? (
              <SentenceDates
                data={presenter.sentenceDatesData}
                stateCode="US_MA"
                componentOverrides={{
                  DateCardBodyWrapper: DateCardBodyWrapperOverride,
                  CardsWrapper: CardsWrapperOverride,
                }}
              />
            ) : (
              <DatesSection />
            )}
            <ActivityChart />
            <MonthlyReportHomepageCard />
            <TotalTimeEarnedSection />
            <Disclaimer />
          </>
        )}
      </div>
    );
  });

function usePresenter() {
  return new ResidentHomepagePresenter(useEGTDataContext().data);
}
export const Homepage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
