// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "../DetailsGroup.scss";
import "./PagePractices.scss";

import { Loading } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";
import { useLocation } from "react-router-dom";

import useIsMobile from "../../hooks/useIsMobile";
import { useCoreStore } from "../CoreStoreProvider";
import DetailsGroup from "../DetailsGroup";
import DownloadDataButton from "../DownloadDataButton";
import MethodologyLink from "../MethodologyLink";
import MobileNavigation from "../MobileNavigation";
import { ENTITY_TYPES } from "../models/types";
import PageTemplate from "../PageTemplate";
import PracticesCaseloadButton from "../PracticesCaseloadButton";
import PracticesMonthlyChange from "../PracticesMonthlyChange";
import PracticesSummaryBreadcrumbs from "../PracticesSummaryBreadcrumbs";
import PracticesSummaryCards from "../PracticesSummaryCards";
import PracticesSummaryChart from "../PracticesSummaryChart";
import PracticesSummaryDetail from "../PracticesSummaryDetail";
import PracticesSummaryTable from "../PracticesSummaryTable/PracticesSummaryTable";
import { CORE_PATHS } from "../views";
import withRouteSync from "../withRouteSync";

const PagePractices: React.FC = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const currentView = pathname.split("/")[1].toLowerCase();
  const isCoreView = currentView === "community";
  const displayHeader = isCoreView || (!isCoreView && !isMobile);

  const { metricsStore, pagePracticesStore } = useCoreStore();
  const { isLoading, isError } = metricsStore.practices;
  const {
    currentEntitySummary,
    downloadData,
    childEntitySummaryRows,
  } = pagePracticesStore;

  window.scrollTo({
    top: 0,
  });

  // TODO: add in Error state
  if (isError) {
    return null;
  }

  if (isLoading || currentEntitySummary === undefined) {
    return (
      <PageTemplate>
        <div className="Loading__container">
          <Loading />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate mobileNavigation={<MobileNavigation />}>
      {displayHeader && (
        <div className="PagePractices__header">
          <PracticesSummaryBreadcrumbs />
          <DetailsGroup>
            <DownloadDataButton handleOnClick={downloadData} />
            <MethodologyLink path={CORE_PATHS.methodologyPractices} />
          </DetailsGroup>
        </div>
      )}

      <div className="PagePractices__SummaryCards">
        <PracticesSummaryCards />
      </div>
      {isMobile && !isCoreView && (
        <DetailsGroup>
          <DownloadDataButton handleOnClick={downloadData} />
          <MethodologyLink path={CORE_PATHS.methodologyPractices} />
        </DetailsGroup>
      )}
      <div className="PagePractices__SummarySection">
        <div className="PagePractices__SummaryDetail">
          <PracticesSummaryDetail />
        </div>
        <div className="PagePractices__SummaryChart">
          <PracticesMonthlyChange />
          <PracticesSummaryChart />
        </div>
      </div>
      <div className="PagePractices__CaseloadButton">
        <PracticesCaseloadButton />
      </div>
      <div className="PagePractices__Table">
        {currentEntitySummary.entityType !== ENTITY_TYPES.PO &&
          childEntitySummaryRows.length > 0 && <PracticesSummaryTable />}
      </div>
    </PageTemplate>
  );
};

export default withRouteSync(observer(PagePractices));
