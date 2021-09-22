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

import "./PagePathways.scss";

import { observer } from "mobx-react-lite";
import React from "react";

import withRouteSync from "../../withRouteSync";
import ChartNote from "../ChartNote";
import { useCoreStore } from "../CoreStoreProvider";
import usePageContent from "../hooks/usePageContent";
import MetricVizMapper from "../MetricVizMapper";
import PageTemplate from "../PageTemplate";
import PathwaysFilterBar from "../PathwaysFilterBar";
import PathwaysLeftPanel from "../PathwaysLeftPanel";
import filterOptions from "../utils/filterOptions";
import { PathwaysPage } from "../views";

const PagePathways: React.FC = () => {
  const { currentTenantId, metricsStore, page } = useCoreStore();
  const pageContent = usePageContent(page as PathwaysPage);
  if (!pageContent) return <div />;

  const { title, summary } = pageContent;

  const metric = metricsStore.current;
  const { enabledFilters, download, isLoading, note } = metric;

  return (
    <PageTemplate
      leftPanel={<PathwaysLeftPanel title={title} description={summary} />}
      filters={
        <PathwaysFilterBar
          // @ts-ignore
          filterOptions={filterOptions[currentTenantId]}
          enabledFilters={enabledFilters}
          handleDownload={download}
        />
      }
    >
      <div className="PagePathways">
        <MetricVizMapper metric={metric} />
        <ChartNote note={note} isLoading={isLoading} />
      </div>
    </PageTemplate>
  );
};

export default withRouteSync(observer(PagePathways));
