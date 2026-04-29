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
import { AnchorProvider } from "react-anchor-navigation";

import {
  getMethodologyCopy,
  getMetricIdsForPage,
  PathwaysPage,
} from "~shared-pathways";
import { Methodology, MethodologySection } from "~ui";
import useIsMobile from "~utils/react/useIsMobile";

import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { useRootStore } from "../StoreProvider";
import { PageContainer, PageMain } from "./styles";

export const PageMethodology = observer(function PageMethodology() {
  const { currentTenantId, metricsStore } = useRootStore();
  const { isMobile } = useIsMobile(true);

  const methodologyCopy = getMethodologyCopy(currentTenantId).system;
  if (!methodologyCopy) return null;

  const { title, description, descriptionSecondary, pageCopy, metricCopy } =
    methodologyCopy;

  const enabledMetricIds = new Set(
    Object.values(metricsStore.map).map((metric) => metric.id),
  );

  const sections: MethodologySection[] = [];
  for (const pageId of Object.keys(pageCopy) as PathwaysPage[]) {
    const page = pageCopy[pageId];
    if (!page?.title) continue;
    const subsections = getMetricIdsForPage(pageId)
      .filter(
        (metricId) =>
          enabledMetricIds.has(metricId) && metricCopy[metricId]?.title,
      )
      .map((metricId) => metricCopy[metricId]);
    if (subsections.length === 0) continue;
    sections.push({ page, subsections });
  }

  return (
    <PageContainer $isMobile={isMobile}>
      <Header hideActions />
      <PageMain>
        <AnchorProvider offset={75}>
          {/* per types this needs to be an array */}
          {[
            <Methodology
              key="methodology"
              title={title}
              description={description}
              descriptionSecondary={descriptionSecondary}
              sections={sections}
              hideTitle
              hideToc
            />,
          ]}
        </AnchorProvider>
      </PageMain>
      <Footer />
    </PageContainer>
  );
});
