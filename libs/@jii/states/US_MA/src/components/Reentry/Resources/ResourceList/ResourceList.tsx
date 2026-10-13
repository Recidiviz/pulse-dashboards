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

import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { usePageTitle } from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { CollapsibleSection } from "../CollapsibleSection/CollapsibleSection";
import { ResourceCard } from "../ResourceCard/ResourceCard";
import { groupResourcesBySubcategory } from "../utils";
import {
  AccordionItem,
  AccordionList,
  EmptyState,
  PageHeader,
  PageSubtitle,
  PageTitle,
  ResourceCount,
  ResourceList as ResourceListWrapper,
  Wrapper,
} from "./ResourceList.styles";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const ResourceList = () => {
  const { t } = useUsMaTranslations();
  usePageTitle(t(($) => $.reentry.resources.list.pageTitle));

  const {
    apiClient: { trpcQuerier },
  } = useRootStore();
  // TODO(REE-182): Replace with useUsMaResources once the filter config lands.
  const { data } = useSuspenseQuery({
    ...trpcQuerier.resident.resources.getResources.queryOptions(),
    staleTime: ONE_HOUR_MS,
  });

  const { category, ...residentParams } = useTypedParams(
    State.Resident.UsMaReentry.Resources.CategoryResults,
  );
  const location = useLocation();

  const sections = groupResourcesBySubcategory(data, category);
  const resourceCount = new Set(
    sections.flatMap(([, resources]) =>
      resources.map((resource) => resource.organizationId),
    ),
  ).size;

  const categoryResultsPath =
    State.Resident.UsMaReentry.Resources.CategoryResults.buildPath({
      ...residentParams,
      category,
    });

  const listUrlWithFilters = encodeURIComponent(
    `${categoryResultsPath}${location.search}`,
  );

  const detailPath = (resourceId: number) => {
    const path =
      State.Resident.UsMaReentry.Resources.CategoryResults.Detail.buildPath({
        ...residentParams,
        category,
        resourceId,
      });
    return `${path}?backTarget=${listUrlWithFilters}`;
  };

  return (
    <Wrapper>
      <PageHeader>
        <PageTitle>{t(($) => $.reentry.resources.list.pageTitle)}</PageTitle>
        <PageSubtitle>
          {t(($) => $.reentry.resources.list.subtitle)}
        </PageSubtitle>
      </PageHeader>

      {sections.length === 0 ? (
        <EmptyState>{t(($) => $.reentry.resources.list.emptyState)}</EmptyState>
      ) : (
        <div>
          <ResourceCount>
            {t(($) => $.reentry.resources.list.resultCount, {
              count: resourceCount,
            })}
          </ResourceCount>
          <AccordionList>
            {sections.map(([subcategory, resources]) => (
              <AccordionItem key={subcategory}>
                <CollapsibleSection
                  title={subcategory}
                  badgeLabel={t(($) => $.reentry.resources.list.sectionCount, {
                    count: resources.length,
                  })}
                  headerBorder
                >
                  <ResourceListWrapper>
                    {resources.map((resource) => (
                      <ResourceCard
                        key={resource.organizationId}
                        name={resource.name}
                        to={detailPath(resource.organizationId)}
                      />
                    ))}
                  </ResourceListWrapper>
                </CollapsibleSection>
              </AccordionItem>
            ))}
          </AccordionList>
        </div>
      )}
    </Wrapper>
  );
};
