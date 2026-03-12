// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { rgba } from "polished";
import { ThemeProvider } from "styled-components";

import { PathwaysTheme, usePageContent } from "~shared-pathways";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { useRouteSync } from "../../useRouteSync";
import MetricVizMapper from "../MetricVizMapper/MetricVizMapper";
import { PageHeader } from "../PageHeader/PageHeader";
import { useRootStore } from "../StoreProvider";
import { PageContainer } from "./styles";

const CHART_FONT_FAMILY = '"Oswald", sans-serif';

const publicPathwaysTheme: PathwaysTheme = {
  palette: {
    ...publicPathwaysPalette,
  },
  typography: {
    fontFamily: CHART_FONT_FAMILY,
    titleColor: "black",
    axisLabelColor: rgba("black", 0.75),
  },
  checkbox: {
    checkedColor: publicPathwaysPalette.signal.links,
    labelColor: publicPathwaysPalette.pine1,
    titleColor: publicPathwaysPalette.pine1,
  },
};

export const PagePublicPathways = observer(function PagePublicPathways() {
  useRouteSync();
  const { currentTenantId, page, metricsStore } = useRootStore();
  const pageContent = usePageContent(currentTenantId, page);

  return (
    <ThemeProvider theme={publicPathwaysTheme}>
      <PageContainer>
        <PageHeader
          title={pageContent.title}
          description={pageContent.summary}
        />
        <MetricVizMapper metric={metricsStore.current} />
      </PageContainer>
    </ThemeProvider>
  );
});
