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
import { useMemo } from "react";
import { ThemeProvider } from "styled-components";

import type { Sections } from "~shared-pathways";
import {
  ChartNote,
  PathwaysSection,
  PathwaysTheme,
  SectionNavigation,
  usePageContent,
} from "~shared-pathways";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";
import { useRouteSync } from "../../useRouteSync";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import MetricVizMapper from "../MetricVizMapper/MetricVizMapper";
import { PageHeader } from "../PageHeader/PageHeader";
import { useRootStore } from "../StoreProvider";
import { PageContainer } from "./styles";

const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

const publicPathwaysTheme: PathwaysTheme = {
  palette: {
    ...publicPathwaysPalette,
  },
  typography: {
    ...publicPathwaysTypography,
    fontFamily: PROXIMA_NOVA_FONT_FAMILY,
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
  const rootStore = useRootStore();
  const { currentTenantId, page, section, metricsStore } = rootStore;
  const pageContent = usePageContent(currentTenantId, page);

  const sections = useMemo((): Partial<Sections> => {
    const all = pageContent.sections;
    if (!all) return {};

    const metricMap = metricsStore.map;

    return Object.fromEntries(
      (Object.keys(all) as PathwaysSection[])
        .filter((id) => id in metricMap)
        .map((id) => [id, all[id]]),
    ) as Partial<Sections>;
  }, [metricsStore.map, pageContent.sections]);

  return (
    <ThemeProvider theme={publicPathwaysTheme}>
      <PageContainer>
        <Header />
        <PageHeader
          title={pageContent.title}
          description={pageContent.summary}
        />
        <SectionNavigation
          sections={sections}
          activeSection={section}
          onSectionSelect={(id) => rootStore.setSection(id)}
          accentColor={publicPathwaysPalette.signal.links}
        />
        <MetricVizMapper metric={metricsStore.current} />
        <ChartNote note={metricsStore.current?.note} />
        <Footer />
      </PageContainer>
    </ThemeProvider>
  );
});
