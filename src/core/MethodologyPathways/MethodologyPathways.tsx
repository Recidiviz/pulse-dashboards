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

import { observer } from "mobx-react-lite";
import React from "react";
import { useLocation } from "react-router-dom";
import { configureAnchors } from "react-scrollable-anchor";
import { Container } from "reactstrap";

import { useRootStore } from "../../components/StoreProvider";
import { convertToSlug } from "../../utils/navigation";
import { getMethodologyCopy } from "../content";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";
import {
  getMetricIdsForPage,
  getSectionIdForMetric,
  PATHWAYS_VIEWS,
  PathwaysPage,
  PathwaysPageIdList,
} from "../views";
import ContentBlock from "./ContentBlock";

const MethodologyPathways: React.FC = () => {
  const { pathname } = useLocation();
  const view = pathname.split("/")[2];
  const { currentTenantId, userStore } = useRootStore();

  // @ts-ignore
  const Methodology = getMethodologyCopy(currentTenantId)[view];
  const { pageCopy, metricCopy } = Methodology;
  if (!pageCopy || !metricCopy) return <div />;

  const navigationLayout = userStore.userAllowedNavigation;
  // manually override enabled Pages for Practices since it is a
  // static/custom methodology layout
  const enabledPages =
    view === PATHWAYS_VIEWS.practices
      ? ["practicesPercentMethodology", "practicesOverTimeMethodology"]
      : navigationLayout.pathways;

  configureAnchors({ offset: -75 });

  return (
    <PageTemplate mobileNavigation={<MobileNavigation />}>
      <div className="Methodology">
        <Container className="col-md-9 col-12">
          <h1 className="Methodology__main-title">{Methodology.title}</h1>
          <h2 className="Methodology__main-description">
            {Methodology.description}
          </h2>
          <div className=" Methodology__toc col-md-5 col-12">
            <h5 className="Methodology__toc--title">CONTENTS</h5>
            <div className="d-flex flex-column">
              {Object.keys(pageCopy).map((pageId) => {
                const page = pageCopy[pageId];
                if (!page?.title || !enabledPages.includes(pageId))
                  return <div />;
                return (
                  <>
                    <a
                      className="Methodology__toc--link"
                      key={`link${page.title}`}
                      href={`#${convertToSlug(page.title)}`}
                    >
                      {page.title}
                    </a>
                  </>
                );
              })}
            </div>
          </div>
          <div>
            {Object.keys(pageCopy).map((pageId) => {
              const page = pageCopy[pageId as PathwaysPage];
              if (!page?.title || !enabledPages.includes(pageId))
                return <div />;
              // Practices methodology does not have the concept of sections
              const metrics = PathwaysPageIdList.includes(pageId)
                ? getMetricIdsForPage(pageId as PathwaysPage)
                : [];
              const enabledSections = navigationLayout[pageId];
              const metricMethodologies = metrics.map((metricId) => {
                const metric = metricCopy[metricId];
                if (
                  !metric?.title ||
                  !enabledSections.includes(getSectionIdForMetric(metricId))
                )
                  return <div />;
                return <ContentBlock content={metric} />;
              });

              return (
                <>
                  <ContentBlock content={page} />
                  {metricMethodologies}
                </>
              );
            })}
          </div>
        </Container>
      </div>
    </PageTemplate>
  );
};
export default observer(MethodologyPathways);
