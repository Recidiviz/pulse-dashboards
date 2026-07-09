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
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import type { Sections } from "~shared-pathways";
import {
  ChartNote,
  FiltersButton,
  metricModeOptions,
  PathwaysSection,
  SectionNavigation,
  usePageContent,
} from "~shared-pathways";
import useIsMobile from "~utils/react/useIsMobile";

import { COMING_SOON_SECTIONS_BY_TENANT } from "../../datastores/comingSoonSections";
import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { useRouteSync } from "../../useRouteSync";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import MetricVizMapper from "../MetricVizMapper/MetricVizMapper";
import { PageTitle } from "../PageTitle/PageTitle";
import { useRootStore } from "../StoreProvider";
import { NavigationRow, PageContainer, PageMain, SectionNav } from "./styles";

function usePageViews() {
  const location = useLocation();
  const { analyticsStore } = useRootStore();

  useEffect(() => {
    analyticsStore.page(location.pathname);
  }, [analyticsStore, location.pathname]);
}

const TABLET_MAX_VISIBLE = 3;
const MOBILE_MAX_VISIBLE = 1;

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

  const { sections, comingSoonSections } = useMemo(() => {
    const all = pageContent.sections;
    if (!all)
      return { sections: {} as Partial<Sections>, comingSoonSections: [] };

    const metricMap = metricsStore.map;
    const allIds = Object.keys(all) as PathwaysSection[];

    return {
      sections: Object.fromEntries(
        allIds.filter((id) => id in metricMap).map((id) => [id, all[id]]),
      ) as Partial<Sections>,
      comingSoonSections: allIds
        .filter(
          (id) =>
            (COMING_SOON_SECTIONS_BY_TENANT[currentTenantId] ?? new Set()).has(
              id,
            ) && !(id in metricMap),
        )
        .map((id) => all[id] as string),
    };
  }, [currentTenantId, metricsStore.map, pageContent.sections]);

  return (
    <PageContainer $isMobile={isMobile}>
      <Header />
      <PageMain>
        <PageTitle
          title={pageContent.title}
          description={pageContent.summary}
          methodologyTo="/methodology"
        />
        <NavigationRow>
          <SectionNav aria-label="Section navigation">
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
              comingSoonSections={comingSoonSections}
            />
          </SectionNav>
          <FiltersButton
            filtersStore={rootStore.filtersStore}
            trackApplyFilters={(filters) =>
              analyticsStore.trackApplyFilters({
                metricId: metricsStore.current.id,
                filters,
              })
            }
            enableMetricModeToggle={metricsStore.current.enableMetricModeToggle}
            metricModeOptions={metricModeOptions}
          />
        </NavigationRow>
        <div aria-live="polite">
          <MetricVizMapper metric={metricsStore.current} />
          <ChartNote note={metricsStore.current?.note} />
        </div>
      </PageMain>
      <Footer />
    </PageContainer>
  );
});
