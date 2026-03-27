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
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import type { Sections } from "~shared-pathways";
import {
  ChartNote,
  FiltersButton,
  PathwaysSection,
  PathwaysTheme,
  SectionNavigation,
  usePageContent,
} from "~shared-pathways";
import useIsMobile from "~utils/react/useIsMobile";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";
import { useRouteSync } from "../../useRouteSync";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import MetricVizMapper from "../MetricVizMapper/MetricVizMapper";
import { PageTitle } from "../PageTitle/PageTitle";
import { useRootStore } from "../StoreProvider";
import { NavigationRow, PageContainer } from "./styles";

function usePageViews() {
  const location = useLocation();
  const { analyticsStore } = useRootStore();

  useEffect(() => {
    analyticsStore.page(location.pathname);
  }, [analyticsStore, location.pathname]);
}

const TABLET_MAX_VISIBLE = 3;
const MOBILE_MAX_VISIBLE = 1;

const OSWALD_FONT_FAMILY = '"Oswald", sans-serif';
const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

const publicPathwaysTheme: PathwaysTheme = {
  palette: {
    ...publicPathwaysPalette,
  },
  typography: {
    ...publicPathwaysTypography,
    fontFamily: PROXIMA_NOVA_FONT_FAMILY,
    titleColor: "black",
    axisLabel: {
      fontFamily: OSWALD_FONT_FAMILY,
      fontWeight: 500,
      fontSize: "11px",
      lineHeight: "16px",
      letterSpacing: "1%",
      color: rgba("black", 0.75),
      charWidth: 8.5,
    },
  },

  checkbox: {
    checkedColor: publicPathwaysPalette.signal.links,
    labelColor: publicPathwaysPalette.pine1,
    labelTypography: publicPathwaysTypography.Sans14,
    titleColor: publicPathwaysPalette.pine1,
  },
  modal: {
    headerFontFamily: PROXIMA_NOVA_FONT_FAMILY,
    headerFontSize: "18px",
    headerFontWeight: 400,
    headerColor: "black",
    backgroundColor: "white",
    closeButtonColor: "rgba(0, 0, 0, 0.60)",
    closeFocusColor: publicPathwaysPalette.focusColor,
    footerBorderColor: "rgba(0, 0, 0, 0.15)",
    resetColor: "black",
  },
};

export const PagePublicPathways = observer(function PagePublicPathways() {
  usePageViews();
  useRouteSync();
  const rootStore = useRootStore();
  const { currentTenantId, page, section, metricsStore, analyticsStore } =
    rootStore;
  const pageContent = usePageContent(currentTenantId, page);

  const { isMobile, isTablet } = useIsMobile(true);

  let maxVisible;
  if (isMobile) maxVisible = MOBILE_MAX_VISIBLE;
  else if (isTablet) maxVisible = TABLET_MAX_VISIBLE;

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
        <PageTitle
          title={pageContent.title}
          description={pageContent.summary}
          methodologyUrl="https://drive.google.com/file/d/1AkFPJP7721NudPWua39C5F0-Xiz1_b89/view"
        />
        <NavigationRow>
          <SectionNavigation
            sections={sections}
            activeSection={section}
            onSectionSelect={(id) => {
              rootStore.setSection(id);
              const metric = metricsStore.map[id];
              if (metric) {
                analyticsStore.trackMetricSelected({ metricId: metric.id });
              }
            }}
            accentColor={publicPathwaysPalette.signal.links}
            maxVisible={maxVisible}
          />
          <FiltersButton
            filtersStore={rootStore.filtersStore}
            trackApplyFilters={(filters) =>
              analyticsStore.trackApplyFilters({
                metricId: metricsStore.current.id,
                filters,
              })
            }
          />
        </NavigationRow>
        <MetricVizMapper metric={metricsStore.current} />
        <ChartNote note={metricsStore.current?.note} />
        <Footer />
      </PageContainer>
    </ThemeProvider>
  );
});
