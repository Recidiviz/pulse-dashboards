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
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";

import {
  defaultPathwaysTheme,
  getMethodologyCopy,
  getMetricIdsForPage,
  getSectionIdForMetric,
  PathwaysPage,
  PathwaysPageIdList,
} from "~shared-pathways";
import { Methodology, MethodologySection } from "~ui";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";
import { DASHBOARD_VIEWS } from "../views";

const PineColors = styled.div`
  color: ${({ theme }) => theme.palette.pine2};

  h1,
  h2,
  h3,
  h4 {
    color: ${({ theme }) => theme.palette.pine3};
  }
`;

// Opens all external links in a new window
const updateExternalLinks = (): void => {
  const { links } = document;
  for (let i = 0; i < links.length; i += 1) {
    if (links[i].hostname !== window.location.hostname) {
      links[i].target = "_blank";
    }
  }
};

const MethodologyPathways: React.FC = () => {
  const { pathname } = useLocation();
  const view = pathname.split("/")[2];
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { currentTenantId, userStore } =
    useRootStore() as PartiallyTypedRootStore;

  useEffect(() => {
    updateExternalLinks();
  });

  // @ts-ignore
  const methodologyCopy = getMethodologyCopy(currentTenantId)[view];
  const { pageCopy, metricCopy } = methodologyCopy ?? {};

  if (!pageCopy || !metricCopy) return <div />;

  const navigationLayout = userStore.userAllowedNavigation;
  // manually override enabled Pages for Vitals Practices since it is a
  // static/custom methodology layout
  const enabledPages =
    view === DASHBOARD_VIEWS.system
      ? navigationLayout.system
      : ["vitalsPercentMethodology", "vitalsOverTimeMethodology"];

  const sections: MethodologySection[] = Object.keys(pageCopy)
    .filter((pageId) => {
      const page = pageCopy[pageId as PathwaysPage];
      return page?.title && enabledPages.includes(pageId);
    })
    .map((pageId) => {
      const page = pageCopy[pageId as PathwaysPage];
      // Vitals Practices methodology does not have the concept of sections
      const metrics = PathwaysPageIdList.includes(pageId)
        ? getMetricIdsForPage(pageId as PathwaysPage)
        : [];
      const enabledSections = navigationLayout[pageId] ?? [];
      const subsections = metrics
        .filter((metricId) => {
          const metric = metricCopy[metricId];
          return (
            metric?.title &&
            enabledSections.includes(getSectionIdForMetric(metricId))
          );
        })
        .map((metricId) => metricCopy[metricId]);
      return { page, subsections };
    });

  return (
    <PageTemplate mobileNavigation={<MobileNavigation />}>
      <ThemeProvider theme={defaultPathwaysTheme}>
        <PineColors>
          <Methodology
            title={methodologyCopy.title}
            description={methodologyCopy.description}
            descriptionSecondary={methodologyCopy.descriptionSecondary}
            sections={sections}
          />
        </PineColors>
      </ThemeProvider>
    </PageTemplate>
  );
};
export default observer(MethodologyPathways);
