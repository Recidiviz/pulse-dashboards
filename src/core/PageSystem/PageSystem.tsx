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
// ===================== ========================================================

import { observer } from "mobx-react-lite";
import React from "react";

import ChartNote from "../ChartNote";
import { useCoreStore } from "../CoreStoreProvider";
import usePageContent from "../hooks/usePageContent";
import MetricVizMapper from "../MetricVizMapper";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";
import PathwaysFilterBar from "../PathwaysFilterBar/PathwaysFilterBar";
import PathwaysLeftPanel from "../PathwaysLeftPanel";
import { PathwaysPage } from "../views";
import withRouteSync from "../withRouteSync";

const PageSystem: React.FC = () => {
  window.scrollTo({
    top: 0,
  });
  const { metricsStore, page } = useCoreStore();
  const pageContent = usePageContent(page as PathwaysPage);
  if (!pageContent) return <div />;

  const metric = metricsStore.current;
  if (!metric) return <div />;

  const { title, summary } = pageContent;

  return (
    <PageTemplate
      mobileNavigation={<MobileNavigation title={title} />}
      leftPanel={<PathwaysLeftPanel title={title} description={summary} />}
      filters={<PathwaysFilterBar />}
    >
      <MetricVizMapper />
      <ChartNote />
    </PageTemplate>
  );
};

export default withRouteSync(observer(PageSystem));
