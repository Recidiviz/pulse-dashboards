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
import { rem } from "polished";
import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";

import { palette, spacing } from "~design-system";
import {
  ChartNote,
  defaultPathwaysTheme,
  FiltersButton,
  metricModeOptions,
  PathwaysPage,
  PathwaysSection,
  SectionNavigation,
  Sections,
  usePageContent,
} from "~shared-pathways";
import { convertToSlug } from "~ui";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { useCoreStore } from "../CoreStoreProvider";
import DownloadDataButton from "../DownloadDataButton";
import MethodologyLink from "../MethodologyLink";
import MetricVizMapper from "../MetricVizMapper";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";
import { DASHBOARD_PATHS, DASHBOARD_VIEWS } from "../views";
import withRouteSync from "../withRouteSync";

const PAGE_WIDTH = 991;

const PageWidthContainer = styled.div`
  max-width: ${PAGE_WIDTH}px;
  width: 100%;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-family: "Libre Baskerville", "Libre Bodoni", "Gentium", serif;
  font-size: 2.125rem;
  line-height: 1.2;
  color: ${palette.pine3};
  margin: 0 0 0.5rem;
  padding-top: ${rem(spacing.xl)};
`;

const PageDescription = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: ${palette.slate80};
  margin: 0 0 1.5rem;
`;

const NavigationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 1.25rem 0;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
`;

const MOBILE_MAX_VISIBLE = 1;
const TABLET_MAX_VISIBLE = 3;

const PageSystem: React.FC = () => {
  window.scrollTo({
    top: 0,
  });
  const navigate = useNavigate();
  const { isMobile, isTablet } = useIsMobile(true);

  let maxVisible: number | undefined;
  if (isMobile) maxVisible = MOBILE_MAX_VISIBLE;
  else if (isTablet) maxVisible = TABLET_MAX_VISIBLE;
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { userStore } = useRootStore() as PartiallyTypedRootStore;
  const {
    metricsStore,
    page,
    section,
    setSection,
    filtersStore,
    currentTenantId,
  } = useCoreStore();
  const pageContent = usePageContent(currentTenantId, page as PathwaysPage);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const allSections = pageContent?.sections;
  const enabledSections: PathwaysSection[] = useMemo(
    () => userStore.userAllowedNavigation?.[page] ?? [],
    [userStore.userAllowedNavigation, page],
  );

  const sections: Partial<Sections> = useMemo(() => {
    if (!allSections) return {};
    return Object.fromEntries(
      enabledSections
        .filter((id) => id in allSections)
        .map((id) => [id, allSections[id]]),
    ) as Partial<Sections>;
  }, [allSections, enabledSections]);

  const title = pageContent?.title;
  useEffect(() => {
    titleRef.current?.focus();
  }, [title]);

  if (!pageContent) return <div />;

  const metric = metricsStore.current;
  if (!metric) return <div />;

  const { summary } = pageContent;
  const { download, note } = metric;

  const onSectionSelect = (id: PathwaysSection) => {
    setSection(id);
    navigate(`/${DASHBOARD_VIEWS.system}/${page}/${id}`);
  };

  const methodologyLink = {
    pathname: DASHBOARD_PATHS.methodologySystem,
    hash: convertToSlug(metric.chartTitle || ""),
    search: `?stateCode=${currentTenantId}`,
  };

  return (
    <ThemeProvider theme={defaultPathwaysTheme}>
      <PageTemplate mobileNavigation={<MobileNavigation title={title ?? ""} />}>
        <PageWidthContainer>
          <PageTitle ref={titleRef} tabIndex={-1} id="page-title">
            {title}
          </PageTitle>
          <PageDescription id="page-description">{summary}</PageDescription>
          <NavigationRow aria-label="Section and filter controls">
            {enabledSections.length > 1 && (
              <SectionNavigation
                sections={sections}
                activeSection={section}
                onSectionSelect={onSectionSelect}
                maxVisible={maxVisible ?? 4}
              />
            )}
            <ActionGroup>
              <FiltersButton
                filtersStore={filtersStore}
                enableMetricModeToggle={metric.enableMetricModeToggle}
                metricModeOptions={metricModeOptions}
              />
              <DownloadDataButton handleOnClick={download} />
              <MethodologyLink
                path={DASHBOARD_PATHS.methodologySystem}
                chartTitle={metric.chartTitle}
              />
            </ActionGroup>
          </NavigationRow>
          <MetricVizMapper metric={metric} />
          <ChartNote note={note} methodologyLink={methodologyLink} />
        </PageWidthContainer>
      </PageTemplate>
    </ThemeProvider>
  );
};

export default withRouteSync(observer(PageSystem));
